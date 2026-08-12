const KEY = "wordpace:stats";
const VERSION = 1;

const REVIEW_QUEUE_SIZE = 20;

/** La forma dei dati salvati nel browser. */
export interface Stats {
  version: number;
  bestScore: number;
  bestLevel: number;
  runs: number;
  words: string[];
}

const EMPTY: Stats = {
  version: 0,
  bestScore: 0,
  bestLevel: 0,
  runs: 0,
  words: [],
};

export function loadStats(): Stats {
  const raw = localStorage.getItem(KEY);
  if (!raw) return EMPTY;

  try {
    const saved = JSON.parse(raw);
    if (saved.version !== VERSION) return EMPTY;
    return saved;
  } catch {
    return EMPTY;
  }
}

export function saveRun(score: number, level: number, words: string[]) {
  const stats = loadStats();

  localStorage.setItem(
    KEY,
    JSON.stringify({
      version: VERSION,
      bestScore: Math.max(stats.bestScore, score),
      bestLevel: Math.max(stats.bestLevel, level),
      runs: stats.runs + 1,
      words: [...new Set([...stats.words, ...words])],
    }),
  );
}

/**
 * Le ultime parole incontrate, quelle candidate a ritornare in partita.
 *
 * Corta di proposito. Pescando a caso da TUTTO l'archivio la funzionalità si
 * spegnerebbe da sola: con l'archivio che cresce, la probabilità che una
 * singola parola ritorni crolla, e proprio a chi gioca di più. Una coda di
 * venti invece resta lunga venti per sempre, quindi l'intervallo di ripasso
 * non cambia mai.
 *
 * `slice(-20)` prende gli ultimi venti elementi; se ce ne sono meno li
 * restituisce tutti, quindi il giocatore nuovo non è un caso da trattare a
 * parte. E `words` è già in ordine di primo incontro, perché il Set di saveRun
 * conserva l'ordine di inserimento e non sposta in fondo chi c'era già.
 */
export function loadReviewQueue(): string[] {
  return loadStats().words.slice(-REVIEW_QUEUE_SIZE);
}
