<template>
  <div class="wordle__board">
    <!-- Una riga per ogni elemento di `rows`. -->
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="wordle__row">
      <!-- Una cella per ogni lettera di quella riga. -->
      <div
        v-for="(cell, cellIndex) in row"
        :key="cellIndex"
        class="wordle__cell"
        :class="`wordle__cell--${cell.state}`"
      >
        {{ cell.letter.toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LetterState } from "#shared/wordle";

defineProps<{
  rows: { letter: string; state: LetterState | "empty" | "filled" }[][];
}>();
</script>

<style scoped>
/* Le variabili --wg-* arrivano da .wordle in WordpaceGame.vue: sono
   proprietà CSS, non classi, quindi passano ai componenti figli senza
   bisogno di ridichiararle. */
.wordle__board {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap);
}

.wordle__row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-gap);
}

.wordle__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Si restringe sui telefoni stretti, non supera mai 3.5rem sul computer. */
  width: clamp(2.5rem, 16vw, 3.5rem);
  height: clamp(2.5rem, 16vw, 3.5rem);
  border: 2px solid var(--color-border);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
}

/* Una cella scritta ma non ancora inviata: bordo più scuro e un guizzo, così
   si vede che la lettera è stata registrata. */
.wordle__cell--filled {
  border-color: var(--color-border-filled);
  animation: wordle-pop-cell 0.1s ease-out;
}

@keyframes wordle-pop-cell {
  from {
    transform: scale(1.06);
  }
}

/* I tre colori dell'esito. */
.wordle__cell--correct {
  background: var(--color-correct);
  border-color: var(--color-correct);
  color: #ffffff;
}

.wordle__cell--present {
  background: var(--color-present);
  border-color: var(--color-present);
  color: #ffffff;
}

.wordle__cell--absent {
  background: var(--color-absent);
  border-color: var(--color-absent);
  color: #ffffff;
}
</style>
