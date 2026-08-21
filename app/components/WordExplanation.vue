<template>
  <div class="wordle__overlay">
    <div
      class="wordle__result"
      role="dialog"
      aria-modal="true"
      aria-label="Word explanation"
    >
      <!-- Barra che si svuota: dice quanto manca senza costringere a leggere
           un numero mentre si sta già leggendo la definizione. -->
      <div
        class="wordle__progress"
        role="progressbar"
        aria-label="Time left to read"
        :aria-valuenow="timeLeft"
        :aria-valuemax="totalTime"
      >
        <div class="wordle__progress-bar" :style="{ width: progress }" />
      </div>

      <p class="wordle__result-label">The word was</p>

      <!-- Il lemma e il suo pulsante audio stanno insieme: è lì che uno
           cerca il modo di sentire come si pronuncia. -->
      <div class="wordle__headword">
        <h2 class="wordle__result-title">{{ answer.toUpperCase() }}</h2>
        <!-- La voce di sistema è la pronuncia autorevole; l'IPA è l'aiuto
             visivo. Se i due divergono, ha ragione l'audio. -->
        <button
          class="wordle__speak"
          type="button"
          :aria-label="`Listen to the pronunciation of ${answer}`"
          @click="emit('speak')"
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
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a9 9 0 0 1 0 14" />
          </svg>
        </button>
      </div>

      <!-- Riga dei dati brevi: categoria, pronuncia e quanto vale la pena
           impararla. Ogni pezzo compare solo se c'è, così una parola non
           ancora generata mostra solo il testo di ripiego. -->
      <p
        v-if="definition.pos || definition.ipa || definition.cefr"
        class="wordle__definition-meta"
      >
        <span v-if="definition.pos">{{ definition.pos }}</span>
        <span v-if="definition.ipa" class="wordle__definition-ipa">
          {{ definition.ipa }}
        </span>
        <!-- Il livello di corso a cui si impara la parola, non la sua
             frequenza: "B2" chi studia inglese lo può confrontare col proprio
             livello, "uncommon" no. La classe si ricava dalla prima lettera
             (A, B o C), così bastano tre colori per sei livelli. -->
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
</template>

<script setup lang="ts">
/**
 * Spiegazione della parola: presentazionale, nessuno stato proprio. Il
 * conto alla rovescia e la voce del dizionario vivono in WordpaceGame.vue
 * (e nel suo gemello per il Vault); qui arriva solo ciò che serve a
 * disegnare, come già fa GameBoard con `rows`.
 */
import type { WordEntry } from "#shared/definitions";

defineProps<{
  timeLeft: number;
  totalTime: number;
  progress: string;
  answer: string;
  definition: WordEntry;
}>();

const emit = defineEmits<{
  speak: [];
  continue: [];
}>();
</script>

<style scoped>
/* === Finestra modale: chrome condiviso con HintPanel.vue e
   GameOverModal.vue. Lo scoped style di Vue non attraversa i confini dei
   componenti, quindi queste regole sono duplicate invece che condivise. === */
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

/* Barra del tempo di lettura, incollata al bordo alto della finestra: dice
   quanto manca senza costringere a leggere un numero mentre si legge altro. */
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
  /* `linear` e non `ease`: il tempo scorre a velocità costante, e
     l'animazione deve dire la verità. */
  transition: width 1s linear;
}

/* Il lemma e il suo pulsante audio, sulla stessa riga. */
.wordle__headword {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: -0.4rem 0 0;
}

/* La parola ha lo stesso trattamento delle lettere sulla griglia: stesso
   carattere, stesso peso, stesso spirito. È la stessa cosa, rivelata. */
.wordle__result-title {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* === Voce di dizionario === */
.wordle__definition {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  text-wrap: pretty; /* evita che l'ultima riga resti con una parola sola */
}

/* Riga dei dati brevi sotto la parola: categoria · pronuncia · frequenza. */
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

/* La pronuncia in carattere a larghezza fissa: i simboli fonetici hanno
   bisogno di spazio proprio per non impastarsi. */
.wordle__definition-ipa {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.82rem;
}

/* Livello CEFR: la stessa pastiglia colorata che il gioco usa per le lettere,
   così l'informazione parla il linguaggio del gioco.

   Tre colori per sei livelli, presi dalla prima lettera: A verde (la sai), B
   giallo (ci stai arrivando), C grigio (è una parola da collezione). Sei
   sfumature distinte sarebbero sei cose da imparare per il giocatore, e la
   sigla accanto dice già tutto quello che serve. */
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

/* Pulsante della pronuncia: un tasto tondo dello stesso grigio della
   tastiera, così si riconosce subito come qualcosa da premere. */
.wordle__speak {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border);
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.12s ease,
    transform 0.08s ease;
}

.wordle__speak:hover {
  background: var(--color-border-filled);
}

.wordle__speak:active {
  transform: scale(0.92);
}

/* La definizione: è il testo che si legge davvero, quindi il più grande. */
.wordle__definition--en {
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-border);
  font-size: 1.05rem;
  line-height: 1.5;
}

/* La frase d'esempio: fondino chiaro e filetto verde a sinistra, lo stesso
   verde delle lettere azzeccate. */
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

.wordle__icon {
  width: 1.05em;
  height: 1.05em;
  flex-shrink: 0;
}
</style>
