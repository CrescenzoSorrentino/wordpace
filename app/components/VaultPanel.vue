<template>
  <!-- Stessa schermata del gioco principale (HUD, riga di stato, griglia):
       qui "Time" mostra lo stesso timeLeft del gioco principale, che il
       genitore ferma solo mentre leggi una spiegazione (vittoria o
       sconfitta). -->
  <section class="wordle" aria-label="Vault">
    <div class="wordle__hud">
      <div class="wordle__stat">
        <span class="wordle__stat-label">Tier</span>
        <span class="wordle__stat-value">{{ tier + 1 }}</span>
      </div>
      <div class="wordle__stat">
        <span class="wordle__stat-label">Time</span>
        <span class="wordle__stat-value">{{ timeLeft }}</span>
      </div>
      <div class="wordle__stat">
        <span class="wordle__stat-label">Score</span>
        <span class="wordle__stat-value">{{ score }}</span>
      </div>
    </div>

    <!-- Stessa griglia a tre colonne del gioco principale: Unlocked a
         sinistra, i due bottoni impilati a destra, stessa classe (non solo
         stile simile). -->
    <div class="wordle__side-by-side">
      <div class="wordle__side-col">
        <!-- "Unlocked" tolto per non farsi stretto su mobile, stessa scelta
             del gioco principale: un lucchetto aperto porta lo stesso
             significato in un'icona. -->
        <p class="wordle__badge" aria-label="Unlocked">
          <svg
            class="wordle__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 7.5-2" />
          </svg>
          <span class="wordle__badge-value">{{ unlockedLabel }}</span>
        </p>
      </div>

      <div class="wordle__side-col wordle__side-col--right">
        <button class="wordle__hint-open" type="button" @click="emit('close')">
          <svg
            class="wordle__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <button
          class="wordle__hint-open"
          type="button"
          @click="listOpen = true"
        >
          <svg
            class="wordle__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h9" />
          </svg>
          List
        </button>
      </div>
    </div>

    <div class="wordle__status-row">
      <p class="wordle__message" role="status" aria-live="polite">
        {{ error }}
      </p>
    </div>

    <GameBoard :rows="board" />

    <!-- La tastiera resta sempre lì: scrivere il tentativo libero non blocca
         mai nulla, costa solo qualcosa se sbagli. Stessa lingua della
         didascalia sopra gli aiuti: un avviso scritto, non un blocco. -->
    <p class="vault__keyboard-warning">
      A wrong guess costs {{ guessCost.cost }} points — it never locks the
      tier.<br />
      Try a word from the List first to keep it cheap.
    </p>
    <OnScreenKeyboard :key-states="keyStates" @key="handleKey" />

    <!-- Popup della lista: le parole già risolte, scelte una alla volta come
         tentativo — stessa finestra usata dagli aiuti nel gioco principale. -->
    <div v-if="listOpen" class="wordle__overlay">
      <div
        class="wordle__result"
        role="dialog"
        aria-modal="true"
        aria-label="Solved words"
      >
        <p class="wordle__result-label">Pick a solved word</p>

        <p v-if="solvedWords.length === 0" class="vault__list-empty">
          No solved words yet — win one in the game to try it here.
        </p>
        <ul v-else class="vault__list">
          <li v-for="entry in solvedWords" :key="entry.word">
            <button
              class="vault__word"
              type="button"
              @click="chooseSolved(entry.word)"
            >
              {{ entry.word }}
              <!-- Stessa icona del badge "Seen" nel gioco principale: prepara
                   il terreno al quiz, che scatterà proprio su queste. -->
              <svg
                class="wordle__icon"
                :class="{ 'vault__seen-icon--hidden': !entry.wasReview }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20.5 14a8.5 8.5 0 1 1-1.9-8.4" />
                <polyline points="20.5 3.5 20.5 9 15 9" />
              </svg>
            </button>
          </li>
        </ul>

        <button class="wordle__again" type="button" @click="listOpen = false">
          Close
        </button>
      </div>
    </div>

    <!-- Spiegazione della parola vinta: stessa finestra del gioco principale,
         barra del tempo inclusa — si chiude da sola in EXPLANATION_TIME
         secondi, o subito col pulsante, esattamente come tra un livello e
         l'altro. Senza pulsante audio (per ora). -->
    <div v-if="wonWord" class="wordle__overlay">
      <div
        class="wordle__result"
        role="dialog"
        aria-modal="true"
        aria-label="Word explanation"
      >
        <div
          class="wordle__progress"
          role="progressbar"
          aria-label="Time left to read"
          :aria-valuenow="explanationTimeLeft"
          :aria-valuemax="EXPLANATION_TIME"
        >
          <div
            class="wordle__progress-bar"
            :style="{ width: explanationProgress }"
          />
        </div>

        <p class="wordle__result-label">The word was</p>
        <h2 class="wordle__result-title">{{ wonWord.toUpperCase() }}</h2>

        <p
          v-if="definition.pos || definition.ipa || definition.cefr"
          class="wordle__definition-meta"
        >
          <span v-if="definition.pos">{{ definition.pos }}</span>
          <span v-if="definition.ipa" class="wordle__definition-ipa">
            {{ definition.ipa }}
          </span>
          <span
            v-if="definition.cefr"
            class="wordle__definition-level"
            :class="`wordle__definition-level--${definition.cefr[0]!.toLowerCase()}`"
          >
            {{ definition.cefr }}
          </span>
        </p>

        <p class="wordle__definition wordle__definition--en">
          {{ definition.en }}
        </p>
        <p
          v-if="definition.example"
          class="wordle__definition wordle__definition--example"
        >
          “{{ definition.example }}”
        </p>

        <button class="wordle__again" type="button" @click="emit('continue')">
          Continue
        </button>
      </div>
    </div>

    <!-- Gemella della finestra qui sopra, per quando i sei tentativi finiscono
         senza aver indovinato: stessa barra, stessa spiegazione, stesso
         pulsante — solo la parola arriva da lostWord (rivelata, non
         indovinata) e chi la chiude fa ripartire lo stesso tier da capo
         invece di avanzare. -->
    <div v-if="lostWord" class="wordle__overlay">
      <div
        class="wordle__result"
        role="dialog"
        aria-modal="true"
        aria-label="Word explanation"
      >
        <div
          class="wordle__progress"
          role="progressbar"
          aria-label="Time left to read"
          :aria-valuenow="explanationTimeLeft"
          :aria-valuemax="EXPLANATION_TIME"
        >
          <div
            class="wordle__progress-bar"
            :style="{ width: explanationProgress }"
          />
        </div>

        <p class="wordle__result-label">Out of tries — the word was</p>
        <h2 class="wordle__result-title">{{ lostWord.toUpperCase() }}</h2>

        <p
          v-if="definition.pos || definition.ipa || definition.cefr"
          class="wordle__definition-meta"
        >
          <span v-if="definition.pos">{{ definition.pos }}</span>
          <span v-if="definition.ipa" class="wordle__definition-ipa">
            {{ definition.ipa }}
          </span>
          <span
            v-if="definition.cefr"
            class="wordle__definition-level"
            :class="`wordle__definition-level--${definition.cefr[0]!.toLowerCase()}`"
          >
            {{ definition.cefr }}
          </span>
        </p>

        <p class="wordle__definition wordle__definition--en">
          {{ definition.en }}
        </p>
        <p
          v-if="definition.example"
          class="wordle__definition wordle__definition--example"
        >
          “{{ definition.example }}”
        </p>

        <button class="wordle__again" type="button" @click="emit('continue')">
          Continue
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  EXPLANATION_TIME,
  isValidWord,
  keyStatesFor,
  MAX_ATTEMPTS,
  WORD_LENGTH,
  type LetterState,
} from "#shared/wordle";
import { MISSING_DEFINITION, type WordEntry } from "#shared/definitions";

const props = defineProps<{
  tier: number;
  score: number;
  guesses: string[];
  evaluations: LetterState[][];
  solvedWords: { word: string; wasReview: boolean }[];
  wonWord: string | null;
  lostWord: string | null;
  guessCost: { cost: number; affordable: boolean };
  timeLeft: string;
  explanationTimeLeft: number;
  explanationProgress: string;
}>();

const emit = defineEmits<{
  guess: [word: string, isFree: boolean];
  close: [];
  continue: [];
}>();

// Stato di sola interfaccia: cosa c'è scritto finora nel tentativo libero
// (una lettera alla volta, come `currentGuess` nel gioco principale — ma è
// tutta sua, non tocca lo stato del gioco), ed è sempre attivo (non più un
// interruttore lista/tastiera): la tastiera sta fissa sotto la griglia, e la
// lista si apre a parte, in un popup.
const freeGuess = ref("");
const error = ref("");
const listOpen = ref(false);

// La definizione della parola appena spiegata — vinta o persa, `wonWord` o
// `lostWord` — mostrata mentre uno dei due non è null. Suo scarico proprio,
// non quello del gioco principale: qui la parola non è mai `answer`.
const definition = ref<WordEntry>(MISSING_DEFINITION);

async function fetchDefinition(word: string) {
  definition.value = MISSING_DEFINITION;
  try {
    definition.value = await $fetch<WordEntry>("/api/definition", {
      query: { word },
    });
  } catch (e) {
    console.error("Could not load definition:", e);
  }
}

watch(
  () => props.wonWord,
  (word) => {
    if (word) fetchDefinition(word);
  },
);

watch(
  () => props.lostWord,
  (word) => {
    if (word) fetchDefinition(word);
  },
);

// Stessa forma di `board` nel gioco principale, e stessa griglia fissa
// (WORD_LENGTH × MAX_ATTEMPTS): righe per i tentativi già inviati, poi la
// riga attiva, poi tutte le righe restanti vuote, così la griglia ha sempre
// lo stesso aspetto della home invece di crescere e restringersi con ogni
// tentativo.
const board = computed(() => {
  const rows: { letter: string; state: LetterState | "empty" | "filled" }[][] =
    [];

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const cells: { letter: string; state: LetterState | "empty" | "filled" }[] =
      [];

    const submitted = r < props.guesses.length;
    const isActiveRow = r === props.guesses.length;

    for (let c = 0; c < WORD_LENGTH; c++) {
      if (submitted) {
        cells.push({
          letter: props.guesses[r]![c]!,
          state: props.evaluations[r]![c]!,
        });
      } else if (isActiveRow && c < freeGuess.value.length) {
        cells.push({ letter: freeGuess.value[c]!, state: "filled" });
      } else {
        cells.push({ letter: "", state: "empty" });
      }
    }

    rows.push(cells);
  }

  return rows;
});

// Riusa la stessa funzione pura del gioco principale, sui tentativi di
// questo tier invece che su quelli della parola in corso.
const keyStates = computed(() => keyStatesFor(props.guesses, props.evaluations));

// Per il badge "Unlocked": a differenza del numero in HUD (che è il tier
// grezzo), qui si mostra la fascia CEFR che quel tier sblocca — segue il
// tier corrente, non il livello della partita principale.
const TIER_LABELS = ["A1-A2", "+B1", "+B2", "All levels"];
const unlockedLabel = computed(() => TIER_LABELS[props.tier]);

function chooseSolved(word: string) {
  error.value = "";
  emit("guess", word, false);
  listOpen.value = false;
}

/** Smista un tasto (lettera, invio o cancella) per il tentativo libero. */
function handleKey(key: string) {
  if (key === "enter") {
    submitFree();
  } else if (key === "back") {
    freeGuess.value = freeGuess.value.slice(0, -1);
  } else if (/^[a-z]$/.test(key) && freeGuess.value.length < WORD_LENGTH) {
    freeGuess.value += key;
  }
}

function submitFree() {
  const word = freeGuess.value.trim().toLowerCase();
  if (word.length < WORD_LENGTH) {
    error.value = "Not enough letters";
    return;
  }
  if (!isValidWord(word)) {
    error.value = "Not in word list";
    return;
  }
  if (!props.guessCost.affordable) {
    error.value = "Not enough points";
    return;
  }
  error.value = "";
  emit("guess", word, true);
  freeGuess.value = "";
}

/**
 * Tastiera fisica: Escape chiude il popup della lista se è aperto; altrimenti
 * scrive nel tentativo libero. Il genitore, con questo pannello aperto, non
 * fa già più nulla con i tasti (si ferma all'Escape) quindi qui si può
 * ascoltare senza conflitti.
 */
function onPhysicalKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (listOpen.value) {
    if (event.key === "Escape") listOpen.value = false;
    return;
  }

  if (event.key === "Enter") {
    handleKey("enter");
  } else if (event.key === "Backspace") {
    handleKey("back");
  } else {
    handleKey(event.key.toLowerCase());
  }
}

onMounted(() => window.addEventListener("keydown", onPhysicalKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onPhysicalKey));
</script>

<style scoped>
/* Stessa struttura di .wordle in WordpaceGame.vue (flex, gap, larghezza
   massima) — nel flusso normale della pagina, non sopra a tutto: deve
   restare sotto il link "Wordpace" della pagina, esattamente dove sta la
   schermata di gioco che sostituisce. Le variabili --wg-* le eredita dal
   vero .wordle nel DOM (sono proprietà CSS, non classi): qui bastano le
   proprietà di LAYOUT, che non si ereditano da sole. */
.wordle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  width: 100%;
  max-width: 30rem;
  color: var(--color-text);
}

.wordle__hud {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  border-radius: var(--radius-base);
  background: var(--color-surface);
  overflow: hidden;
}

.wordle__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.6rem 0.4rem;
}

.wordle__stat + .wordle__stat {
  box-shadow: inset 1px 0 0 var(--color-border);
}

.wordle__stat-label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.wordle__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: lining-nums tabular-nums;
}

/* Stessa griglia a tre colonne dell'HUD qui sopra, stesso accorgimento del
   gioco principale per l'avvicinamento all'HUD (margine negativo): parlano
   della stessa cosa — a che punto è il Vault — e due blocchi imparentati
   vicini si leggono come uno. */
.wordle__side-by-side {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 4.4rem;
  margin-top: -0.6rem;
}

.wordle__side-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.wordle__side-col--right {
  /* `grid-column: 3` esplicito: senza, con la colonna 2 vuota (qui non c'è
     mai un "Seen before"), questo blocco scivolerebbe nella colonna 2 e
     sembrerebbe spostato verso il centro. */
  align-items: stretch;
  justify-self: end;
  grid-column: 3;
}

.wordle__badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
}

.wordle__badge-label {
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.wordle__badge-value {
  font-size: 0.78rem;
  color: var(--color-text);
}

/* Senza dimensione esplicita un SVG inline prende la misura di default del
   browser (enorme rispetto al testo del bottone): stessa regola del gioco
   principale, duplicata per lo stesso motivo di sempre. */
.wordle__icon {
  width: 1.05em;
  height: 1.05em;
  flex-shrink: 0;
}

/* `visibility: hidden` invece di `v-if`: la icona sparisce alla vista ma
   resta nel flusso, così ogni parola della lista occupa lo stesso spazio e
   il testo parte sempre dallo stesso punto, vista o non vista. */
.vault__seen-icon--hidden {
  visibility: hidden;
}

/* Back e List riusano la stessa classe dei bottoni Vault/Hint del gioco
   principale (`.wordle__hint-open`), duplicata qui perché lo stile "scoped"
   di Vue non passa da un componente all'altro da solo. */
.wordle__hint-open {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-border);
  color: var(--color-text);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.wordle__hint-open:hover {
  filter: brightness(0.94);
}

.wordle__hint-open:active {
  transform: translateY(1px);
}

.wordle__status-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2rem;
}

.wordle__message {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

/* Una lista vera, stesso linguaggio della classifica del gioco principale
   (`wordle__scores`): righe intere una sotto l'altra, non pillole in fila. */
.vault__list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vault__word {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
}

.vault__word:hover {
  filter: brightness(0.96);
}

.vault__word:active {
  transform: translateY(1px);
}

.vault__list-empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.vault__keyboard-warning {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
  text-align: center;
}

/* Stessa finestra usata dagli aiuti e dal Game Over nel gioco principale,
   duplicata qui per lo stesso motivo di sempre (stili scoped). */
.wordle__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.55);
}

.wordle__result {
  position: relative; /* riferimento per la barra del tempo, ancorata in alto */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 24rem;
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.wordle__result-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

/* Barra della spiegazione: stessa regola del gioco principale, duplicata
   qui per lo stesso motivo di sempre (stili scoped). */
.wordle__progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.wordle__progress-bar {
  height: 100%;
  background: var(--color-correct);
  transition: width 1s linear;
}

/* Spiegazione della parola vinta: stessa regole del gioco principale,
   duplicate qui per lo stesso motivo di sempre (stili scoped). */
.wordle__result-title {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.wordle__definition {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  text-wrap: pretty;
}

.wordle__definition-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: -0.4rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.wordle__definition-ipa {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.82rem;
}

.wordle__definition-level {
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #ffffff;
  background: var(--color-absent);
}

.wordle__definition-level--a {
  background: var(--color-correct);
}

.wordle__definition-level--b {
  background: var(--color-present);
  color: #ffffff;
}

.wordle__definition--en {
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-border);
  font-size: 1.05rem;
  line-height: 1.5;
}

.wordle__definition--example {
  padding: 0.7rem 0.85rem;
  border-left: 3px solid var(--color-correct);
  border-radius: 0 var(--radius-base) var(--radius-base) 0;
  background: var(--color-surface);
  font-size: 0.95rem;
  font-style: italic;
  line-height: 1.45;
  color: var(--color-text-dim);
}

/* Bottone che chiude il popup: stessa classe usata per aiuti, spiegazione e
   Game Over nel gioco principale — a tutta larghezza, non una pillola. */
.wordle__again {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0.25rem;
  padding: 0.85rem 1.4rem;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-correct);
  color: #ffffff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  cursor: pointer;
}

.wordle__again:hover {
  filter: brightness(0.93);
}

.wordle__again:active {
  transform: translateY(1px);
}
</style>
