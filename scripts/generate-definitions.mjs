/**
 * Genera le voci di dizionario mancanti chiedendole a Claude, e le salva come
 * blocchi JSON in scripts/.cache/chunks/. Poi build-definitions.mjs le assembla
 * in shared/words/definitions.ts e le verifica.
 *
 * Si lancia con:
 *   node --env-file=.env scripts/generate-definitions.mjs          (tutte)
 *   node --env-file=.env scripts/generate-definitions.mjs 50       (solo 50, per provare)
 *
 * `--env-file` fa leggere a Node il file .env, dove sta ANTHROPIC_API_KEY.
 * Il .env è in .gitignore, quindi la chiave non finisce mai su GitHub.
 *
 * È pensato per essere rilanciato: riparte sempre dalle parole ancora mancanti,
 * quindi un'interruzione a metà non fa perdere nulla e non fa ripagare ciò che
 * è già stato generato.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CACHE = join(here, ".cache");
const CHUNKS = join(CACHE, "chunks");

/**
 * Quante parole per richiesta. Cinquanta è un compromesso: una richiesta sola
 * da 2.115 parole sarebbe lentissima e, se fallisse, si perderebbe tutto;
 * una richiesta per parola moltiplicherebbe per 2.115 il costo fisso delle
 * istruzioni, che vengono rimandate a ogni chiamata.
 */
const BATCH_SIZE = 50;

/**
 * Quante richieste in volo insieme. Non tutte: ogni account ha un limite di
 * richieste al minuto, e superarlo fa rifiutare le chiamate. Quattro è
 * prudente e finisce comunque in pochi minuti.
 */
const CONCURRENCY = 4;

/** Quante volte riprovare una richiesta fallita prima di arrendersi. */
const MAX_RETRIES = 3;

const MODEL = "claude-opus-5";

// === Pezzo 1: capire cosa manca ============================================

/**
 * Restituisce le parole che non hanno ancora una definizione, nell'ordine
 * della lista di partenza.
 */
function missingWords() {
  const words = readFileSync(join(CACHE, "words.txt"), "utf8")
    .trim()
    .split("\n");

  const done = new Set();
  const files = readdirSync(CHUNKS).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    const chunk = JSON.parse(readFileSync(join(CHUNKS, file), "utf8"));
    for (const word of Object.keys(chunk)) {
      done.add(word);
    }
  }

  return words.filter((word) => !done.has(word));
}

// === Pezzo 2: dire a Claude che forma deve avere la risposta ===============

/**
 * Lo schema della risposta attesa.
 *
 * Questa è la parte importante: NON stiamo scrivendo nelle istruzioni
 * "rispondi in JSON e per favore non aggiungere commenti", sperando che vada
 * bene. Stiamo passando all'API la forma esatta dei dati, e l'API garantisce
 * che la risposta la rispetti. Si chiama "structured output".
 *
 * Conseguenza pratica: non serve un parser difensivo che ripulisca la risposta
 * dalle frasi di cortesia o dai blocchi di codice markdown, perché non possono
 * esserci. Ogni campo ha il suo tipo e sono tutti obbligatori.
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
          pos: { type: "string" },
          ipa: { type: "string" },
          en: { type: "string" },
          short: { type: "string" },
          example: { type: "string" },
        },
        required: ["word", "pos", "ipa", "en", "short", "example"],
        additionalProperties: false,
      },
    },
  },
  required: ["entries"],
  additionalProperties: false,
};

/**
 * Le istruzioni, identiche per tutte le richieste.
 *
 * La versione precedente diceva "in simple English" e basta, ed era troppo
 * vaga: sono uscite definizioni da dizionario normale, corrette e inutili per
 * chi impara. La prova che le ha bocciate è del 2026-08-17 — tre quiz su carta
 * con definizioni vere, quindici secondi ciascuno, zero risposte giuste, e il
 * motivo non era la lunghezza ma le parole DENTRO le definizioni: `oak`,
 * `monks`, `valuables`. Si chiedeva di conoscere quattro parole difficili per
 * riconoscerne una difficile. Lo stesso era già successo all'insegnante
 * d'inglese, che ha comprato l'aiuto grande in partita e non ne è venuto fuori.
 *
 * Da qui il vincolo del vocabolario controllato, che è il metodo dei dizionari
 * per studenti (Longman definisce tutte le voci con ~2.000 parole di base), e
 * la clausola che dice cosa fare quando semplicità e precisione confliggono:
 * vince la precisione. Una definizione facile e sbagliata è peggio di una
 * difficile e giusta.
 *
 * Stanno nel prompt di sistema e non nel messaggio, così restano invariate fra
 * una richiesta e l'altra — e l'API le riconosce come già viste, facendole
 * costare meno.
 */
const SYSTEM_PROMPT = `You write dictionary entries for a word game that teaches English vocabulary. The players are learners, not native speakers — many of them around A2 or B1. They read your text in about twelve seconds, under time pressure, right after playing a word.

THE ONE RULE THAT MATTERS MOST

Explain a hard word using easy words. Restrict yourself to roughly the 2,000 most frequent words of English — the defining vocabulary a learner's dictionary uses. Never explain a word with a word that is as hard as it, or harder.

This is not a style preference, it is the whole point. "The nut of an oak tree" is a correct definition of "acorn" and a useless one: a learner who does not know "acorn" usually does not know "oak" either, so the sentence teaches nothing. "A nut that grows on a big tree" teaches the word.

Apply the same restriction to the example sentence. An example built out of difficult words explains nothing.

WHEN SIMPLE AND ACCURATE PULL APART

Accuracy wins. If plain words would make the definition wrong, vague, or true of many other things, spend an extra word or two rather than mislead. "A nut from a tree" is too vague for "acorn" — most nuts come from trees. Simple is the goal; imprecise is a failure.

Simple vocabulary, adult tone. Write the way a good learner's dictionary writes: plain, calm, factual. Never childish, never chatty, no exclamation marks, no addressing the reader.

FIELDS

- "word": the word exactly as given, lowercase.
- "pos": the part of speech, in English. One of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection, determiner. If the word is commonly used as more than one, join them with " · " (space, middle dot, space), most common first. Never more than two.
- "ipa": the pronunciation in IPA, wrapped in slashes, General American. Example: "/aɪl/".
- "en": one definition, 6 to 14 words, ending with a full stop. Define the most frequent sense. If a second sense is genuinely common, add it after a semicolon. Never use the word itself, or a word from its own family, to define it.
- "short": the same meaning compressed to 2 to 5 words, no full stop. It is shown as one of four options in a multiple-choice question, so it must be readable at a glance AND specific enough to tell this word apart from other words of the same kind. "a big piece" works for "chunk"; "a thing" does not. Use only the plainest words here — this is the field with the least room for anything difficult.
- "example": one natural sentence, 5 to 12 words, that uses the word (any inflected form is fine) and makes its meaning clear from context. End with a full stop. Do not put the word in quotes.

Return one entry per word given, in the same order, and no extra words.`;

// === Pezzo 3: una richiesta ================================================

const client = new Anthropic(); // legge da sola ANTHROPIC_API_KEY dall'ambiente

/**
 * Chiede le definizioni di un gruppo di parole e restituisce l'oggetto pronto
 * da salvare: { parola: {pos, ipa, en, short, example}, ... }.
 *
 * Riprova in caso di errore, aspettando sempre di più fra un tentativo e
 * l'altro ("backoff"): se il servizio è sovraccarico, ritentare subito peggiora
 * le cose; aspettare 2, poi 4, poi 8 secondi gli dà il tempo di riprendersi.
 */
async function generateBatch(words, attempt = 1) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      // `effort` regola quanto il modello ragiona prima di rispondere: qui il
      // compito è meccanico e ben specificato, quindi "medium" basta e costa
      // meno. Alzalo a "high" se le voci non ti convincono.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content: words.join("\n") }],
    });

    // Con lo structured output la risposta è un unico blocco di testo che
    // contiene JSON valido e conforme allo schema.
    const text = response.content.find((block) => block.type === "text")?.text;
    const { entries } = JSON.parse(text);

    // Si ricostruisce l'oggetto usando la parola come chiave, scartando il
    // campo "word" che a quel punto è ridondante.
    const result = {};
    for (const { word, ...fields } of entries) {
      result[word] = fields;
    }

    // Controllo: il modello ha risposto per tutte le parole chieste?
    //
    // Se ne mancano poche si tengono comunque le altre, e le mancanti
    // ricompariranno al prossimo lancio — `missingWords()` calcola cosa resta
    // da fare leggendo ciò che è stato salvato, quindi non serve altra logica.
    // Buttare via 49 voci valide perché una manca sarebbe uno spreco (ed è
    // esattamente l'errore che questo script faceva nella prima versione).
    //
    // Se invece ne manca più di un quinto, la risposta è andata storta sul
    // serio: meglio rifare la richiesta da capo.
    const missing = words.filter((w) => !result[w]);
    if (missing.length > words.length / 5) {
      throw new Error(`risposta troppo incompleta (${missing.length} mancanti)`);
    }
    if (missing.length) {
      console.log(`  ℹ️  non generate, verranno ritentate: ${missing.join(", ")}`);
    }

    return result;
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    const waitSeconds = 2 ** attempt;
    console.log(`  ⚠️  ${error.message} — riprovo fra ${waitSeconds}s`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    return generateBatch(words, attempt + 1);
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

/** Il numero del prossimo file di blocco (003, 004, …), senza sovrascrivere. */
function nextChunkNumber() {
  const numbers = readdirSync(CHUNKS)
    .filter((name) => name.endsWith(".json"))
    .map((name) => Number(name.replace(".json", "")))
    .filter((n) => Number.isInteger(n));
  return Math.max(0, ...numbers) + 1;
}

async function main() {
  mkdirSync(CHUNKS, { recursive: true });

  // Un numero passato da riga di comando limita quante parole fare, per
  // provare lo script senza lanciarlo su tutte e 2.115.
  const limit = Number(process.argv[2]) || Infinity;
  const todo = missingWords().slice(0, limit);

  if (!todo.length) {
    console.log("✔ Niente da fare: tutte le parole hanno già una definizione.");
    return;
  }

  const groups = chunked(todo, BATCH_SIZE);
  console.log(
    `Da generare: ${todo.length} parole in ${groups.length} richieste, ` +
      `${CONCURRENCY} alla volta, con ${MODEL}.\n`,
  );

  let chunkNumber = nextChunkNumber();
  let doneCount = 0;
  const started = Date.now();

  // Si lavora a ondate di CONCURRENCY richieste: si lanciano tutte insieme e
  // si aspetta che finiscano (Promise.all), poi si passa all'ondata dopo.
  for (const wave of chunked(groups, CONCURRENCY)) {
    const results = await Promise.all(
      wave.map(async (words) => {
        try {
          return { words, entries: await generateBatch(words) };
        } catch (error) {
          // Un gruppo fallito non ferma gli altri: si segnala e si prosegue.
          // Rilanciando lo script, quelle parole risulteranno ancora mancanti
          // e verranno ritentate.
          console.error(`✗ ${words[0]}…${words.at(-1)}: ${error.message}`);
          return null;
        }
      }),
    );

    // Il salvataggio avviene qui, fuori dalle richieste parallele, così i file
    // vengono numerati in ordine e senza collisioni.
    for (const result of results) {
      if (!result) continue;
      const name = String(chunkNumber++).padStart(3, "0") + ".json";
      writeFileSync(
        join(CHUNKS, name),
        JSON.stringify(result.entries, null, 2) + "\n",
      );
      doneCount += result.words.length;
      console.log(
        `✔ ${name}  ${result.words[0]} … ${result.words.at(-1)}  ` +
          `(${doneCount}/${todo.length})`,
      );
    }
  }

  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nFatto: ${doneCount} parole in ${minutes} minuti.`);
  console.log("Ora lancia:  node scripts/build-definitions.mjs");
}

main();
