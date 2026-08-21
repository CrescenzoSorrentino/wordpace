<template>
  <div class="wordle__overlay">
    <div
      class="wordle__result"
      role="dialog"
      aria-modal="true"
      aria-label="Game over"
    >
      <!-- A fine partita la domanda del giocatore è una sola: "quanto ho
           fatto?". Il punteggio è quindi il pezzo grande; il resto lo
           accompagna. -->
      <p class="wordle__result-label">Game over</p>
      <p class="wordle__result-score">{{ score }}</p>
      <p class="wordle__result-stats">
        Points · Reached level <strong>{{ level }}</strong>
      </p>
      <p class="wordle__result-text">
        Stopped by <strong>{{ answer.toUpperCase() }}</strong>
      </p>

      <!-- Richiesta del nome: solo se il punteggio è entrato nei primi 10 e non
         è ancora stato salvato. -->
      <form
        v-if="qualifies && !scoreSubmitted"
        class="wordle__nickname"
        @submit.prevent="emit('submit-score')"
      >
        <label class="wordle__nickname-label" for="nick">
          Top {{ leaderboardSize }} this month! Enter your name:
        </label>
        <input
          id="nick"
          class="wordle__nickname-input"
          v-model="nick"
          :maxlength="nicknameMaxLength"
          autocomplete="off"
        />
        <button class="wordle__again" type="submit">Save</button>

        <!-- role="alert" non è decorativo: fa annunciare il messaggio dai
             lettori di schermo appena compare. Chi non vede il modulo si
             accorgerebbe altrimenti solo del fatto che non succede nulla. -->
        <p v-if="submitError" class="wordle__nickname-error" role="alert">
          {{ submitError }}
        </p>
      </form>

      <!-- La classifica. Il titolo dice "this month" perché
           la lista riparte da zero ogni mese: senza, chi vede dieci punteggi
           più alti del suo pensa di essere fuori per sempre, invece che fino
           al primo del mese. È anche l'unico posto in cui il giocatore può
           accorgersi che esiste una scadenza. -->
      <div v-if="leaderboard.length" class="wordle__block">
        <p class="wordle__label">Best this month</p>
        <ol class="wordle__scores">
          <li
            v-for="(entry, i) in leaderboard"
            :key="i"
            class="wordle__scores-row"
            :class="{
              'wordle__scores-row--me':
                scoreSubmitted && entry.nick === myNick && entry.score === score,
            }"
          >
            <span class="wordle__scores-rank">{{ i + 1 }}</span>
            <span class="wordle__scores-nick">{{ entry.nick }}</span>
            <span class="wordle__scores-score">{{ entry.score }}</span>
          </li>
        </ol>
      </div>

      <button class="wordle__again" type="button" @click="emit('play-again')">
        Play again
      </button>

      <!-- Secondario di proposito, sotto e col solo contorno: dopo una
           partita la cosa che il giocatore vuole per prima è rigiocare, e
           questo non deve competere col tasto verde.

           L'etichetta cambia al posto di mostrare un messaggio a parte: né
           gli appunti né il pannello di condivisione lasciano una traccia
           visibile, e la conferma deve comparire dove è appena avvenuto il
           clic, non altrove nella finestra. -->
      <button
        class="wordle__share"
        type="button"
        :disabled="shareState !== 'idle'"
        @click="emit('share')"
      >
        <template v-if="shareState === 'done'">Copied!</template>
        <template v-else-if="shareState === 'failed'">
          Couldn't copy
        </template>
        <template v-else>Share result</template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Finestra di fine partita: presentazionale, nessuno stato proprio a parte
 * il testo del nickname (v-model). Punteggio, classifica e invio restano in
 * WordpaceGame.vue — qui arriva solo ciò che serve a disegnare, come già fa
 * GameBoard con `rows`.
 */
import type { LeaderboardEntry } from "#shared/leaderboard";

defineProps<{
  score: number;
  level: number;
  answer: string;
  qualifies: boolean;
  scoreSubmitted: boolean;
  submitError: string;
  leaderboardSize: number;
  nicknameMaxLength: number;
  leaderboard: LeaderboardEntry[];
  myNick: string;
  shareState: "idle" | "done" | "failed";
}>();

const nick = defineModel<string>("nick", { required: true });

const emit = defineEmits<{
  "submit-score": [];
  "play-again": [];
  share: [];
}>();
</script>

<style scoped>
/* === Finestra modale: chrome condiviso con HintPanel.vue e
   WordExplanation.vue. Lo scoped style di Vue non attraversa i confini dei
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

/* Il punteggio a fine partita: il numero risponde alla domanda che il
   giocatore si sta facendo, quindi è il pezzo grande della finestra. */
.wordle__result-score {
  margin: -0.5rem 0 -0.4rem;
  font-size: 3.2rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: lining-nums tabular-nums;
}

.wordle__result-stats {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.wordle__result-stats strong {
  color: var(--color-text);
}

.wordle__result-text {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text-dim);
}

.wordle__result-text strong {
  color: var(--color-text);
  letter-spacing: 0.05em;
}

/* === Modulo per il nome === */
.wordle__nickname {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-border);
}

.wordle__nickname-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.wordle__nickname-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.7rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-base);
  background: #ffffff;
  font: inherit;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: var(--color-text);
}

.wordle__nickname-input:focus {
  outline: none;
  border-color: var(--color-correct);
}

/* Il rosso qui è lecito, a differenza che sulla griglia: --color-urgent è già il
   colore del tempo che sta per finire, cioè "qualcosa non va", e un messaggio
   di errore dice la stessa cosa. Non ruba significato a verde e giallo, che
   sono i colori delle lettere. */
.wordle__nickname-error {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--color-urgent);
  text-align: center;
}

/* === Elenco della classifica === */
.wordle__scores {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.wordle__scores-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-base);
  background: var(--color-surface);
  font-size: 0.95rem;
}

/* La riga appena salvata dal giocatore si distingue dalle altre. */
.wordle__scores-row--me {
  background: #e8f2e7;
  box-shadow: inset 0 0 0 2px var(--color-correct);
}

.wordle__scores-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 3px;
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: lining-nums tabular-nums;
  color: #ffffff;
  background: var(--color-absent);
}

/* Oro, argento e bronzo per i primi tre. */
.wordle__scores-row:nth-child(1) .wordle__scores-rank {
  background: #c9a227;
}
.wordle__scores-row:nth-child(2) .wordle__scores-rank {
  background: #8e949a;
}
.wordle__scores-row:nth-child(3) .wordle__scores-rank {
  background: #a9743f;
}

.wordle__scores-nick {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-weight: 600;
}

.wordle__scores-score {
  font-variant-numeric: lining-nums tabular-nums;
  font-weight: 700;
}

/* Il pulsante di condivisione: solo contorno, come lo skip. È la stessa
   distinzione di lì — pieno per l'azione principale, contorno per quella
   secondaria — e qui la principale è rigiocare.

   Lo sfondo trasparente e non var(--color-surface): la finestra è bianca e il
   fondino chiaro lo renderebbe indistinguibile dai riquadri delle liste. */
.wordle__share {
  width: 100%;
  box-sizing: border-box;
  margin-top: -0.35rem;
  padding: 0.6rem 1.4rem;
  border: 1px solid var(--color-border-filled);
  border-radius: var(--radius-base);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.wordle__share:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-text);
}

.wordle__share:active:not(:disabled) {
  transform: translateY(1px);
}

/* Durante i due secondi e mezzo del riscontro il pulsante resta spento: non
   perché premerlo di nuovo faccia danni, ma perché un pulsante che dice
   "Copied!" ed è ancora premibile invita a premerlo e a chiedersi cosa fa. */
.wordle__share:disabled {
  border-color: var(--color-border);
  color: var(--color-text-dim);
  cursor: default;
}
</style>
