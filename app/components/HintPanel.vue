<template>
  <div class="wordle__overlay">
    <div
      class="wordle__result"
      role="dialog"
      aria-modal="true"
      aria-label="Hints"
    >
      <div class="wordle__block">
        <p class="wordle__result-label">Need a hint?</p>
        <p class="wordle__hints-intro">
          Each one costs points. The clock keeps running.
        </p>
      </div>

      <div class="wordle__hints-row">
        <button
          v-for="option in hintOptions"
          :key="option.size"
          class="wordle__hint"
          type="button"
          :disabled="option.bought || !option.affordable"
          :title="
            option.bought
              ? 'Already bought'
              : option.affordable
                ? `Costs ${option.cost} points`
                : 'Not enough points'
          "
          @click="emit('buy-hint', option.size)"
        >
          <span class="wordle__hint-label">{{ option.label }}</span>
          <span class="wordle__hint-cost">−{{ option.cost }}</span>
        </button>
      </div>

      <!-- Gli aiuti comprati restano per tutta la parola: sono stati pagati,
           e riaprire la finestra per rileggerli non deve costare un secondo
           acquisto. Ognuno porta il nome dell'aiuto da cui viene, altrimenti
           comprandone due non si capisce quale testo risponde a cosa. -->
      <div v-for="hint in boughtHints" :key="hint.size" class="wordle__hint-box">
        <p class="wordle__label">{{ hint.label }}</p>
        <p class="wordle__hint-text">{{ hint.text }}</p>
      </div>

      <!-- Lo skip sta qui perché la domanda è la stessa degli aiuti ("sono
           bloccato, cosa posso fare?") e la moneta pure. Ma è staccato dai
           tre e in fondo, non in fila con loro: è l'unica scelta di questa
           finestra che non si può disfare, e un dito che sbaglia pulsante
           deve poter sbagliare solo fra tre acquisti innocui. -->
      <div class="wordle__skip">
        <button
          class="wordle__skip-button"
          type="button"
          :disabled="!canSkip"
          :title="
            skipsLeft === 0
              ? 'No skips left in this run'
              : canSkip
                ? `Costs ${skipCost} points — the word is lost`
                : 'Not enough points'
          "
          @click="emit('skip')"
        >
          <span class="wordle__skip-label">Skip this word</span>
          <span class="wordle__skip-cost">−{{ skipCost }}</span>
        </button>

        <!-- Il prezzo da solo non basta a decidere: senza sapere quanti ne
             restano, il giocatore non può capire se conviene spenderlo ora o
             tenerlo per un livello più avanti, quando le parole sono più
             dure. E il rincaro del prossimo si legge già qui. -->
        <p class="wordle__skip-note">
          {{ skipsLeft === 1 ? "1 skip left" : `${skipsLeft} skips left` }}
          in this run · no points for a skipped word
        </p>
      </div>

      <button class="wordle__again" type="button" @click="emit('close')">
        Back to the game
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Finestra degli aiuti: presentazionale, nessuno stato proprio. Tutte le
 * regole (prezzi, cosa si può comprare) restano in WordpaceGame.vue — qui
 * arriva solo ciò che serve per disegnare, come già fa GameBoard con `rows`.
 */
import type { HintSize } from "#shared/wordle";

defineProps<{
  hintOptions: {
    size: HintSize;
    cost: number;
    label: string;
    bought: boolean;
    affordable: boolean;
  }[];
  boughtHints: { size: HintSize; label: string; text: string }[];
  canSkip: boolean;
  skipsLeft: number;
  skipCost: number;
}>();

const emit = defineEmits<{
  "buy-hint": [size: HintSize];
  skip: [];
  close: [];
}>();
</script>

<style scoped>
/* === Pannello degli aiuti ===
   Sta fra la griglia e la tastiera e usa il linguaggio della tastiera (tasti
   grigi, stessi angoli): è un'azione, non un contenuto, e deve leggersi come
   tale. La sua animazione d'ingresso (wordle-hints-in) resta sul pulsante
   che lo apre, in WordpaceGame.vue: qui non serve. */

/* Avverte che il tempo continua a scorrere: senza, il giocatore potrebbe
   credere che la finestra metta in pausa, come fa quella della spiegazione. */
.wordle__hints-intro {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

/* Tre colonne di uguale larghezza: su qualsiasi schermo i pulsanti restano
   allineati su una riga sola, invece di andare a capo in modo irregolare. */
.wordle__hints-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-gap);
  width: 100%;
}

.wordle__hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;
  padding: 0.5rem 0.3rem;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-border);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition: filter 0.12s ease;
}

.wordle__hint:hover:not(:disabled) {
  filter: brightness(0.94);
}

.wordle__hint:active:not(:disabled) {
  transform: translateY(1px);
}

/* Speso o non permesso: resta leggibile ma chiaramente inattivo. Il prezzo
   continua a vedersi, perché è l'informazione che spiega il perché. */
.wordle__hint:disabled {
  background: var(--color-surface);
  color: var(--color-text-dim);
  cursor: not-allowed;
}

.wordle__hint-label {
  font-size: 0.78rem;
  font-weight: 700;
}

.wordle__hint-cost {
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: lining-nums tabular-nums;
  opacity: 0.7;
}

/* Il riquadro su fondino chiaro: lo stesso usato dalla riga della classifica
   in GameOverModal.vue. Stessa forma perché sono la stessa cosa — un
   blocchetto di contenuto dentro una finestra — ma qui la regola è
   duplicata invece che condivisa: lo scoped style di Vue non attraversa i
   confini dei componenti. */
.wordle__hint-box {
  box-sizing: border-box;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-base);
  background: var(--color-surface);
  text-align: left;
}

.wordle__hint-text {
  margin: 0.15rem 0 0;
  font-size: 0.88rem;
  line-height: 1.4;
}

/* Il filetto in cima è la separazione vera fra "compro un aiuto" e "abbandono
   la parola": sono due categorie di scelta diverse, e senza una riga che le
   divida lo skip sembrerebbe il quarto acquisto della fila. */
.wordle__skip {
  width: 100%;
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-border);
}

/* Largo tutta la finestra, al contrario dei tre aiuti che stanno in colonne
   strette: la larghezza diversa dice da sola che non è uno di loro.

   Solo contorno e nessun fondo, mentre gli aiuti sono pieni: è la coppia
   "azione principale / azione secondaria" che si vede ovunque, e qui dice la
   cosa giusta — la via normale quando sei bloccato è comprare un aiuto e
   risolvere, abbandonare la parola è il ripiego.

   Il fondo trasparente non è un dettaglio: con un fondino chiaro lo skip
   diventava indistinguibile dagli aiuti SPENTI, che passano anche loro a
   --color-surface. Ed è lo stato in cui li trova chiunque inizi una partita, a
   punti zero. */
.wordle__skip-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border-filled);
  border-radius: var(--radius-base);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

/* Il fondo compare solo al passaggio del mouse. Con lo sfondo trasparente non
   c'è niente da scurire con un filtro, come si fa per gli aiuti: qui la
   reazione al mouse deve essere il fondo stesso. */
.wordle__skip-button:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-text);
}

.wordle__skip-button:active:not(:disabled) {
  transform: translateY(1px);
}

/* Come per gli aiuti: spento ma leggibile, e il prezzo resta in vista perché
   di solito è proprio lui la spiegazione del perché è spento. Anche il
   contorno si schiarisce: un pulsante inattivo non può avere il bordo più
   marcato di quelli attivi lì accanto. */
.wordle__skip-button:disabled {
  border-color: var(--color-border);
  color: var(--color-text-dim);
  cursor: not-allowed;
}

.wordle__skip-label {
  font-size: 0.85rem;
  font-weight: 700;
}

.wordle__skip-cost {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: lining-nums tabular-nums;
  opacity: 0.7;
}

.wordle__skip-note {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-text-dim);
  text-align: center;
}

/* === Finestra modale: chrome condiviso con WordExplanation.vue e
   GameOverModal.vue (stesso motivo del duplicato qui sopra). === */
.wordle__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.55);
  animation: wordle-fade 0.2s ease;
}

.wordle__result {
  position: relative;
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
  animation: wordle-pop 0.2s ease;
}

@keyframes wordle-fade {
  from {
    opacity: 0;
  }
}

@keyframes wordle-pop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}

.wordle__result-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.wordle__block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.wordle__label {
  margin: 0;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

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
  transition: filter 0.12s ease;
}

.wordle__again:hover {
  filter: brightness(0.93);
}

.wordle__again:active {
  transform: translateY(1px);
}
</style>
