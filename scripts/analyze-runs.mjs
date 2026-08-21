/**
 * Legge le partite registrate dalla telemetria e risponde a qualche domanda.
 *
 *   node --env-file=.env scripts/analyze-runs.mjs
 *
 * Il flag --env-file serve perché uno script Node non legge il .env da solo:
 * dentro Nuxt ci pensa useRuntimeConfig, qui no.
 */
import { Redis } from "@upstash/redis";

// La stessa chiave su cui scrive server/api/telemetry.post.ts. Se le due
// stringhe non coincidono Redis non protesta: risponde con una lista vuota, e
// sembra che la telemetria non abbia mai registrato niente.
const runsKey = "wordpace:runs";

const redis = new Redis({
  url: process.env.NUXT_UPSTASH_REDIS_REST_URL,
  token: process.env.NUXT_UPSTASH_REDIS_REST_TOKEN,
});

// Da 0 a -1 vuol dire "dalla prima all'ultima": in Redis gli indici negativi
// contano dalla fine, come slice(-20) in app/utils/stats.ts.
const runs = await redis.lrange(runsKey, 0, -1);

const byTime = runs.filter((run) => run.cause === "time").length;
const byAttempts = runs.filter((run) => run.cause === "attempts").length;
const byLevel3 = runs.filter((run) => run.level >= 3).length;
const byLevel5 = runs.filter((run) => run.level >= 5).length;
const byLevel8 = runs.filter((run) => run.level >= 8).length;
// `hints` è una LISTA (nell'oggetto salvato è `hints: []`), quindi "ne ha
// comprato almeno uno" si chiede alla sua lunghezza. `skips` invece è già un
// numero (`skips: 1`) e si confronta diretto.
const byHint = runs.filter((run) => run.hints.length > 0).length;
const bySkip = runs.filter((run) => run.skips > 0).length;
const vaultOpened = runs.filter((run) => run.vaultOpened).length;
const vaultTier = runs.filter((run) => run.vaultTier > 0).length;
const vaultPaidGuesses = runs.filter((run) => run.vaultPaidGuesses >= 1).length;

const timePercent = Math.round((byTime / runs.length) * 100);
const attemptsPercent = Math.round((byAttempts / runs.length) * 100);
const level3Percent = Math.round((byLevel3 / runs.length) * 100);
const level5Percent = Math.round((byLevel5 / runs.length) * 100);
const level8Percent = Math.round((byLevel8 / runs.length) * 100);
const hintPercent = Math.round((byHint / runs.length) * 100);
const skipPercent = Math.round((bySkip / runs.length) * 100);
const vaultOpenedPercent = Math.round((vaultOpened / runs.length) * 100);
const vaultTierPercent = Math.round((vaultTier / runs.length) * 100);
const vaultPaidGuessesPercent = Math.round((vaultPaidGuesses / runs.length) * 100);


console.log(`Runs: ${runs.length}`);
console.log(`Ended by time: ${byTime} (${timePercent}%)`);
console.log(`Ended by attempts: ${byAttempts} (${attemptsPercent}%)`);
console.log(`Reached level 3+ (B1 words): ${byLevel3} (${level3Percent}%)`);
console.log(`Reached level 5+ (B2 words): ${byLevel5} (${level5Percent}%)`);
console.log(`Reached level 8+ (C1-C2 words): ${byLevel8} (${level8Percent}%)`);
console.log(`Bought a hint: ${byHint} (${hintPercent}%)`);
console.log(`Used a skip: ${bySkip} (${skipPercent}%)`);
console.log(`Opened the Vault: ${vaultOpened} (${vaultOpenedPercent}%)`);
console.log(`Won at least one Vault tier: ${vaultTier} (${vaultTierPercent}%)`);
console.log(`Made a paid Vault guess: ${vaultPaidGuesses} (${vaultPaidGuessesPercent}%)`);
