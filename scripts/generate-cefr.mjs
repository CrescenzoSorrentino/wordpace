/**
 * Chiede a Claude, per ogni parola-soluzione, a quale livello CEFR (A1…C2) ci
 * si aspetta che uno studente d'inglese la conosca, e salva il risultato in
 * scripts/cefr-levels.json. Da lì build-answer-tiers.mjs ricava le tre fasce
 * di difficoltà del gioco.
 *
 * Perché esiste, visto che il dizionario ha già un campo `level`: quel campo
 * risponde a "quanto è comune questa parola" dal punto di vista di un
 * madrelingua, ed è la domanda sbagliata. Ne escono 963 parole su 2.315
 * marcate "comuni" — il 42% — con dentro `lease`, `merge`, `grasp`, `arise`,
 * che sono comunissime per un inglese e B2 per chi studia. Il risultato è che
 * i primi livelli del gioco, pensati per essere facili, servono un vocabolario
 * da B1 abbondante.
 *
 * Il CEFR è la scala dei corsi di lingua: ha una definizione condivisa, quindi
 * la domanda ha una risposta verificabile invece di dipendere da un giudizio a
 * sentimento.
 *
 * Si lancia con:
 *   node --env-file=.env scripts/generate-cefr.mjs 200   (prova su 200 parole)
 *   node --env-file=.env scripts/generate-cefr.mjs       (tutte le rimanenti)
 *
 * È riprendibile: salva dopo ogni ondata e riparte sempre da ciò che manca,
 * quindi un'interruzione non fa perdere né lavoro né soldi.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(here, "..");
const DEFINITIONS = join(PROJECT, "shared/words/definitions.ts");

/**
 * Il risultato sta accanto agli altri dati del gioco e non in scripts/, perché
 * non è un file di lavoro: lo legge il server per mostrare il livello a fine
 * parola, e lo rilegge questo stesso script per sapere cosa manca ancora.
 *
 * Va versionato. Senza, né il gioco saprebbe che livello ha una parola né
 * build-answer-tiers.mjs saprebbe dividere le fasce su una copia appena
 * clonata — ed è il motivo per cui non sta in scripts/.cache/, che è ignorata
 * da git.
 */
const OUT = join(PROJECT, "shared/words/cefr-levels.json");

/**
 * Cento parole per richiesta invece delle cinquanta di generate-definitions:
 * là ogni parola produceva una voce intera (definizione, esempio, fonetica),
 * qui produce due caratteri. Il costo fisso delle istruzioni si spalma quindi
 * su gruppi più grandi senza allungare le risposte.
 */
const BATCH_SIZE = 100;

/** Quante richieste in volo insieme, per non sbattere contro il limite al minuto. */
const CONCURRENCY = 4;

/** Quante volte riprovare una richiesta fallita prima di arrendersi. */
const MAX_RETRIES = 3;

const MODEL = "claude-opus-5";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// === Pezzo 1: capire cosa manca ============================================

/** Tutte le parole-soluzione, lette dal dizionario (che è versionato). */
function allWords() {
  const source = readFileSync(DEFINITIONS, "utf8");
  return [...source.matchAll(/^ {2}([a-z]{5}): \{$/gm)].map((m) => m[1]);
}

/** Quello che è già stato deciso nei lanci precedenti. */
function existingLevels() {
  if (!existsSync(OUT)) return {};
  return JSON.parse(readFileSync(OUT, "utf8"));
}

// === Pezzo 2: la forma della risposta ======================================

/**
 * Come in generate-definitions: lo schema non è un suggerimento, è un vincolo
 * che l'API fa rispettare. `cefr` può essere solo uno dei sei livelli, quindi
 * non serve nessun controllo su valori inventati.
 */
const SCHEMA = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          cefr: { type: "string", enum: LEVELS },
        },
        required: ["word", "cefr"],
        additionalProperties: false,
      },
    },
  },
  required: ["entries"],
  additionalProperties: false,
};

/**
 * Le istruzioni. Due cose le rendono diverse da un generico "quanto è difficile
 * questa parola":
 *
 * 1. Chiedono il livello a cui ci si aspetta che uno STUDENTE la conosca, non
 *    quanto è frequente in inglese. È la correzione dell'errore che ha prodotto
 *    le etichette attuali.
 * 2. Danno degli esempi di ancoraggio per ogni livello. Senza, gruppi diversi
 *    di parole finiscono giudicati con metri leggermente diversi, e le fasce
 *    del gioco risultano irregolari.
 */
const SYSTEM_PROMPT = `You grade English words by the CEFR level at which a learner of English is expected to know them.

For each word you are given, return its CEFR level: A1, A2, B1, B2, C1 or C2.

Grade the word's most frequent meaning, and grade it for a learner — not by how common the word is in native speech. A word can be everyday vocabulary for a native speaker and still be B2 for someone studying the language.

Anchors, to keep the scale consistent:
- A1: water, house, happy, green, eight
- A2: kitchen, quiet, borrow, weekend, plate
- B1: brave, advice, spread, factory, avoid
- B2: merge, grasp, arise, lease, blush
- C1: deter, wield, sever, quaint, tacit
- C2: augur, dross, welter, cleave, ersatz

Two further rules:
- If a word is spelled the same as a much easier word but you are grading a rarer sense, grade the easier, more frequent sense.
- Judge only knowledge of the word, not how hard it is to spell.

Return one entry per word given, in the same order, and no extra words.`;

// === Pezzo 3: una richiesta ================================================

const client = new Anthropic(); // legge da sola ANTHROPIC_API_KEY dall'ambiente

/**
 * Chiede il livello di un gruppo di parole. Riprova con attese crescenti, come
 * generate-definitions: se il servizio è sovraccarico, ritentare subito
 * peggiora le cose.
 */
async function gradeBatch(words, attempt = 1) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      // "medium" e non "high": il compito è una classificazione su una scala
      // definita, con gli esempi di ancoraggio già nel prompt. Alzalo se
      // guardando il risultato le fasce non ti convincono.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content: words.join("\n") }],
    });

    const text = response.content.find((block) => block.type === "text")?.text;
    const { entries } = JSON.parse(text);

    // La parola torna ripulita prima di diventare chiave: lo schema garantisce
    // che il campo ci sia e che sia una stringa, non che sia scritta esattamente
    // come l'avevamo mandata. Con una richiesta da una parola sola il modello
    // tende a restituirla maiuscola ("Human"), e senza questa normalizzazione
    // la voce risulterebbe mancante per sempre — lo script la ritenterebbe a
    // ogni lancio ottenendo ogni volta lo stesso esito.
    const asked = new Set(words);
    const result = {};
    for (const { word, cefr } of entries) {
      const key = String(word).trim().toLowerCase();
      if (asked.has(key)) result[key] = cefr;
    }

    // Le parole non tornate si ritentano al prossimo lancio: non serve altra
    // logica, perché ciò che manca si ricava sempre da quello che è salvato.
    // Se però ne manca più di un quinto la risposta è andata storta davvero.
    const missing = words.filter((w) => !result[w]);
    if (missing.length > words.length / 5) {
      throw new Error(`risposta troppo incompleta (${missing.length} mancanti)`);
    }
    if (missing.length) {
      console.log(`  ℹ️  non graduate, verranno ritentate: ${missing.join(", ")}`);
    }

    return result;
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    const waitSeconds = 2 ** attempt;
    console.log(`  ⚠️  ${error.message} — riprovo fra ${waitSeconds}s`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    return gradeBatch(words, attempt + 1);
  }
}

// === Pezzo 4: il ciclo principale ==========================================

/** Spezza un array in gruppi da `size` elementi. */
function chunked(array, size) {
  const groups = [];
  for (let i = 0; i < array.length; i += size) {
    groups.push(array.slice(i, i + size));
  }
  return groups;
}

/** Scrive il file con le chiavi in ordine alfabetico, per diff leggibili. */
function save(levels) {
  const ordered = {};
  for (const word of Object.keys(levels).sort()) {
    ordered[word] = levels[word];
  }
  writeFileSync(OUT, JSON.stringify(ordered, null, 2) + "\n");
}

async function main() {
  const levels = existingLevels();
  const limit = Number(process.argv[2]) || Infinity;
  const todo = allWords()
    .filter((word) => !levels[word])
    .slice(0, limit);

  if (!todo.length) {
    console.log("✔ Niente da fare: tutte le parole hanno già un livello CEFR.");
    return;
  }

  const groups = chunked(todo, BATCH_SIZE);
  console.log(
    `Da graduare: ${todo.length} parole in ${groups.length} richieste, ` +
      `${CONCURRENCY} alla volta, con ${MODEL}.\n`,
  );

  let doneCount = 0;
  const started = Date.now();

  for (const wave of chunked(groups, CONCURRENCY)) {
    const results = await Promise.all(
      wave.map(async (words) => {
        try {
          return { words, graded: await gradeBatch(words) };
        } catch (error) {
          // Un gruppo fallito non ferma gli altri: quelle parole risulteranno
          // ancora mancanti al prossimo lancio.
          console.error(`✗ ${words[0]}…${words.at(-1)}: ${error.message}`);
          return null;
        }
      }),
    );

    for (const result of results) {
      if (!result) continue;
      Object.assign(levels, result.graded);
      doneCount += Object.keys(result.graded).length;
      console.log(
        `✔ ${result.words[0]} … ${result.words.at(-1)}  ` +
          `(${doneCount}/${todo.length})`,
      );
    }

    // Si salva dopo OGNI ondata, non alla fine: così un'interruzione a metà
    // conserva tutto quello che è già stato pagato.
    save(levels);
  }

  // Riepilogo per fascia: è il primo controllo da fare a occhio. Se le A1+A2
  // fossero poche decine, il gioco non avrebbe abbastanza parole facili per i
  // primi livelli e le soglie andrebbero ripensate.
  const counts = {};
  for (const level of Object.values(levels)) {
    counts[level] = (counts[level] ?? 0) + 1;
  }
  console.log("\nDistribuzione:");
  for (const level of LEVELS) {
    console.log(`  ${level}  ${String(counts[level] ?? 0).padStart(4)}`);
  }

  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nFatto: ${doneCount} parole in ${minutes} minuti.`);
  console.log(`Scritto ${OUT}`);
  console.log("Quando sei soddisfatto: node scripts/build-answer-tiers.mjs");
}

main();
