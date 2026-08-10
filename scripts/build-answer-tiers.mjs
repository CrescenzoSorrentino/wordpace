// Riscrive shared/words/answer-words.ts diviso nelle tre fasce di difficoltà.
//
// La fascia viene dal livello CEFR di scripts/cefr-levels.json — la scala dei
// corsi di lingua — accorpato a due a due:
//
//   A1 + A2  →  parole che uno studente principiante conosce già
//   B1 + B2  →  parole da studente intermedio
//   C1 + C2  →  parole avanzate, letterarie o tecniche
//
// NON si usa più il campo `level` del dizionario ("common"/"uncommon"/"rare"):
// quello dice quanto una parola è comune per un MADRELINGUA, che è la domanda
// sbagliata per un gioco rivolto a chi impara. Con quel criterio finivano fra
// le "comuni" parole come `lease`, `merge` e `grasp`, e i primi livelli del
// gioco richiedevano un vocabolario da B1 abbondante. Il campo resta nel
// dizionario perché è quello che il gioco mostra a schermo a fine parola.
//
// Perché uno script e non una lettura a runtime: il file delle definizioni pesa
// 449 KB e sta apposta solo sul server (vedi il README), mentre la parola va
// scelta nel browser, all'istante, senza chiamate di rete. Qui l'informazione
// utile — in quale fascia sta ogni parola — viene estratta una volta sola e
// salvata in un file da 20 KB che il browser scarica senza accorgersene.
//
// Da rilanciare quando cambiano il dizionario o i livelli CEFR:
//   node scripts/build-answer-tiers.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(here, "..");
const CEFR = join(PROJECT, "shared/words/cefr-levels.json");
const OUT = join(PROJECT, "shared/words/answer-words.ts");

/**
 * Da livello CEFR alla fascia di gioco, e da fascia al nome dell'elenco
 * esportato.
 *
 * Quattro fasce e non tre: accorpando B1 e B2 il primo gradino più che
 * raddoppierebbe il barattolo in un colpo solo (474 → 1.253), mentre così i tre
 * allargamenti stanno tutti fra ×1,6 e ×1,8 — una salita regolare invece di uno
 * scalino seguito da una rampa. È anche il gradino dove sta la maggior parte di
 * chi impara l'inglese, quindi quello che vale di più distinguere.
 *
 * A1 e A2 restano insieme (sarebbero 206 parole da sole, troppo poche per un
 * livello intero), e così C1 e C2, che a quel punto sono entrambe "difficili".
 */
const TIER_OF = {
  A1: "a1a2",
  A2: "a1a2",
  B1: "b1",
  B2: "b2",
  C1: "c1c2",
  C2: "c1c2",
};

/** Le fasce in ordine di difficoltà, col nome dell'export e una descrizione. */
const TIERS = [
  ["a1a2", "A1_A2_WORDS", "Parole dei primi due livelli di corso: le sa chiunque abbia cominciato."],
  ["b1", "B1_WORDS", "Vocabolario da studente intermedio."],
  ["b2", "B2_WORDS", "Intermedio avanzato: si incontrano leggendo, non a tavola."],
  ["c1c2", "C1_C2_WORDS", "Parole avanzate, letterarie o tecniche: quelle che si imparano giocando."],
];

// === Le parole di partenza, prese dal file che stiamo per riscrivere ===
// Si leggono da lì e non da scripts/.cache/words.txt perché la cache è
// git-ignorata: così lo script funziona anche su una copia appena clonata.
const previous = readFileSync(OUT, "utf8");
const words = [...previous.matchAll(/"([a-z]{5})"/g)].map((m) => m[1]);
const unique = [...new Set(words)].sort();

if (unique.length !== words.length) {
  console.log(`⚠️  ${words.length - unique.length} parole ripetute, tolte.`);
}

// === Il livello CEFR di ogni parola ===
if (!existsSync(CEFR)) {
  console.log(`⚠️  Manca ${CEFR}.`);
  console.log("Generalo prima con: node --env-file=.env scripts/generate-cefr.mjs");
  process.exit(1);
}
const levels = JSON.parse(readFileSync(CEFR, "utf8"));

// === Smistamento, con le verifiche ===
const tiers = Object.fromEntries(TIERS.map(([key]) => [key, []]));
const problems = [];

for (const word of unique) {
  const level = levels[word];
  if (!level) {
    problems.push(`${word}: nessun livello CEFR`);
    continue;
  }
  if (!TIER_OF[level]) {
    problems.push(`${word}: livello "${level}" non riconosciuto`);
    continue;
  }
  tiers[TIER_OF[level]].push(word);
}

// Una parola senza fascia sparirebbe dal gioco: non potrebbe più uscire come
// soluzione, in silenzio. Meglio fermarsi e guardare.
//
// È anche il motivo per cui non si mescolano le due scale: dopo una prova
// parziale di generate-cefr.mjs, ricadere sul vecchio `level` per le parole
// non ancora graduate darebbe fasce metà con un criterio e metà con l'altro,
// senza che nessuno se ne accorga.
if (problems.length) {
  const shown = problems.slice(0, 10);
  console.log(`⚠️  Problemi (${problems.length}):\n  ${shown.join("\n  ")}`);
  if (problems.length > shown.length) console.log(`  …e altri ${problems.length - shown.length}`);
  console.log("File NON riscritto.");
  process.exit(1);
}

// Oltre al conteggio per fascia si stampa il CUMULATO, che è il numero che
// conta davvero: i barattoli si allargano, non si sostituiscono, quindi al
// livello in cui entra il B2 le parole in gioco sono tutte quelle fin lì.
let running = 0;
for (const [key, name] of TIERS) {
  running += tiers[key].length;
  console.log(
    `${name.replace("_WORDS", "").padEnd(6)} ${String(tiers[key].length).padStart(4)}` +
      `   barattolo: ${String(running).padStart(4)}`,
  );
}
console.log(`${"totale".padEnd(6)} ${String(unique.length).padStart(4)}`);

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

const lists = TIERS.map(
  ([key, name, description]) => `/** ${description} */
export const ${name}: readonly string[] = [
${format(tiers[key])}
];
`,
).join("\n");

writeFileSync(
  OUT,
  `/**
 * Parole che possono essere scelte come SOLUZIONE (lista ufficiale delle
 * risposte di Wordle: 2.315 parole comuni di cinque lettere). È un
 * sottoinsieme di VALID_WORDS.
 * Fonte: https://gist.github.com/cfreshman (wordle-answers-alphabetical).
 *
 * Divise per il livello CEFR a cui ci si aspetta che uno studente d'inglese
 * conosca la parola — la scala dei corsi di lingua — così la difficoltà del
 * gioco può crescere col livello invece di dipendere solo dal timer.
 *
 * I livelli stanno in scripts/cefr-levels.json e vengono accorpati a fasce da
 * questo generatore. NON si usa il campo \`level\` del dizionario: quello dice
 * quanto una parola è comune per un madrelingua, che per chi impara è un'altra
 * domanda (fra le sue "comuni" ci sono lease, merge e grasp).
 *
 * File di dati generato — non modificare a mano.
 * Si rigenera con: node scripts/build-answer-tiers.mjs
 */

${lists}
/**
 * Tutte le risposte possibili, unite. Costruita dalle quattro fasce invece di
 * essere un quinto elenco scritto a parte: una parola aggiunta a una fascia
 * finisce qui da sola, e le due liste non possono divergere.
 */
export const ANSWER_WORDS: readonly string[] = [
${TIERS.map(([, name]) => `  ...${name},`).join("\n")}
];
`,
);

console.log(`\nScritto ${OUT}`);
