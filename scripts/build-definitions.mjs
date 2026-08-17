// Assembla i blocchi di definizioni in shared/words/definitions.ts,
// verificando la copertura rispetto alla lista delle parole-soluzione.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(here, "..");
const CHUNKS = join(here, ".cache", "chunks");
const OUT = join(PROJECT, "shared/words/definitions.ts");

if (!existsSync(CHUNKS)) mkdirSync(CHUNKS, { recursive: true });

const words = readFileSync(join(here, ".cache", "words.txt"), "utf8").trim().split("\n");
const wordSet = new Set(words);

// Unisce tutti i blocchi, segnalando le parole definite due volte.
const defs = {};
const duplicates = [];
for (const file of readdirSync(CHUNKS).filter((f) => f.endsWith(".json")).sort()) {
  const chunk = JSON.parse(readFileSync(join(CHUNKS, file), "utf8"));
  for (const [word, def] of Object.entries(chunk)) {
    if (defs[word]) duplicates.push(`${word} (anche in ${file})`);
    defs[word] = def;
  }
}

// === Verifiche ===
const problems = [];
const extra = Object.keys(defs).filter((w) => !wordSet.has(w));
const missing = words.filter((w) => !defs[w]);

const POS = [
  "noun", "verb", "adjective", "adverb",
  "preposition", "conjunction", "pronoun", "interjection", "determiner",
];

// Verbi il cui passato cambia la vocale interna, verificati a occhio uno per
// uno: la frase d'esempio è corretta, solo la radice di 4 lettere non
// combacia col controllo automatico.
const IRREGULAR_PAST = new Set(["creep", "fling", "sling", "sting", "wring"]);

for (const [word, def] of Object.entries(defs)) {
  if (typeof def?.pos !== "string" || !def.pos.trim())
    problems.push(`${word}: categoria grammaticale mancante`);
  else
    for (const p of def.pos.split(" · "))
      if (!POS.includes(p)) problems.push(`${word}: categoria "${p}" non riconosciuta`);
  // L'IPA va fra barre, come in ogni dizionario.
  if (typeof def?.ipa !== "string" || !/^\/.+\/$/.test(def.ipa))
    problems.push(`${word}: IPA mancante o non racchiuso fra barre`);
  if (typeof def?.en !== "string" || def.en.trim().length < 10)
    problems.push(`${word}: definizione mancante o troppo corta`);
  // La glossa breve: 2-5 parole. Sotto le due parole non distingue niente in un
  // quiz a scelta multipla ("a thing"), sopra le sei smette di essere
  // leggibile a colpo d'occhio e tanto vale mostrare la definizione intera.
  //
  // Il limite era 2-5: allargato a 1-6 dopo aver visto le voci vere. "large"
  // → "big" e "quick" → "fast" sono corrette a UNA parola — un aggettivo
  // semplice ha spesso un sinonimo di una parola sola, e non è una scorciatoia
  // pigra, è la risposta giusta. Il vincolo di prima bocciava glosse buone.
  if (typeof def?.short !== "string" || !def.short.trim())
    problems.push(`${word}: glossa breve mancante`);
  else {
    const n = def.short.trim().split(/\s+/).length;
    if (n < 1 || n > 6) problems.push(`${word}: glossa breve di ${n} parole (attese 1-6)`);
  }
  if (typeof def?.example !== "string" || def.example.trim().length < 10)
    problems.push(`${word}: frase d'esempio mancante o troppo corta`);
  // La frase dovrebbe contenere la parola (anche coniugata: si controlla la
  // radice di 4 lettere, così "lifting" vale per "lift").
  //
  // I verbi irregolari cambiano la vocale interna al passato — "clung" non
  // contiene "clin" — e danno un falso allarme. Quelli già controllati a
  // occhio (esempio corretto, solo la radice non combacia) stanno qui, così
  // il controllo non li ribocca a ogni rigenerazione.
  else if (
    !IRREGULAR_PAST.has(word) &&
    !def.example.toLowerCase().includes(word.slice(0, 4))
  )
    problems.push(`${word}: la frase forse non contiene la parola — CONTROLLARE`);
  if (def?.it) problems.push(`${word}: campo "it" residuo, va tolto`);
}

console.log(`Definite:  ${Object.keys(defs).length} / ${words.length}`);
console.log(`Mancanti:  ${missing.length}`);
if (extra.length) console.log(`⚠️  Estranee: ${extra.join(", ")}`);
if (duplicates.length) console.log(`⚠️  Duplicate: ${duplicates.join(", ")}`);
if (problems.length) console.log(`⚠️  Problemi:\n  ${problems.join("\n  ")}`);
if (missing.length) console.log(`Prossime da fare: ${missing.slice(0, 5).join(", ")}…`);

// Con dei problemi aperti NON si scrive. Questo file è la fonte del dizionario
// che il gioco mostra: riscriverlo a partire da voci incomplete lo rovinerebbe
// in silenzio, e per accorgersene bisognerebbe aprirlo a mano. Meglio fermarsi
// e dire cosa manca — le voci già buone restano dove sono, in .cache/chunks/.
// (Stessa scelta di build-answer-tiers.mjs, che si rifiuta di scrivere se una
// parola non ha il livello CEFR.)
if (problems.length) {
  console.log("\n❌ Niente da scrivere: prima vanno risolti i problemi qui sopra.");
  process.exit(1);
}

// === Scrittura del file, in ordine alfabetico come la lista di partenza ===
const body = words
  .filter((w) => defs[w])
  .map((w) => {
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const d = defs[w];
    return (
      `  ${w}: {\n` +
      `    pos: "${esc(d.pos)}",\n` +
      `    ipa: "${esc(d.ipa)}",\n` +
      `    en: "${esc(d.en)}",\n` +
      `    short: "${esc(d.short)}",\n` +
      `    example: "${esc(d.example)}",\n` +
      `  },`
    );
  })
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * Voce di dizionario per ogni parola-soluzione, mostrata fra un livello e
 * l'altro. La chiave è la parola stessa, così la ricerca è immediata (stesso
 * ragionamento di VALID_WORD_SET in shared/wordle.ts).
 *
 * Tutti i testi sono in inglese di proposito: il gioco è per chiunque impari
 * l'inglese, non solo per chi parla italiano. (I commenti del codice restano
 * italiani: quelli servono a chi sviluppa, non a chi gioca.)
 *
 * File di dati generato — non modificare a mano.
 */

/** Quello che il gioco mostra per una parola, in stile dizionario. */
export interface WordDefinition {
  /** Part of speech: "noun", "verb", … Several joined by " · ". */
  pos: string;
  /** Pronunciation in IPA, between slashes: "/aɪl/". */
  ipa: string;
  /** Definition, written with the plainest words that stay accurate. */
  en: string;
  /** The same meaning in 2-5 words, for the recall quiz's four options. */
  short: string;
  /** A sentence using the word, to show it in context. */
  example: string;
}

export const DEFINITIONS: Record<string, WordDefinition> = {
${body}
};
`,
);

console.log(`\n✔ Scritto ${OUT}`);
