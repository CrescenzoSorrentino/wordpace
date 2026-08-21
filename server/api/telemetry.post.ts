import { Redis } from "@upstash/redis";

// La lista delle partite finite, e quante se ne tengono. Mille è il punto in
// cui la lista dice già tutto quello che c'è da sapere: le domande a cui deve
// rispondere sono "a che livello si muore", "per tempo o per tentativi",
// "quali aiuti si comprano", e su mille partite quelle proporzioni non
// cambiano più aggiungendone altre.
const runsKey = "wordpace:runs";
const MAX_RUNS_KEPT = 1000;

// Quante partite può registrare uno stesso indirizzo in un'ora. Dieci e non
// cinque come la classifica: là si manda un punteggio solo entrando nei primi
// dieci, qui ogni partita finita scrive una riga, e una partita dura sui tre
// minuti. Un limite stretto non fermerebbe chi vuole disturbare — farebbe
// sparire i dati di chi gioca tanto, cioè quelli che interessano di più.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

// I modi in cui una partita può finire. In un elenco e non in due confronti
// perché il giorno che ne aggiungiamo un terzo — l'abbandono, per dire — si
// aggiunge una parola qui invece di un ramo alla condizione.
const CAUSES = ["time", "attempts"] as const;

/**
 * POST /api/telemetry
 * body: { level, score, cause, hints: HintSize[], skips, vaultTier,
 *         vaultOpened, vaultNetScore, vaultPaidGuesses }
 *
 * Registra una partita finita, per sapere se il gioco è tarato bene: a che
 * livello ci si ferma davvero, se si perde per tempo o per tentativi, quali
 * aiuti vengono comprati. Nessun nickname e nessun indirizzo finiscono nella
 * riga salvata: non interessa CHI ha giocato, interessa cosa succede.
 *
 * Il corpo si salva così com'è arrivato, senza rimontarlo campo per campo:
 * il giorno che il gioco manderà anche i risultati del quiz di richiamo,
 * questa rotta li scriverà senza sapere che esistono.
 *
 * L'ordine delle tre fasi è la parte che conta, ed è lo stesso di
 * leaderboard.post.ts: prima i controlli gratuiti sul corpo, che respingono le
 * chiamate malfatte senza disturbare Redis; poi il limite di invii, che costa
 * una chiamata di rete; e solo alla fine le scritture, perché una scrittura
 * fatta non si disfa.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Il livello dev'essere un numero intero e almeno 1: il gioco parte da lì.
  // Senza questo controllo, un livello "sei" o -3 non darebbe nessun errore
  // adesso — si farebbe vivo fra sei mesi, come conti sbagliati in silenzio.
  const level = Number(body?.level);
  if (!Number.isInteger(level) || level < 1) {
    throw createError({ statusCode: 400, statusMessage: "Invalid level" });
  }

  // L'elenco davanti e il valore dentro: chiedendolo al contrario, una
  // richiesta senza `cause` chiamerebbe .includes su undefined e la rotta
  // morirebbe con un 500 ("il server è rotto") invece di un 400 ("la tua
  // richiesta è sbagliata").
  if (!CAUSES.includes(body?.cause)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid cause" });
  }

  const config = useRuntimeConfig(event);
  const redis = new Redis({
    url: config.upstashRedisRestUrl,
    token: config.upstashRedisRestToken,
  });

  // Chiave separata da quella della classifica: con un contatore solo, finire
  // dieci partite consumerebbe anche il diritto di mandare un punteggio, e il
  // giocatore si vedrebbe rifiutare il record senza capire perché.
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const rateLimitKey = `wordpace:telemetry:ratelimit:${ip}`;

  const submissions = await redis.incr(rateLimitKey);

  // La scadenza si mette solo al primo invio: rinnovandola ogni volta, l'ora
  // ripartirebbe da capo a ogni partita e la finestra non si chiuderebbe mai.
  if (submissions === 1) {
    await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
  }

  // Fratello del precedente, non figlio: annidandolo dentro l'if di sopra
  // varrebbe solo al primo invio, cioè quando il contatore vale 1 e non può
  // essere sopra il limite — il controllo non scatterebbe mai.
  if (submissions > RATE_LIMIT_MAX) {
    throw createError({ statusCode: 429, statusMessage: "Too many runs" });
  }

  // lpush mette in cima: le partite più recenti stanno all'inizio, che è
  // l'ordine in cui le si vuole leggere. ltrim tiene solo le prime
  // MAX_RUNS_KEPT e butta il resto — senza, la lista crescerebbe per sempre.
  await redis.lpush(runsKey, JSON.stringify({...body, date: new Date().toISOString()}));
  await redis.ltrim(runsKey, 0, MAX_RUNS_KEPT - 1);

  return { ok: true };
});
