<template>
  <div class="wordle__keyboard" aria-label="Keyboard">
    <div
      v-for="(krow, kIndex) in KEYBOARD_ROWS"
      :key="kIndex"
      class="wordle__keyboard-row"
    >
      <button
        v-for="key in krow"
        :key="key"
        class="wordle__key"
        :class="[
          { 'wordle__key--wide': key === 'enter' || key === 'back' },
          keyStates[key] ? `wordle__key--${keyStates[key]}` : '',
        ]"
        type="button"
        :aria-label="key === 'back' ? 'Backspace' : key"
        @click="emit('key', key)"
      >
        <template v-if="key === 'enter'">
          <span class="wordle__key-text">Enter</span>
          <span class="wordle__key-icon" aria-hidden="true">⏎</span>
        </template>
        <template v-else-if="key === 'back'">⌫</template>
        <template v-else>{{ key.toUpperCase() }}</template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LetterState } from "#shared/wordle";

defineProps<{
  keyStates: Record<string, LetterState>;
}>();

const emit = defineEmits<{
  key: [key: string];
}>();

// Disposizione della tastiera a schermo. "enter" e "back" sono i due tasti
// azione, tutto il resto sono lettere.
const KEYBOARD_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "back"],
];
</script>

<style scoped>
.wordle__keyboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap);
  width: 100%;
}

.wordle__keyboard-row {
  display: flex;
  justify-content: center;
  gap: var(--space-gap);
}

.wordle__key {
  /* flex:1 = ogni tasto si divide in parti uguali la larghezza della riga,
     così la riga si adatta a qualsiasi schermo — è questo che rende la
     tastiera responsive. */
  flex: 1;
  min-width: 0;
  height: 3.5rem;
  border: none;
  border-radius: var(--radius-base);
  background: var(--color-border);
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    filter 0.12s ease,
    transform 0.06s ease;
}

.wordle__key--wide {
  flex: 1.5;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}

.wordle__key:hover {
  filter: brightness(0.94);
}

/* Il tasto si abbassa appena quando lo premi: la tastiera risponde al tocco. */
.wordle__key:active {
  transform: translateY(1px);
}

/* Colori delle lettere già usate, stessa tavolozza della griglia. */
.wordle__key--correct {
  background: var(--color-correct);
  color: #ffffff;
}

.wordle__key--present {
  background: var(--color-present);
  color: #ffffff;
}

.wordle__key--absent {
  background: var(--color-absent);
  color: #ffffff;
}

/* Etichetta del tasto Invio: di norma la parola, col simbolo "⏎" nascosto. */
.wordle__key-icon {
  display: none;
}

/* Sugli schermi stretti la parola "Enter" viene sostituita dal simbolo "⏎",
   più compatto, così l'etichetta non esce mai dal suo tasto. */
@media (max-width: 430px) {
  .wordle__key-text {
    display: none;
  }
  .wordle__key-icon {
    display: inline;
    font-size: 1rem;
  }
}
</style>
