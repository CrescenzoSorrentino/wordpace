/**
 * Regole e logica di gioco di Wordle (niente interfaccia, niente Vue, niente
 * DOM). Unica fonte di verità su COME funziona il gioco, importata con l'alias
 * `#shared`:  import { ... } from '#shared/wordle'
 */
import { VALID_WORDS } from "#shared/words/valid-words";
import {
  ANSWER_WORDS,
  COMMON_WORDS,
  UNCOMMON_WORDS,
  RARE_WORDS,
} from "#shared/words/answer-words";

/** Numero di lettere di una parola (Wordle classico: 5). */
export const WORD_LENGTH = 5;

/** Tentativi a disposizione per ogni parola (Wordle classico: 6). */
export const MAX_ATTEMPTS = 6;

/** Impostazioni del timer per i livelli arcade (vedi timeForLevel). */
export const START_TIME = 300; // secondi al livello 1
export const FLOOR_TIME = 30; // non si scende mai sotto questi secondi
export const DECAY_RATE = 0.92; // quanto si accorcia per livello (più basso = più duro)

// Tetto massimo al tempo riportato da un livello all'altro. Per ora coincide
// col tempo iniziale, ma ha un nome suo così i due valori potranno divergere
// senza toccare il resto del codice.
export const MAX_TIME = START_TIME;

// Tempo regalato per ogni lettera di un tentativo, per premiare chi indovina.
export const TIME_BONUS_CORRECT = 10; // secondi per lettera verde
export const TIME_BONUS_PRESENT = 5; // secondi per lettera gialla

// Tempo perso per un tentativo che non rivela nulla di nuovo (sprecato).
export const TIME_PENALTY = 5; // secondi

export const EXPLANATION_TIME = 12; // secondi per leggere la spiegazione di una parola

/**
 * Le tre gradazioni di aiuto che il giocatore può comprare quando è in
 * difficoltà, dalla più avara alla più generosa:
 * - "small":  una lettera che è nella parola e che non ha ancora provato
 * - "medium": la frase d'esempio con la parola cancellata
 * - "large":  la definizione della parola
 */
export type HintSize = "small" | "medium" | "large";

// Costo di ogni aiuto, in punti PER LIVELLO: il prezzo vero è questo numero
// moltiplicato per il livello in corso. Un costo fisso sarebbe una mazzata al
// livello 1 e regalato al livello 20, perché i punti guadagnati crescono col
// livello (vedi wordScore nel componente).
//
// I valori sono tarati sul livello 3-4, dove finisce la maggior parte delle
// partite: lì l'aiuto grande costa circa un quarto del punteggio accumulato —
// si sente, ma non azzera la partita — e il piccolo poco abbastanza da restare
// una scelta leggera. Più si sale, più diventano proporzionalmente economici,
// perché il punteggio cresce a valanga e il costo cresce dritto: accettabile,
// dato che ai livelli alti le parole sono anche più difficili.
export const HINT_COST_SMALL = 3;
export const HINT_COST_MEDIUM = 6;
export const HINT_COST_LARGE = 12;

// Quando compare l'opzione dell'aiuto. Bastano una delle due condizioni: sono
// due segnali di difficoltà diversi, e chi è bloccato con tempo in abbondanza
// merita aiuto quanto chi sta per scadere.
//
// Tre tentativi e non quattro perché ne restano ancora tre da giocare: un
// aiuto che arriva quando non puoi più usarlo è peggio di nessun aiuto, visto
// che paghi e perdi comunque.
export const HINT_MIN_GUESSES = 3; // tentativi già fatti
export const HINT_LOW_TIME = 45; // secondi rimasti

/**
 * Quante parole si possono abbandonare in un'intera partita. Tre e non
 * illimitati: uno skip che si può sempre comprare non è una scelta, è solo un
 * costo in punti da pagare ogni volta che la parola non piace.
 */
export const MAX_SKIPS = 3;

/**
 * Costo del PRIMO skip, in punti per livello, come per gli aiuti.
 *
 * Vale poco meno dell'aiuto grande (12) di proposito: la definizione di solito
 * fa risolvere la parola, e quindi restituisce i punti che quella parola vale.
 * Lo skip invece non restituisce niente. Se costasse molto meno diventerebbe la
 * scorciatoia pigra da comprare al posto di pensare.
 */
export const SKIP_COST = 10;

/**
 * Di quanto raddoppia il prezzo a ogni skip già speso in questa partita.
 *
 * Il livello da solo non basterebbe a farli "costare sempre di più": anche il
 * punteggio guadagnato cresce col livello, quindi tre skip a prezzo pieno
 * peserebbero uguale in proporzione, e i primi due si spenderebbero a caso. Con
 * questo fattore il conto si racconta in una riga: il primo skip costa mezza
 * parola risolta, il secondo una parola, il terzo due.
 */
export const SKIP_COST_GROWTH = 2;

/**
 * Listino prezzi: da ogni taglia di aiuto al suo costo per livello. Costruito
 * una volta sola, come VALID_WORD_SET — non cambia mai.
 *
 * Il tipo `Record<HintSize, number>` obbliga a elencare TUTTE e tre le taglie:
 * se un domani ne aggiungessimo una quarta e ci dimenticassimo di darle un
 * prezzo, il compilatore lo direbbe subito, invece di lasciare in giro un aiuto
 * che costa `undefined`.
 */
const HINT_COSTS: Record<HintSize, number> = {
  small: HINT_COST_SMALL,
  medium: HINT_COST_MEDIUM,
  large: HINT_COST_LARGE,
};

/**
 * L'esito di una singola lettera di un tentativo:
 * - "correct": lettera giusta al posto giusto (verde)
 * - "present": la lettera c'è, ma in un'altra posizione (giallo)
 * - "absent":  la lettera non è nella parola (grigio)
 */
export type LetterState = "correct" | "present" | "absent";

/**
 * Insieme di ricerca per validare i tentativi. Costruito una volta sola
 * dall'array, così la domanda "è una parola vera?" ha risposta immediata invece
 * di scorrere ~15.000 parole a ogni tentativo.
 */
const VALID_WORD_SET = new Set(VALID_WORDS);

/**
 * Restituisce true se `word` è accettata come tentativo (cioè è nella lista
 * ammessa). Prima toglie gli spazi ai lati e porta tutto in minuscolo, così le
 * maiuscole non provocano mai un rifiuto sbagliato.
 */
export function isValidWord(word: string): boolean {
  return VALID_WORD_SET.has(word.trim().toLowerCase());
}

// Da quale livello entrano in gioco le parole meno comuni. Fino al terzo si
// pesca solo fra quelle di tutti i giorni; dal quarto si aggiungono le
// `uncommon`, dal nono anche le `rare`.
//
// Soglie basse di proposito: la maggior parte delle partite finisce fra il
// livello 3 e il 4 (vedi la taratura dei prezzi degli aiuti qui sopra), quindi
// spostarle più in là renderebbe la difficoltà crescente invisibile a quasi
// tutti, e l'unico effetto sarebbe un gioco più facile.
const UNCOMMON_FROM_LEVEL = 4;
const RARE_FROM_LEVEL = 9;

// I barattoli da cui pescare, uniti una volta sola all'avvio come VALID_WORD_SET
// più sopra: fonderli dentro la funzione significherebbe ricostruire 1.762
// elementi a ogni parola nuova, per poi buttarli un istante dopo.
//
// Sono CUMULATIVI, non separati: al nono livello le parole comuni possono
// ancora uscire, solo più di rado. Sostituire il barattolo invece di allargarlo
// creerebbe un muro — le parole facili sparirebbero di colpo proprio dove il
// timer si è già accorciato — e renderebbe irrecuperabile qualunque parola
// etichettata male, visto che le etichette del dizionario sono generate e non
// prese da un corpus reale.
const EARLY_POOL = COMMON_WORDS;
const MID_POOL = [...COMMON_WORDS, ...UNCOMMON_WORDS];

/**
 * Le parole in gioco a un dato livello.
 *
 * L'ordine dei due controlli conta: partendo dalla soglia più bassa, un livello
 * alto soddisfarebbe già quella e si fermerebbe lì, e le parole rare non
 * uscirebbero mai. Si guarda quindi prima la soglia più alta.
 *
 * Il terzo barattolo è ANSWER_WORDS così com'è, invece di rifondere le tre
 * fasce: è già la loro unione, e ricostruirla qui vorrebbe dire tenere allineate
 * a mano due liste che devono essere identiche.
 */
function poolForLevel(level: number): readonly string[] {
  if (level >= RARE_FROM_LEVEL) {
    return ANSWER_WORDS;
  }
  if (level >= UNCOMMON_FROM_LEVEL) {
    return MID_POOL;
  }
  return EARLY_POOL;
}

/**
 * Sceglie una soluzione a caso fra quelle in gioco al livello indicato.
 * Math.random va benissimo qui: la scelta deve solo essere imprevedibile per il
 * giocatore, non sicura dal punto di vista crittografico.
 *
 * Il barattolo si chiede una volta sola e si tiene in una const: le due righe
 * qui sotto devono lavorare sulla STESSA lista, e prendendola due volte si apre
 * la porta a un indice calcolato su un elenco e letto da un altro — che a volte
 * dà la parola sbagliata e a volte `undefined`.
 */
export function pickRandomAnswer(level: number): string {
  const pool = poolForLevel(level);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index]!;
}

/**
 * Confronta un tentativo con la soluzione e restituisce un LetterState per ogni
 * lettera.
 *
 * Le lettere ripetute sono gestite in due passaggi, così una lettera non viene
 * mai evidenziata più volte di quante compaia davvero:
 *   Passaggio 1 (verdi): segna le corrispondenze esatte di posizione e le
 *                        scala da un conteggio delle lettere della soluzione.
 *   Passaggio 2 (gialli): segna "present" una lettera non ancora verde solo se
 *                         il conteggio ne ha ancora una da spendere; altrimenti
 *                         resta "absent".
 *
 * Si dà per scontato che i due ingressi siano lunghi uguali e in minuscolo
 * (chiamare prima isValidWord).
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = new Array(guess.length).fill("absent");

  // Quante copie di ogni lettera sono ancora disponibili (le lettere della
  // soluzione meno quelle già prese da un verde).
  const remaining: Record<string, number> = {};
  for (const letter of answer) {
    remaining[letter] = (remaining[letter] ?? 0) + 1;
  }

  // Passaggio 1: i verdi.
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining[guess[i]!]!--;
    }
  }

  // Passaggio 2: gialli e grigi.
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") {
      continue;
    }
    const letter = guess[i]!;
    if ((remaining[letter] ?? 0) > 0) {
      result[i] = "present";
      remaining[letter]!--;
    }
  }

  return result;
}

/**
 * Secondi disponibili a un dato livello. Calano in modo esponenziale verso
 * FLOOR_TIME, senza mai raggiungerlo:
 * tempo = pavimento + (partenza - pavimento) * fattore^(livello - 1)
 */
export function timeForLevel(level: number): number {
  return Math.floor(
    FLOOR_TIME + (START_TIME - FLOOR_TIME) * Math.pow(DECAY_RATE, level - 1),
  );
}

/**
 * Quanti punti costa un aiuto al livello indicato.
 *
 * Il prezzo cresce col livello perché ci cresce anche il guadagno (vedi
 * wordScore): un costo fisso sarebbe proibitivo all'inizio e irrilevante dopo
 * il decimo livello, cioè proprio dove gli aiuti servono davvero.
 */
export function costForHint(size: HintSize, level: number): number {
  return HINT_COSTS[size] * level;
}

/**
 * Quanti punti costa abbandonare la parola in corso, dato il livello e quanti
 * skip sono GIÀ stati usati in questa partita (0 per il primo).
 *
 * Cresce su due assi — col livello, come gli aiuti, e col numero di skip già
 * spesi — perché sono due rincari diversi: il primo tiene il prezzo al passo
 * col punteggio, il secondo rende ogni skip successivo una decisione più dura
 * della precedente. Al livello 3, dove una parola risolta vale una sessantina
 * di punti: 30, poi 60, poi 120.
 *
 * Nota che lo skip NON è mai gratis nemmeno quando lo si può pagare: la parola
 * abbandonata non frutta punti, quindi si paga due volte. È voluto, ed è il
 * motivo per cui il prezzo in punti può restare abbordabile.
 */
export function costForSkip(level: number, used: number): number {
  return SKIP_COST * level * Math.pow(SKIP_COST_GROWTH, used);
}

/**
 * Una lettera della soluzione che il giocatore non ha ancora provato, scelta a
 * caso fra quelle disponibili. È il contenuto dell'aiuto piccolo.
 *
 * A caso e non la prima: scegliendo sempre la prima in ordine di parola, un
 * giocatore attento capirebbe lo schema e ricaverebbe una seconda informazione
 * ("tutte quelle prima le ho già escluse") che non gli abbiamo venduto.
 *
 * Restituisce `undefined` quando non c'è più nulla da rivelare, cioè quando le
 * lettere della soluzione sono già state provate tutte. Chi la chiama deve
 * spegnere il pulsante in quel caso: sarebbe pessimo farsi pagare per il nulla.
 */
export function pickUntriedLetter(
  answer: string,
  guesses: string[],
): string | undefined {
  const tried = new Set(guesses.join(""));

  // Il Set attorno ad `answer` toglie i doppioni: in "abbey" la B compare due
  // volte, e senza avrebbe il doppio delle probabilità di uscire.
  const available = [...new Set(answer)].filter((letter) => !tried.has(letter));

  if (available.length === 0) return undefined;

  return available[Math.floor(Math.random() * available.length)];
}

/**
 * La frase d'esempio con la parola segreta sostituita da uno spazio da
 * riempire. È il contenuto dell'aiuto medio.
 *
 * I due indicatori dell'espressione regolare non sono un vezzo:
 * - "i" ignora maiuscole e minuscole. Senza, una frase che INIZIA con la parola
 *   ("Baste the turkey…") non verrebbe riconosciuta, e il giocatore si
 *   ritroverebbe la soluzione in chiaro dopo averla pagata. Nel dizionario
 *   attuale succederebbe in 52 voci su 2.315.
 * - "g" sostituisce tutte le occorrenze e non solo la prima, nel caso la parola
 *   compaia due volte nella stessa frase.
 *
 * La maschera prende la lunghezza dalla parola invece di essere scritta a mano:
 * così resta corretta anche se un domani WORD_LENGTH cambiasse. Non rivela
 * nulla, dato che le parole sono tutte della stessa lunghezza.
 */
export function maskWordInExample(example: string, word: string): string {
  return example.replace(new RegExp(word, "gi"), "_".repeat(word.length));
}
