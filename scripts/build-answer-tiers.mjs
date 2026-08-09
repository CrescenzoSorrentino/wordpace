// Riscrive shared/words/answer-words.ts diviso nelle tre fasce di frequenza,
// leggendo l'etichetta `level` da shared/words/definitions.ts.
//
// Perché serve uno script invece di leggere le etichette a runtime: il file
// delle definizioni pesa 449 KB e sta apposta solo sul server (vedi il README),
// mentre la parola va scelta nel browser, all'istante, senza chiamate di rete.
// Qui l'informazione utile — a quale fascia appartiene ogni parola — viene
// estratta una volta sola e salvata in un file da 19 KB che il browser può
// scaricare senza accorgersene.
//
// Da rilanciare solo se cambia il dizionario:
//   node scripts/build-answer-tiers.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(here, "..");
const DEFINITIONS = join(PROJECT, "shared/words/definitions.ts");
const OUT = join(PROJECT, "shared/words/answer-words.ts");

const LEVELS = ["common", "uncommon", "rare"];

// === Le parole di partenza, prese dal file che stiamo per riscrivere ===
// Si leggono da lì e non da scripts/.cache/words.txt perché la cache è
// git-ignorata: così lo script funziona anche su una copia appena clonata.
const previous = readFileSync(OUT, "utf8");
const words = [...previous.matchAll(/"([a-z]{5})"/g)].map((m) => m[1]);
const unique = [...new Set(words)].sort();

if (unique.length !== words.length) {
  console.log(`⚠️  ${words.length - unique.length} parole ripetute, tolte.`);
}

// === L'etichetta di ogni parola, letta dal dizionario ===
// Lettura riga per riga invece di un'espressione regolare su tutto il file: le
// voci sono a blocchi di sei righe e una regex che le attraversi diventa
// illeggibile. Il file è generato, quindi la forma è garantita.
const levels = {};
let current = null;
for (const line of readFileSync(DEFINITIONS, "utf8").split("\n")) {
  const entry = line.match(/^ {2}([a-z]{5}): \{$/);
  if (entry) {
    current = entry[1];
    continue;
  }
  const level = line.match(/^ {4}level: "([a-z]+)",$/);
  if (level && current) {
    levels[current] = level[1];
    current = null;
  }
}

// === Smistamento, con le verifiche ===
const tiers = { common: [], uncommon: [], rare: [] };
const problems = [];

for (const word of unique) {
  const level = levels[word];
  if (!level) {
    problems.push(`${word}: nessuna voce di dizionario`);
    continue;
  }
  if (!LEVELS.includes(level)) {
    problems.push(`${word}: livello "${level}" non riconosciuto`);
    continue;
  }
  tiers[level].push(word);
}

// Una parola senza fascia sparirebbe dal gioco: non potrebbe più uscire come
// soluzione, in silenzio. Meglio fermarsi e guardare.
if (problems.length) {
  console.log(`⚠️  Problemi:\n  ${problems.join("\n  ")}`);
  console.log("File NON riscritto.");
  process.exit(1);
}

for (const level of LEVELS) {
  const n = tiers[level].length;
  console.log(`${level.padEnd(9)} ${String(n).padStart(4)}`);
}
console.log(`${"totale".padEnd(9)} ${String(unique.length).padStart(4)}`);

// === Scrittura ===
// Dieci parole per riga, come prima: un array di 2.315 voci una per riga
// renderebbe illeggibile qualsiasi diff.
const format = (list) => {
  const rows = [];
  for (let i = 0; i < list.length; i += 10) {
    rows.push("  " + list.slice(i, i + 10).map((w) => `"${w}"`).join(","));
  }
  return rows.join(",\n") + ",";
};

writeFileSync(
  OUT,
  `/**
 * Parole che possono essere scelte come SOLUZIONE (lista ufficiale delle
 * risposte di Wordle: 2.315 parole comuni di cinque lettere). È un
 * sottoinsieme di VALID_WORDS.
 * Fonte: https://gist.github.com/cfreshman (wordle-answers-alphabetical).
 *
 * Divise per quanto la parola è diffusa, così la difficoltà può crescere col
 * livello invece di dipendere solo dal timer. L'etichetta viene dal campo
 * \`level\` del dizionario, che però pesa 449 KB e resta sul server: qui c'è
 * solo la parte che serve al browser per scegliere una parola.
 *
 * File di dati generato — non modificare a mano.
 * Si rigenera con: node scripts/build-answer-tiers.mjs
 */

/** Parole d'uso quotidiano: chi studia inglese le ha già incontrate. */
export const COMMON_WORDS: readonly string[] = [
${format(tiers.common)}
];

/** Parole che si incontrano leggendo, ma non tutti i giorni. */
export const UNCOMMON_WORDS: readonly string[] = [
${format(tiers.uncommon)}
];

/** Parole rare, letterarie o tecniche: quelle che si imparano giocando. */
export const RARE_WORDS: readonly string[] = [
${format(tiers.rare)}
];

/**
 * Tutte le risposte possibili, unite. Costruita dalle tre fasce invece di
 * essere un quarto elenco scritto a parte: una parola aggiunta a una fascia
 * finisce qui da sola, e le due liste non possono divergere.
 */
export const ANSWER_WORDS: readonly string[] = [
  ...COMMON_WORDS,
  ...UNCOMMON_WORDS,
  ...RARE_WORDS,
];
`,
);

console.log(`\nScritto ${OUT}`);
