/**
 * Come si legge la spiegazione di una parola, importato con l'alias `#shared`:
 *   import { getDefinition } from '#shared/definitions'
 *
 * I testi veri stanno in `#shared/words/definitions`, che è un file di dati
 * generato: qui sta solo la logica scritta a mano, così una rigenerazione dei
 * dati non la cancella.
 */
import { type WordDefinition, DEFINITIONS } from "#shared/words/definitions";
import cefrLevels from "#shared/words/cefr-levels.json";

/** Uno dei sei livelli del Quadro comune europeo, dal più facile al più raro. */
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/**
 * Il livello di ogni parola, letto dal file dei dati.
 *
 * È un JSON e non un modulo TypeScript perché lo scrivono e lo rileggono anche
 * gli script di generazione, che girano con Node fuori dal progetto Nuxt.
 * Averlo in un formato solo evita di tenerne due copie allineate a mano.
 *
 * Il tipo va dichiarato qui: un JSON non porta con sé i tipi, quindi
 * TypeScript vedrebbe delle semplici stringhe.
 */
const CEFR_LEVELS = cefrLevels as Record<string, CefrLevel>;

/**
 * Quello che il gioco riceve per una parola: la voce di dizionario più il
 * livello CEFR, che vive in un file a parte perché ha una fonte diversa (viene
 * dalla gradazione, non dalla generazione delle definizioni) e cambia per conto
 * suo.
 *
 * Le due cose si uniscono qui, in un punto solo, così chi chiama non deve
 * sapere che erano separate.
 */
export interface WordEntry extends WordDefinition {
  /** Livello di corso a cui ci si aspetta di conoscere la parola, o "" se ignoto. */
  cefr: CefrLevel | "";
}

/**
 * Testo mostrato quando una parola non ha spiegazione (una generazione fallita,
 * una parola saltata). Sta in una costante a parte, e non dentro la funzione,
 * per poterlo cambiare o riusare senza toccare la logica.
 */
export const MISSING_DEFINITION: WordEntry = {
  // Di una parola non ancora generata non sappiamo nulla: né la categoria
  // grammaticale, né la pronuncia, né una frase d'esempio. Quei campi restano
  // quindi vuoti e il template salta le righe vuote — meglio una finestra
  // sobria che quattro righe di scuse. Il testo è in inglese come tutto il
  // resto di ciò che vede il giocatore.
  pos: "",
  ipa: "",
  level: "",
  cefr: "",
  en: "No definition available for this word yet.",
  example: "",
};

/**
 * Restituisce la spiegazione di `word`, o MISSING_DEFINITION se non c'è.
 *
 * Non restituisce mai `undefined` e non lancia errori: una spiegazione mancante
 * è un difetto estetico, e non deve interrompere una partita in corso.
 *
 * L'ingresso viene normalizzato (spazi tolti, tutto minuscolo) perché le chiavi
 * dei due archivi sono minuscole: senza, cercare "LEMON" darebbe il ripiego
 * anche se la parola c'è.
 *
 * Il livello CEFR si cerca a parte e può mancare da solo: una parola può avere
 * la definizione e non ancora la gradazione. In quel caso resta vuoto e il
 * template salta la pastiglia, invece di mostrarne una senza testo.
 */
export function getDefinition(word: string): WordEntry {
  const key = word.trim().toLowerCase();
  const definition = DEFINITIONS[key];
  if (!definition) return MISSING_DEFINITION;

  return { ...definition, cefr: CEFR_LEVELS[key] ?? "" };
}
