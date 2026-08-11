const KEY = "wordpace:stats";
const VERSION = 1;

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
      runs: stats.runs +1,
      words: [...new Set([...stats.words, ...words])],
    }),
  );
}
