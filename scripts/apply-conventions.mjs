#!/usr/bin/env node
/**
 * apply-conventions.mjs
 *
 * Riallinea il progetto alle convenzioni dichiarate:
 *   1. Ordine dei blocchi nei file .vue -> template, script, style
 *   2. Variabili CSS accentrate in un unico :root con prefissi
 *      --color- / --space- / --radius- (invece di --wg-*, --col, --radius
 *      duplicati in più file)
 *
 * Non tocca la logica applicativa: sposta blocchi interi e rinomina
 * variabili CSS, non riscrive alcuna riga di JavaScript/TypeScript.
 *
 * Uso:
 *   node scripts/apply-conventions.mjs           # applica le modifiche
 *   node scripts/apply-conventions.mjs --dry-run  # mostra cosa farebbe, senza scrivere nulla
 *
 * Sicurezza:
 *   - Si rifiuta di partire se la working tree git non è pulita, così ogni
 *     modifica resta facilmente annullabile con `git checkout -- .` o `git reset --hard`.
 *   - A fine corsa lancia `npm run typecheck` e `npm run build` e segnala
 *     chiaramente se qualcosa si è rotto.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = process.cwd();

function log(msg) {
  console.log(msg);
}

function assertCleanGitTree() {
  try {
    const status = execSync("git status --porcelain", { cwd: ROOT }).toString();
    if (status.trim().length > 0) {
      console.error(
        "\nLa working tree git non è pulita. Fai commit o stash delle modifiche prima di lanciare lo script,\n" +
          "così puoi annullare tutto con `git checkout -- .` se qualcosa non ti convince.\n"
      );
      process.exit(1);
    }
  } catch {
    console.error(
      "\nNon sembra esserci un repo git qui. Lo script funziona anche senza, ma senza git\n" +
        "non hai un modo semplice per annullare le modifiche. Continua solo se hai un backup.\n"
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. Riordino dei blocchi nei file .vue: template -> script -> style
// ---------------------------------------------------------------------------

// Nota: <template> può comparire nidificato dentro sé stesso nel markup Vue
// (es. <template v-for="..."> per raggruppare senza un nodo radice), quindi
// non possiamo affidarci a un regex "non-greedy" ingenuo: serve un vero
// scanner che tenga il conto della profondità di annidamento e si fermi solo
// quando il tag di apertura di primo livello si chiude.
const TOP_TAG_OPEN_RE = /^[ \t]*<(template|script|style)(\s[^>]*)?>/;

function findTopLevelBlocks(content) {
  const blocks = [];
  let i = 0;
  const n = content.length;

  while (i < n) {
    const restFromLineStart = content.slice(i);
    const openMatch = restFromLineStart.match(TOP_TAG_OPEN_RE);
    if (!openMatch || openMatch.index !== 0) {
      // Non siamo all'inizio di un blocco di primo livello: se c'è altro
      // testo non bianco prima del prossimo blocco, ce ne accorgeremo dopo.
      const nextLineBreak = content.indexOf("\n", i);
      if (nextLineBreak === -1) break;
      i = nextLineBreak + 1;
      continue;
    }

    const tag = openMatch[1];
    const openTagText = openMatch[0];
    const blockStart = i;
    const tagRe = new RegExp(`<${tag}(\\s[^>]*)?>|<\\/${tag}>`, "g");
    tagRe.lastIndex = i + openTagText.length;

    let depth = 1;
    let m;
    let blockEnd = -1;
    while ((m = tagRe.exec(content)) !== null) {
      if (m[0].startsWith("</")) {
        depth -= 1;
        if (depth === 0) {
          blockEnd = m.index + m[0].length;
          break;
        }
      } else {
        depth += 1;
      }
    }

    if (blockEnd === -1) {
      // Tag non richiuso correttamente: meglio abortire che indovinare.
      return null;
    }

    blocks.push({ tag, text: content.slice(blockStart, blockEnd), start: blockStart, end: blockEnd });
    i = blockEnd;
  }

  return blocks;
}

function reorderBlocks(content, filePath) {
  const blocks = findTopLevelBlocks(content);
  if (blocks === null) {
    log(`  ! ${filePath}: tag non bilanciati, file saltato`);
    return null;
  }

  const byTag = { template: [], script: [], style: [] };
  for (const b of blocks) byTag[b.tag].push(b.text);

  if (byTag.template.length > 1) {
    log(`  ! ${filePath}: più di un blocco <template> di primo livello, file saltato`);
    return null;
  }
  if (byTag.script.length > 1) {
    log(`  ! ${filePath}: più di un blocco <script> di primo livello, file saltato`);
    return null;
  }

  if (blocks.length === 0) return null; // niente da riordinare

  // Verifica che non ci sia contenuto significativo fuori dai blocchi trovati
  // (a parte spazi bianchi tra un blocco e l'altro): se c'è, meglio saltare
  // il file che rischiare di perdere qualcosa.
  let cursor = 0;
  let outside = "";
  for (const b of blocks) {
    outside += content.slice(cursor, b.start);
    cursor = b.end;
  }
  outside += content.slice(cursor);
  if (outside.trim().length > 0) {
    log(`  ! ${filePath}: testo fuori dai blocchi <template>/<script>/<style>, file saltato`);
    return null;
  }

  const ordered = [...byTag.template, ...byTag.script, ...byTag.style];
  const next = ordered.join("\n\n") + "\n";

  return next === content ? null : next;
}

// ---------------------------------------------------------------------------
// 2. Normalizzazione delle variabili CSS
// ---------------------------------------------------------------------------

// Ordine importante: le chiavi più lunghe/specifiche vanno sostituite prima
// (es. --wg-border-filled prima di --wg-border), altrimenti la sostituzione
// più corta "mangia" un pezzo di quella più lunga.
const VAR_RENAME_MAP = [
  ["--wg-border-filled", "--color-border-filled"],
  ["--wg-text", "--color-text"],
  ["--wg-dim", "--color-text-dim"],
  ["--wg-border", "--color-border"],
  ["--wg-surface", "--color-surface"],
  ["--wg-correct", "--color-correct"],
  ["--wg-present", "--color-present"],
  ["--wg-absent", "--color-absent"],
  ["--wg-urgent", "--color-urgent"],
  ["--wg-gap", "--space-gap"],
  ["--wg-radius", "--radius-base"],
  ["--col", "--space-col"],
  ["--radius", "--radius-base"],
];

// Le dichiarazioni locali che diventano ridondanti una volta centralizzate
// in :root. Rimuoviamo solo la riga di dichiarazione (proprietà: valore;),
// non il commento sopra o il resto della regola.
const LOCAL_DECLARATION_RE = new RegExp(
  String.raw`^[ \t]*--(?:wg-[a-z-]+|col|radius):[^;]*;[ \t]*(?:\/\*[^*]*\*\/)?[ \t]*\n`,
  "gm"
);

function renameVars(content) {
  let next = content;
  for (const [oldName, newName] of VAR_RENAME_MAP) {
    // \b non funziona bene con "--", quindi delimitiamo a mano: il nome non
    // deve essere seguito da un carattere valido di identificatore CSS
    // (lettera, cifra o trattino), altrimenti "--wg-border" matcherebbe anche
    // dentro "--wg-border-filled" già sostituito.
    const re = new RegExp(
      escapeRegExp(oldName) + String.raw`(?![a-zA-Z0-9-])`,
      "g"
    );
    next = next.replace(re, newName);
  }
  return next;
}

function stripLocalDeclarations(content) {
  return content.replace(LOCAL_DECLARATION_RE, "");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TOKENS_CSS = `/* Design tokens centralizzati. Generato da scripts/apply-conventions.mjs
   a partire dai valori prima duplicati in WordpaceGame.vue e index.vue. */
:root {
  --color-text: #1a1a1a;
  --color-text-dim: #6e7275;
  --color-border: #d3d6da;
  --color-border-filled: #878a8c;
  --color-surface: #f6f7f8;
  --color-correct: #5f9e58;
  --color-present: #ab8f3a;
  --color-absent: #787c7e;
  --color-urgent: #d0342c;

  --space-gap: 5px;
  --space-col: 26rem;

  --radius-base: 4px;
}
`;

function ensureTokensFile() {
  const tokensPath = path.join(ROOT, "app/assets/css/tokens.css");
  if (existsSync(tokensPath)) {
    log("  - app/assets/css/tokens.css esiste già, non lo sovrascrivo");
    return;
  }
  if (DRY_RUN) {
    log(`  + creerei ${path.relative(ROOT, tokensPath)}`);
    return;
  }
  mkdirSync(path.dirname(tokensPath), { recursive: true });
  writeFileSync(tokensPath, TOKENS_CSS, "utf8");
  log(`  + creato ${path.relative(ROOT, tokensPath)}`);
}

function ensureNuxtConfigImportsTokens() {
  const configPath = path.join(ROOT, "nuxt.config.ts");
  if (!existsSync(configPath)) {
    log("  ! nuxt.config.ts non trovato, aggiungi a mano css: ['~/assets/css/tokens.css']");
    return;
  }
  const original = readFileSync(configPath, "utf8");
  if (original.includes("tokens.css")) {
    log("  - nuxt.config.ts importa già tokens.css");
    return;
  }
  const injected = original.replace(
    /defineNuxtConfig\(\{/,
    `defineNuxtConfig({\n  css: ['~/assets/css/tokens.css'],`
  );
  if (injected === original) {
    log("  ! non sono riuscito a inserire l'import in nuxt.config.ts, fallo a mano:");
    log("    css: ['~/assets/css/tokens.css'],");
    return;
  }
  if (DRY_RUN) {
    log("  + aggiungerei css: ['~/assets/css/tokens.css'] a nuxt.config.ts");
    return;
  }
  writeFileSync(configPath, injected, "utf8");
  log("  + aggiunto css: ['~/assets/css/tokens.css'] a nuxt.config.ts");
}

// ---------------------------------------------------------------------------
// Utility: trova tutti i .vue sotto app/ (senza dipendere da fs.globSync,
// disponibile solo da Node 22 in su, mentre il progetto richiede Node 20+)
// ---------------------------------------------------------------------------

function findVueFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findVueFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".vue")) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Esecuzione
// ---------------------------------------------------------------------------

function main() {
  if (!DRY_RUN) assertCleanGitTree();

  log(DRY_RUN ? "Modalità --dry-run: nessun file verrà scritto.\n" : "Applico le modifiche...\n");

  log("1) Design tokens (:root centralizzato)");
  ensureTokensFile();
  ensureNuxtConfigImportsTokens();

  const appDir = path.join(ROOT, "app");
  const vueFiles = existsSync(appDir) ? findVueFiles(appDir) : [];
  if (vueFiles.length === 0) {
    log("  ! nessun file .vue trovato sotto app/, controlla di lanciare lo script dalla root del progetto");
  }

  log("\n2) Rinomina variabili CSS + rimozione dichiarazioni locali duplicate");
  for (const filePath of vueFiles) {
    const rel = path.relative(ROOT, filePath);
    const original = readFileSync(filePath, "utf8");
    // Importante: la rimozione delle dichiarazioni locali deve avvenire PRIMA
    // della rinomina, perché il suo regex riconosce ancora i vecchi nomi
    // (--wg-*, --col, --radius) così com'erano scritti nel file originale.
    let next = stripLocalDeclarations(original);
    next = renameVars(next);
    if (next !== original) {
      log(`  ~ ${rel}: variabili normalizzate`);
      if (!DRY_RUN) writeFileSync(filePath, next, "utf8");
    }
  }

  log("\n3) Riordino blocchi -> template, script, style");
  for (const filePath of vueFiles) {
    const rel = path.relative(ROOT, filePath);
    const content = readFileSync(filePath, "utf8");
    const next = reorderBlocks(content, rel);
    if (next) {
      log(`  ~ ${rel}: blocchi riordinati`);
      if (!DRY_RUN) writeFileSync(filePath, next, "utf8");
    }
  }

  if (DRY_RUN) {
    log("\nDry-run completato. Rilancia senza --dry-run per applicare davvero.");
    return;
  }

  log("\n4) Verifica che non si sia rotto nulla (typecheck + build)");
  try {
    execSync("npm run typecheck", { cwd: ROOT, stdio: "inherit" });
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
    log(
      "\nFatto. typecheck e build passano. Controlla comunque i diff (`git diff`) prima di" +
        " fare commit, specialmente i commenti CSS rimasti vicino alle variabili spostate."
    );
  } catch {
    console.error(
      "\ntypecheck o build hanno fallito dopo le modifiche.\n" +
        "Annulla tutto con: git checkout -- . && git clean -fd app/assets\n" +
        "e segnalami cosa è andato storto prima di riprovare."
    );
    process.exit(1);
  }
}

main();
