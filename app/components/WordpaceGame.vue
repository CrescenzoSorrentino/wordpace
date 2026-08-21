<template>
  <section class="wordle" aria-label="Wordpace game">
    <!-- Con il Vault aperto, l'intera schermata di gioco (qui sotto) lascia
         il posto a VaultPanel invece di restarci sotto: sono due schermate
         alternative, non una sopra l'altra (deciso così, per restare nello
         stesso punto della pagina — sotto al link "Wordpace" che riporta
         al menu — invece di coprire tutto come fanno le finestre modali
         qui sotto). -->
    <template v-if="!vaultPanelOpen">
      <div class="wordle__hud">
        <div class="wordle__stat">
          <span class="wordle__stat-label">Level</span>
          <span class="wordle__stat-value">{{ level }}</span>
        </div>
        <div
          class="wordle__stat"
          :class="{
            'wordle__stat--urgent': status === 'playing' && timeLeft <= 15,
          }"
        >
          <span class="wordle__stat-label">Time</span>
          <span class="wordle__stat-value">{{ timeDisplay }}</span>
        </div>
        <div class="wordle__stat">
          <span class="wordle__stat-label">Score</span>
          <span class="wordle__stat-value">{{ score }}</span>
        </div>
      </div>

      <!-- Le due cose che il gioco faceva senza dirle. Le fasce di vocabolario e
           il ripescaggio esistevano solo nella logica: chi giocava vedeva un
           clone del gioco delle cinque lettere con una definizione in fondo.

           In una riga loro e non dentro le celle dell'HUD: là sotto un numero
           starebbe un testo lungo il doppio, la cella crescerebbe e deciderebbe
           l'altezza di tutta la fila. L'altezza è fissa e riservata anche quando
           il secondo badge non c'è, per lo stesso motivo per cui lo è la riga del
           messaggio qui sotto: comparendo, non deve spostare la griglia mentre
           qualcuno sta digitando. -->
      <!-- Una riga sola, allineata al centro verticalmente (il bottone Vault è
           più alto della semplice scritta "Unlocked", quindi senza centrare si
           vedrebbero scalini): "Unlocked" a sinistra, "Seen before" (quando
           c'è) in mezzo, Vault/Hint impilati a destra. -->
      <div class="wordle__side-by-side">
        <div class="wordle__side-col">
          <!-- "Unlocked" tolto per non farsi stretto su mobile: un lucchetto
               APERTO (il contrario di quello scartato per il Vault, dove
               significava "chiuso" per sbaglio) porta lo stesso significato
               in un'icona invece che in una parola. -->
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
            <span class="wordle__badge-value">{{ unlockedBand }}</span>
          </p>
        </div>

        <!-- Niente verde o giallo: nel gioco quei due colori dicono "lettera
             giusta" e "lettera fuori posto", e usarli qui come decorazione
             presterebbe un significato che questo badge non ha.

             L'icona è disegnata e non un'emoji, per la stessa ragione scritta
             sopra il pulsante degli aiuti: un SVG eredita `currentColor` e sta
             nella tavolozza del gioco, mentre un'emoji la disegna il sistema
             operativo — a colori pieni, diversa su ogni telefono. -->
        <p v-if="isReview" class="wordle__badge wordle__badge--review">
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
            <path d="M20.5 14a8.5 8.5 0 1 1-1.9-8.4" />
            <polyline points="20.5 3.5 20.5 9 15 9" />
          </svg>
          <span>Seen</span>
        </p>

        <div class="wordle__side-col wordle__side-col--right">
          <button
            class="wordle__hint-open"
            :class="{ 'wordle__hint-open--lit': vaultHasAttempt }"
            type="button"
            :aria-label="
              vaultHasAttempt
                ? 'Open the Vault — a guess is ready'
                : 'Open the Vault'
            "
            @click="vaultPanelOpen = true"
          >
            <!-- Un portellone da caveau (cerchio, ghiera centrale, quattro
                 perni) invece di un lucchetto: quello si legge come "chiuso",
                 mentre il bottone è sempre cliccabile. Stessa idea delle altre
                 icone: disegnata, non un'emoji, eredita il colore del testo.
                 La ghiera si accende (stessa classe --lit della lampadina
                 degli aiuti) quando c'è una parola pronta da provare. -->
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
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" class="wordle__icon-dial" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
            </svg>
            Vault
          </button>

          <button
            v-if="hintAvailable"
            class="wordle__hint-open"
            :class="{ 'wordle__hint-open--lit': canBuyAnyHint }"
            type="button"
            :aria-label="
              canBuyAnyHint ? 'Open hints — one is available' : 'Open hints'
            "
            @click="hintPanelOpen = true"
          >
            <!-- Icona disegnata qui e non un'emoji: un SVG eredita
                 `currentColor`, quindi si spegne insieme al pulsante ed è
                 identico su ogni sistema. Un'emoji la disegna il sistema
                 operativo, sempre a colori pieni. -->
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
              <path
                class="wordle__icon-bulb"
                d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"
              />
              <path d="M9.5 20h5" />
            </svg>
            Hint
          </button>
        </div>
      </div>

      <!-- Riga di servizio: solo il messaggio, ora che i bottoni sono saliti
           nella coppia di colonne qui sopra. Resta un'altezza fissa e riservata
           per lo stesso motivo di sempre: comparendo, non deve spostare la
           griglia mentre qualcuno sta digitando. -->
      <div class="wordle__status-row">
        <!-- aria-live fa sì che i lettori di schermo annuncino il messaggio. -->
        <p class="wordle__message" role="status" aria-live="polite">
          {{ message }}
        </p>
      </div>

      <GameBoard :rows="board" />

      <!-- Aiuti: una finestra e non un pannello dentro la pagina. Su uno schermo
           da telefono il gioco occupa già tutta l'altezza disponibile, e un
           blocco che cresce a ogni acquisto spingeva la tastiera fuori schermo.
           Una finestra sopra il gioco non toglie spazio a nulla, e riusa un
           linguaggio che il giocatore conosce già (spiegazione, fine partita).
           La finestra in sé è HintPanel.vue: qui restano solo i dati e le
           azioni, come per GameBoard qualche riga sopra. -->
      <HintPanel
        v-if="hintPanelOpen"
        :hint-options="hintOptions"
        :bought-hints="boughtHintsView"
        :can-skip="canSkip"
        :skips-left="skipsLeft"
        :skip-cost="skipCost"
        @buy-hint="buyHint"
        @skip="skipWord"
        @close="hintPanelOpen = false"
      />

      <!-- Spiegazione: finestra che appare fra un livello e l'altro (e prima del
           Game Over), col significato della parola appena giocata. L'evento
           "continue" chiama la stessa funzione dello scadere dei secondi: la
           anticipa. -->
      <WordExplanation
        v-if="status === 'explaining'"
        :time-left="explanationTimeLeft"
        :total-time="EXPLANATION_TIME"
        :progress="explanationProgress"
        :answer="answer"
        :definition="currentDefinition"
        @speak="speakWord"
        @continue="finishExplanation"
      />

      <!-- Game Over: finestra modale che appare a partita finita. -->
      <GameOverModal
        v-if="status === 'lost'"
        v-model:nick="nick"
        :score="score"
        :level="level"
        :answer="answer"
        :qualifies="qualifies"
        :score-submitted="scoreSubmitted"
        :submit-error="submitError"
        :leaderboard-size="LEADERBOARD_SIZE"
        :nickname-max-length="NICKNAME_MAX_LENGTH"
        :leaderboard="leaderboard"
        :my-nick="myNick"
        :share-state="shareState"
        @submit-score="submitScore"
        @play-again="newRun"
        @share="shareResult"
      />

      <!-- Tastiera a schermo: l'unico modo per scrivere su un dispositivo touch. -->
      <OnScreenKeyboard :key-states="keyStates" @key="handleKey" />
    </template>

    <VaultPanel
      v-else
      :tier="vaultTier"
      :score="score"
      :guesses="vaultGuesses"
      :evaluations="vaultEvaluations"
      :solved-words="solvedWords"
      :won-word="vaultWonWord"
      :lost-word="vaultLostWord"
      :guess-cost="vaultGuessCost"
      :time-left="timeDisplay"
      :explanation-time-left="vaultExplanationTimeLeft"
      :explanation-progress="vaultExplanationProgress"
      @guess="submitVaultGuess"
      @close="vaultPanelOpen = false"
      @continue="finishVaultExplanation"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Wordpace — il gioco intero: la griglia, le due tastiere (fisica e a
 * schermo), il cruscotto livello/tempo/punteggio, il conto alla rovescia di
 * ogni livello e la classifica di fine partita. Qui stanno l'interfaccia e lo
 * stato reattivo; le regole pure (valutazione, validazione, formula del timer)
 * vivono in #shared/wordle, quelle della classifica in #shared/leaderboard.
 */
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  evaluateGuess,
  isValidWord,
  pickRandomAnswer,
  timeForLevel,
  MAX_TIME,
  TIME_BONUS_CORRECT,
  TIME_BONUS_PRESENT,
  TIME_PENALTY,
  EXPLANATION_TIME,
  HINT_MIN_GUESSES,
  HINT_LOW_TIME,
  costForHint,
  pickUntriedLetter,
  maskWordInExample,
  MAX_SKIPS,
  costForSkip,
  bandForLevel,
  vaultWordForTier,
  keyStatesFor,
  evaluationsCountPosition,
  costForVaultGuess,
  vaultTierLevel,
  type LetterState,
  type HintSize,
} from "#shared/wordle";
import {
  LEADERBOARD_SIZE,
  NICKNAME_MAX_LENGTH,
  isValidNickname,
  sanitizeNickname,
  type LeaderboardEntry,
} from "#shared/leaderboard";
// Solo il TIPO, non i dati. Un `import type` sparisce quando il codice viene
// tradotto in JavaScript: serve a TypeScript per i controlli e non trascina
// nel browser un solo byte del dizionario. Importare `getDefinition` come
// facevamo prima ci riporterebbe dentro tutte le 2.315 voci.
import type { WordEntry } from "#shared/definitions";
import { loadReviewQueue, saveRun } from "~/utils/stats";

// Le tre fasi del gioco: si sta giocando, si sta leggendo la spiegazione della
// parola, oppure la partita è finita. Tutto il resto del codice si regola su
// questa: le funzioni di input si fermano da sole appena la fase non è
// "playing".
type GameStatus = "playing" | "explaining" | "lost";

// Dove si va quando la spiegazione finisce. Volutamente NON ripete la parola
// "explaining": quella informazione la dà già GameStatus, e un dato scritto in
// due posti prima o poi diverge.
//
// "same-level" è la destinazione dello skip, e le altre due non andavano bene
// proprio per quello che NON deve succedere: parola nuova sì, ma senza salire
// di livello e senza i secondi che un livello nuovo regala.
type NextStep = "next-level" | "same-level" | "game-over";

// Voci preferite per la pronuncia, in ordine: si prende la prima disponibile.
// L'ordine NON è un dettaglio estetico. Le voci marcate "en-US" includono anche
// gli effetti sonori scherzo di macOS (Zarvox, Boing, Bollicine…): chiedendo
// genericamente una voce inglese si rischia di ottenere un robot da cartone
// animato. Meglio nominare quelle buone e tenere il generico come ripiego.
const PREFERRED_VOICES = [
  "Google US English", // la migliore, ma solo su Chrome
  "Samantha", // voce di sistema macOS, sempre presente
  "Daniel", // britannica, ripiego di qualità
];

// === Stato del gioco (reattivo: lo schermo lo segue da solo) ===

const answer = ref(""); // la parola segreta di questo livello
const guesses = ref<string[]>([]); // i tentativi già inviati, in minuscolo
const evaluations = ref<LetterState[][]>([]); // una riga di colori per tentativo
const currentGuess = ref(""); // la parola che si sta scrivendo ora
// Si parte già in partita: a questa pagina ci si arriva premendo "Play" dalla
// home, quindi la decisione di cominciare è stata presa un istante fa.
const status = ref<GameStatus>("playing");
const nextStep = ref<NextStep>("next-level"); // dove si va dopo la spiegazione
const level = ref(1); // livello attuale, parte da 1
const score = ref(0); // punti accumulati in questa partita
const timeLeft = ref(0); // secondi rimasti sulla parola in corso
const message = ref(""); // messaggio breve ("Not in word list", "+15 seconds!")
const explanationTimeLeft = ref(0); // secondi rimasti per leggere la spiegazione
const vaultExplanationTimeLeft = ref(0); // gemello di explanationTimeLeft, per il Vault

// Stato della classifica (si riempie quando la partita finisce).
const leaderboard = ref<LeaderboardEntry[]>([]); // i punteggi migliori attuali
const qualifies = ref(false); // questa partita è entrata nei primi 10?
const nick = ref(""); // il nome che si sta scrivendo nel modulo
const scoreSubmitted = ref(false); // punteggio di questa partita già salvato?

const wordsSeen = ref<{ word: string; definition: string }[]>([]);

const deathCause = ref<"time" | "attempts" | null>(null);
const runHints = ref<HintSize[]>([]);

const isReview = ref(false);

// Stato del Vault: tier corrente, la sua parola segreta, e i tentativi fatti
// contro quel tier (in coppia, come guesses/evaluations del gioco principale).
const vaultTier = ref(0);
const vaultWord = ref("");
const vaultGuesses = ref<string[]>([]);
const vaultEvaluations = ref<LetterState[][]>([]);
// La parola appena indovinata nel Vault, mentre se ne spiega il significato —
// null quando non c'è nulla da spiegare. Il tier avanza solo quando questa
// torna a null (bottone "Continue" nel pannello), non subito alla vittoria.
const vaultOpened = ref(false);
const vaultWonWord = ref<string | null>(null);
const vaultLostWord = ref<string | null>(null);
const vaultNetScore = ref(0);
const vaultPaidGuesses = ref(0);

// Le parole vinte in partita, usate come tentativi contro il Vault (vedi la
// roadmap). wordsSeen non basta perché contiene anche le parole PERSE, e
// questa deve contenere solo quelle vinte davvero. `wasReview` viaggia con
// la parola (non solo la stringa) perché il Vault deve poter mostrare quali,
// nella lista, erano già state incontrate prima — lo stesso dato che servirà
// al quiz "conosci il significato?" quando lo costruiremo.
const solvedWords = ref<{ word: string; wasReview: boolean }[]>([]);

/**
 * Perché l'ultimo salvataggio è fallito, o stringa vuota se non è fallito.
 *
 * Prima di questo il fallimento finiva solo nella console: il modulo restava
 * immobile e chi giocava non sapeva se il punteggio fosse stato salvato. Il
 * peggior esito possibile per un errore è che nessuno se ne accorga.
 */
const submitError = ref("");

/**
 * Esito dell'ultima condivisione, per dare un riscontro sul pulsante.
 *
 * Serve perché sia copiare negli appunti sia aprire il pannello di condivisione
 * del telefono non lasciano NESSUNA traccia visibile: senza una parola che
 * cambia, chi preme non sa se ha funzionato e preme di nuovo.
 */
const shareState = ref<"idle" | "done" | "failed">("idle");

let messageTimer: ReturnType<typeof setTimeout> | undefined;
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let explanationTimer: ReturnType<typeof setInterval> | undefined;
let vaultExplanationTimer: ReturnType<typeof setInterval> | undefined;

// Quali scoperte hanno già fruttato tempo, così lo stesso verde o giallo non
// può essere sfruttato di nuovo reinviandolo. Si azzerano a ogni nuova parola.
let rewardedGreens = new Set<number>(); // posizioni verdi già premiate
let rewardedYellows = new Set<string>(); // lettere gialle già premiate
/**
 * Gli aiuti comprati su QUESTA parola, ognuno col testo che ha rivelato.
 *
 * Un solo stato e non due (un elenco di comprati + un elenco di testi) perché
 * sarebbero due copie dello stesso fatto, da aggiornare e azzerare in coppia:
 * il giorno che se ne aggiorna una sola, il pulsante risulta spento senza che
 * compaia nulla, e il giocatore ha pagato per il vuoto.
 *
 * Reattivo, a differenza di rewardedGreens qui sopra, perché il pannello degli
 * aiuti lo legge per sapere cosa mostrare e quali pulsanti spegnere.
 */
const boughtHints = ref<{ size: HintSize; text: string }[]>([]);

/**
 * Quante parole sono già state abbandonate in QUESTA partita.
 *
 * Si contano quelli usati e non quelli rimasti perché è il numero che serve a
 * fare il prezzo: costForSkip rincara in base a quanti se ne sono già spesi.
 * Quanti ne restano è una sottrazione, e infatti è una computed.
 *
 * Lo azzera solo newRun: gli skip durano una partita intera, non una parola.
 * Rimetterlo a zero in loadWord ne regalerebbe tre a ogni livello.
 */
const skipsUsed = ref(0);

/**
 * Se la finestra degli aiuti è aperta.
 *
 * Il timer NON si ferma mentre è aperta, a differenza della spiegazione: lì il
 * giocatore ha già finito la parola, qui la sta ancora giocando. Fermarlo
 * regalerebbe tempo di riflessione gratis, e trasformerebbe la finestra in una
 * pausa strategica invece che in una scelta sotto pressione.
 */
const hintPanelOpen = ref(false);

// Se il Vault è aperto. Lista/tastiera libera vivono dentro VaultPanel.vue,
// non qui: sono dettagli di come SI DISEGNA il pannello, non stato di gioco.
const vaultPanelOpen = ref(false);

// La voce scelta per la pronuncia. Non è reattiva: a schermo non ci va mai.
let englishVoice: SpeechSynthesisVoice | undefined;

// === Dati derivati (calcolati dallo stato qui sopra) ===

/**
 * Lo stato migliore conosciuto per ogni lettera già usata, per colorare la
 * tastiera a schermo. Priorità: correct > present > absent — una lettera
 * diventata verde non deve mai retrocedere visivamente a gialla.
 */
const keyStates = computed(() =>
  keyStatesFor(guesses.value, evaluations.value),
);

/** Il nome ripulito del giocatore, per evidenziare la sua riga in classifica. */
const myNick = computed(() => sanitizeNickname(nick.value));

/**
 * La fascia di vocabolario più alta in gioco a questo livello.
 *
 * Si mostra il POOL sbloccato, non il livello CEFR della parola corrente, e la
 * differenza è tutta qui: i barattoli si sommano, quindi al livello 10 può
 * ancora uscire una A2 — un'etichetta che dicesse "A2" dopo aver detto "B2"
 * sembrerebbe una retrocessione. Il pool invece cresce e basta, che è anche la
 * cosa vera da comunicare: non "questa parola è difficile" ma "il gioco ora
 * pesca anche fra le difficili".
 */
const unlockedBand = computed(() => bandForLevel(level.value));

/** timeLeft (es. 187) formattato come minuti:secondi (es. "3:07"). */
const timeDisplay = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

/**
 * La griglia 6 x 5 già pronta da disegnare. Ogni cella sa già la sua lettera e
 * il suo aspetto, così il template si limita a dipingerla senza dover decidere
 * se una riga è inviata, attiva o vuota. Si ricalcola da sola ogni volta che
 * lo stato qui sopra cambia.
 */
const board = computed(() => {
  const rows: { letter: string; state: LetterState | "empty" | "filled" }[][] =
    [];

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const cells: { letter: string; state: LetterState | "empty" | "filled" }[] =
      [];

    // La riga r è già stata inviata? È quella che si sta scrivendo adesso?
    const submitted = r < guesses.value.length;
    const isActiveRow =
      r === guesses.value.length && status.value === "playing";

    for (let c = 0; c < WORD_LENGTH; c++) {
      if (submitted) {
        // Tentativo confermato: si prendono lettera e colore già calcolati.
        cells.push({
          letter: guesses.value[r]![c]!,
          state: evaluations.value[r]![c]!,
        });
      } else if (isActiveRow && c < currentGuess.value.length) {
        // La riga attiva, ma solo fin dove il giocatore ha scritto.
        cells.push({ letter: currentGuess.value[c]!, state: "filled" });
      } else {
        // Tutto il resto è ancora una cella vuota.
        cells.push({ letter: "", state: "empty" });
      }
    }

    rows.push(cells);
  }

  return rows;
});

/**
 * Voce vuota, usata finché quella vera non è arrivata dal server. Il template
 * salta le righe vuote, quindi nel caso pessimo si vede una finestra sobria
 * invece di un errore.
 */
const EMPTY_DEFINITION: WordEntry = {
  pos: "",
  ipa: "",
  cefr: "",
  en: "",
  short: "",
  example: "",
};

/**
 * La voce di dizionario della parola in corso.
 *
 * Era una computed, ed era la scelta giusta finché il dizionario stava in
 * memoria: il testo si ricavava da `answer` all'istante. Ora arriva dalla rete,
 * cioè NON è più ricavabile — è un dato che va atteso e conservato. Quindi
 * torna a essere un ref, aggiornato da fetchDefinition().
 *
 * La regola generale: computed per ciò che si calcola, ref per ciò che arriva.
 */
const currentDefinition = ref<WordEntry>(EMPTY_DEFINITION);

/**
 * Quanto resta del tempo di lettura, in percentuale, per la barra che si
 * svuota. Una barra dice "quanto manca" a colpo d'occhio meglio di un numero
 * che scende, e non costringe a leggere mentre si sta già leggendo altro.
 */
const explanationProgress = computed(
  () => `${(explanationTimeLeft.value / EXPLANATION_TIME) * 100}%`,
);

/** Gemella di explanationProgress, per la barra della spiegazione nel Vault. */
const vaultExplanationProgress = computed(
  () => `${(vaultExplanationTimeLeft.value / EXPLANATION_TIME) * 100}%`,
);

/**
 * Se il pannello degli aiuti va mostrato. Due segnali di difficoltà diversi, e
 * ne basta uno: chi è bloccato dopo tre tentativi ha bisogno di aiuto quanto
 * chi sta per esaurire il tempo.
 *
 * Il controllo sulla fase non è pignoleria: senza, il pannello resterebbe
 * visibile sopra il Game Over (dove il tempo è a zero, quindi la seconda
 * condizione è vera) e accanto alla spiegazione dopo una parola risolta al
 * quinto tentativo — lasciando comprare un aiuto per una parola che il
 * giocatore non sta più giocando.
 */
/** Come si chiamano i tre aiuti a schermo. */
const HINT_LABELS: Record<HintSize, string> = {
  small: "Letter",
  medium: "Sentence",
  large: "Definition",
};

/**
 * I tre aiuti già pronti da disegnare: etichetta, prezzo al livello corrente,
 * se è già stato comprato e se il giocatore se lo può permettere.
 *
 * Come `board`, il template si limita a dipingere: qui c'è tutto ciò che serve
 * per decidere quali pulsanti spegnere, così l'HTML non deve fare conti.
 */
const hintOptions = computed(() =>
  (["small", "medium", "large"] as const).map((size) => {
    const cost = costForHint(size, level.value);
    return {
      size,
      cost,
      label: HINT_LABELS[size],
      bought: boughtHints.value.some((hint) => hint.size === size),
      affordable: score.value >= cost,
    };
  }),
);

/**
 * Gli aiuti già comprati, con l'etichetta già risolta: HintPanel.vue disegna
 * solo, non deve conoscere HINT_LABELS per tradurre `size` in un nome
 * leggibile.
 */
const boughtHintsView = computed(() =>
  boughtHints.value.map((hint) => ({
    ...hint,
    label: HINT_LABELS[hint.size],
  })),
);

// Prezzo del PROSSIMO tentativo libero: cresce con quante posizioni sono
// già confermate in questo tier (poco sai, poco rischi; molto sai, quasi
// compri la vittoria — deve costare quanto vale).
const vaultGuessCost = computed(() => {
  const confirmed = evaluationsCountPosition(vaultEvaluations.value);
  const cost = costForVaultGuess(vaultTierLevel(vaultTier.value), confirmed);
  return { cost, affordable: score.value >= cost };
});

/**
 * Se c'è almeno un aiuto che il giocatore può davvero comprare adesso: non
 * ancora preso, e alla sua portata. Serve ad accendere la lampadina.
 *
 * Non basta "ho abbastanza punti": avendo già comprato tutti e tre gli aiuti,
 * i punti non servono a nulla e la lampadina deve restare spenta.
 */
const canBuyAnyHint = computed(() =>
  hintOptions.value.some((option) => !option.bought && option.affordable),
);

/**
 * Se c'è almeno una parola risolta da provare contro il Vault — stesso
 * ruolo di canBuyAnyHint, per accendere l'icona del Vault invece che
 * quella degli aiuti.
 */
const vaultHasAttempt = computed(() => solvedWords.value.length > 0);

const hintAvailable = computed(
  () =>
    status.value === "playing" &&
    (guesses.value.length >= HINT_MIN_GUESSES ||
      timeLeft.value <= HINT_LOW_TIME),
);

/** Quanti skip restano da spendere: va a schermo sotto il pulsante. */
const skipsLeft = computed(() => MAX_SKIPS - skipsUsed.value);

/**
 * Quanto costa lo skip in questo momento. Dipende dal livello e da quanti se
 * ne sono già usati, quindi cambia due volte: salendo di livello e appena se
 * ne compra uno. Da qui la regola d'ordine dentro skipWord.
 */
const skipCost = computed(() => costForSkip(level.value, skipsUsed.value));

/**
 * Se il giocatore può abbandonare la parola adesso. Tre condizioni, e servono
 * tutte: la finestra è sbloccata, gliene resta almeno uno, e ha i punti per
 * pagarlo.
 *
 * La prima riusa hintAvailable invece di riscriverne la condizione: skip e
 * aiuti passano dalla stessa porta, ed è voluto — potendo skippare al primo
 * tentativo, il gioco diventerebbe una caccia alla parola che piace.
 */
const canSkip = computed(
  () =>
    hintAvailable.value && skipsLeft.value > 0 && score.value >= skipCost.value,
);

// === Azioni: le funzioni che modificano lo stato ===

/** Aggiunge una lettera alla riga attiva, se c'è spazio e la partita è in corso. */
function addLetter(letter: string) {
  if (status.value !== "playing") return;
  if (currentGuess.value.length >= WORD_LENGTH) return;
  currentGuess.value += letter;
}

/** Cancella l'ultima lettera della riga attiva. */
function removeLetter() {
  if (status.value !== "playing") return;
  currentGuess.value = currentGuess.value.slice(0, -1);
}

/**
 * Il testo di un aiuto, oppure `undefined` se non c'è nulla da dare.
 *
 * Lo `switch` su HintSize non è una scelta stilistica: essendo un tipo a tre
 * valori, TypeScript sa che i casi sono esattamente tre e segnala se ne
 * aggiungiamo un quarto senza gestirlo qui. Con un `string` non potrebbe.
 */
function buildHintText(size: HintSize): string | undefined {
  const definition = currentDefinition.value;

  switch (size) {
    case "small": {
      const letter = pickUntriedLetter(answer.value, guesses.value);
      return letter
        ? `The word contains the letter “${letter.toUpperCase()}”.`
        : undefined;
    }
    case "medium":
      // La definizione arriva dal server: se non è ancora arrivata (o la parola
      // non ne ha una) i campi sono vuoti, e non c'è niente da vendere.
      return definition.example
        ? maskWordInExample(definition.example, answer.value)
        : undefined;
    case "large":
      return definition.en || undefined;
  }
}

/**
 * Compra un aiuto: scala i punti e ne registra il testo.
 *
 * L'ordine dei controlli è la parte importante. Il testo viene costruito PRIMA
 * di toccare il punteggio, così se non c'è nulla da rivelare — succede quando
 * il giocatore ha già provato tutte le lettere della parola — la funzione esce
 * senza far pagare. Scalando i punti per primi, avrebbe pagato per il vuoto.
 *
 * I tre controlli iniziali duplicano quello che l'interfaccia già impedisce
 * (pulsanti spenti). È voluto: l'interfaccia è una comodità per chi gioca, non
 * una garanzia — e queste sono le regole.
 */
function buyHint(size: HintSize) {
  if (!hintAvailable.value) return;
  if (boughtHints.value.some((hint) => hint.size === size)) return;

  const cost = costForHint(size, level.value);
  if (score.value < cost) return;

  const text = buildHintText(size);
  if (!text) return;

  score.value -= cost;
  boughtHints.value.push({ size, text });
  runHints.value.push(size);
}

/**
 * Abbandona la parola in corso: la paga in punti e passa alla successiva
 * restando sullo stesso livello.
 *
 * L'ordine delle due righe centrali è una regola, non un gusto: skipCost è
 * calcolato SU skipsUsed, quindi incrementando prima di pagare il prezzo
 * raddoppierebbe fra una riga e l'altra e il giocatore si vedrebbe addebitare
 * lo skip successivo invece di questo.
 *
 * Non ferma il timer e non cambia livello: al resto pensa startExplanation,
 * che spegne l'orologio e mostra la parola perduta. Il ritorno è affidato a
 * "same-level", l'unica destinazione che ricarica la parola senza far salire
 * di livello né regalare i secondi di uno nuovo.
 *
 * La guardia iniziale ripete quello che l'interfaccia già impedisce, come in
 * buyHint: i pulsanti spenti sono una cortesia, la regola sta qui.
 */
function skipWord() {
  if (!canSkip.value) return;
  score.value -= skipCost.value;

  // Il pavimento al tempo: senza, lo skip era utile solo quando non serviva.
  // Con l'orologio quasi a zero — cioè quando il pulsante grida "premimi", e il
  // gioco si perde per tempo, non per tentativi — si cambiava parola e si
  // moriva lo stesso, con meno punti di prima. Non una scelta, una trappola.
  //
  // È un MINIMO, non un regalo: assegna invece di sommare, così chi skippa a 2
  // secondi e chi skippa a 40 riparte dallo stesso numero, e sopra la soglia non
  // succede niente. Tempo pieno lo romperebbe: al livello 3 un livello vale
  // ~253s e lo skip ne costa 30 di punti, mezza parola risolta, quindi si
  // comprerebbe sempre.
  //
  // La soglia è HINT_LOW_TIME e non un 45 scritto qui: è già il punto in cui il
  // gioco decide che sei in difficoltà e ti offre gli aiuti. Una definizione
  // sola di "emergenza", non due che possono divergere.
  //
  // Bastano per una parola perché i tentativi restituiscono tempo (+10 per
  // verde nuovo, +5 per giallo): due tentativi che rivelano qualcosa e sei di
  // nuovo sopra la soglia. Chi non ha idea della parola muore comunque, ed è
  // giusto — altrimenti sarebbe una resurrezione invece di un respiro.
  if (timeLeft.value < HINT_LOW_TIME) {
    timeLeft.value = HINT_LOW_TIME;
  }

  skipsUsed.value++;
  startExplanation("same-level");
}

/**
 * Mette il risultato della partita a disposizione del giocatore, per incollarlo
 * dove vuole.
 *
 * Due strade, e si sceglie in base a cosa il dispositivo sa fare. Sul telefono
 * `navigator.share` apre il pannello di sistema — WhatsApp, messaggi, quello che
 * c'è — ed è di gran lunga la strada migliore: un tocco e il messaggio è
 * partito. Sul computer quel pannello quasi mai esiste, e si ripiega sul
 * copiare negli appunti.
 *
 * Il ripiego non è un dettaglio: `navigator.share` esiste solo su una parte dei
 * browser, e `navigator.clipboard` richiede una connessione sicura (https o
 * localhost). Fuori da quei casi non resta niente da fare se non dirlo.
 *
 * L'annullamento non è un errore: se il giocatore apre il pannello di
 * condivisione e poi cambia idea, il browser segnala comunque un rifiuto. Per
 * questo si distingue `AbortError`, che significa "ci ho ripensato" e non
 * "non ha funzionato".
 */
async function shareResult() {
  try {
    if (navigator.share) {
      // Il pannello di sistema ha un campo suo per il collegamento, e chi
      // riceve lo tratta meglio: alcune applicazioni ne mostrano l'anteprima.
      // Per questo il testo qui NON lo contiene, o comparirebbe due volte.
      await navigator.share({
        text: shareBody(level.value, score.value),
        url: SHARE_URL,
      });
    } else {
      // Negli appunti finisce tutto insieme: lì un campo a parte non esiste.
      await navigator.clipboard.writeText(shareText(level.value, score.value));
    }
    shareState.value = "done";
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return; // ha chiuso il pannello
    console.error("Could not share:", e);
    shareState.value = "failed";
  }

  // L'esito torna neutro da solo: un "Copied!" che resta lì per sempre diventa
  // l'etichetta del pulsante e smette di essere un riscontro.
  setTimeout(() => {
    shareState.value = "idle";
  }, 2500);
}

/** Mostra un messaggio breve che si cancella da solo dopo un attimo. */
function flashMessage(text: string) {
  message.value = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    message.value = "";
  }, 1600);
}

/** Ferma il conto alla rovescia (se ne sta girando uno). */
function stopTimer() {
  clearInterval(countdownTimer);
  countdownTimer = undefined;
}

/**
 * Annulla la sveglia della spiegazione presso il browser. Un setInterval non si
 * ferma mai da solo: senza questa, il contatore andrebbe sotto zero e
 * finishExplanation verrebbe richiamata ogni secondo, all'infinito.
 */
function stopExplanationTimer() {
  clearInterval(explanationTimer);
  explanationTimer = undefined;
}

/** Gemella di stopExplanationTimer, per la spiegazione del Vault. */
function stopVaultExplanationTimer() {
  clearInterval(vaultExplanationTimer);
  vaultExplanationTimer = undefined;
}

/**
 * Mette il gioco in pausa e mostra la spiegazione della parola appena conclusa.
 *
 * `step` è il biglietto con la destinazione: chi chiama sa se si è vinto il
 * livello o persa la partita, e lo comunica qui. La funzione se lo appunta in
 * `nextStep` e lo rilegge finishExplanation quando i secondi sono finiti.
 *
 * Spegnere il timer di gioco è la PRIMA cosa: altrimenti continua a scalare
 * secondi mentre il giocatore legge, e può chiudere la partita a metà lettura.
 */
function startExplanation(step: NextStep) {
  stopTimer();
  nextStep.value = step;
  status.value = "explaining";
  explanationTimeLeft.value = EXPLANATION_TIME;
  explanationTimer = setInterval(() => {
    explanationTimeLeft.value--;
    if (explanationTimeLeft.value <= 0) {
      finishExplanation();
    }
  }, 1000);
}

/**
 * Chiude la spiegazione e va dove diceva il biglietto. Chiamata sia allo
 * scadere dei secondi sia dal pulsante "Continua", quindi deve stare fuori
 * dalla callback del setInterval: codice sepolto lì dentro non è richiamabile
 * da nessun altro.
 */
function finishExplanation() {
  stopExplanationTimer();
  if (nextStep.value === "next-level") {
    nextLevel();
  } else if (nextStep.value === "same-level") {
    loadWord();
  } else {
    endRun();
  }
}

/**
 * Sceglie la voce con cui pronunciare le parole, in ordine di preferenza.
 *
 * Va richiamata più volte, e non è uno spreco: getVoices() è ASINCRONA nei
 * fatti. Il browser costruisce la lista interrogando il sistema operativo, e
 * alla prima chiamata spesso risponde con un array vuoto. Per questo la
 * ripetiamo all'evento "voiceschanged", che scatta quando la lista è pronta.
 */
function pickEnglishVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return; // lista non ancora pronta: riproveremo

  for (const name of PREFERRED_VOICES) {
    const match = voices.find((voice) => voice.name === name);
    if (match) {
      englishVoice = match;
      return;
    }
  }

  // Nessuna delle preferite: meglio una voce inglese qualsiasi che il silenzio.
  englishVoice = voices.find((voice) => voice.lang.startsWith("en"));
}

/**
 * Fa pronunciare la parola alla voce di sistema. Niente rete e niente file
 * audio: il sintetizzatore è già nel browser.
 *
 * La lingua va imposta a mano, altrimenti il sistema userebbe la propria (su un
 * Mac italiano leggerebbe "aisle" all'italiana, cioè proprio l'errore che
 * vogliamo evitare). Ma `lang` è solo una richiesta: la voce va scelta
 * esplicitamente, o il browser può pescare uno degli effetti sonori scherzo di
 * macOS, che sono anch'essi marcati "en-US". Se la lista non è ancora pronta si
 * lascia decidere lui: meglio una voce buffa che nessun suono.
 *
 * cancel() prima di speak() perché speechSynthesis è una CODA: premendo il
 * pulsante cinque volte, senza svuotarla, direbbe la parola cinque volte di
 * fila.
 */
function speakWord() {
  const utterance = new SpeechSynthesisUtterance(answer.value);
  utterance.lang = "en-US";
  if (englishVoice) utterance.voice = englishVoice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function reportRun() {
  $fetch("/api/telemetry", {
    method: "POST",
    body: {
      level: level.value,
      score: score.value,
      cause: deathCause.value,
      skips: skipsUsed.value,
      hints: runHints.value,
      vaultTier: vaultTier.value,
      vaultOpened: vaultOpened.value,
      vaultNetScore: vaultNetScore.value,
      vaultPaidGuesses: vaultPaidGuesses.value,
    },
  }).catch((e) => console.error("Could not report run:", e));
}

/**
 * Chiude la partita: ferma l'orologio, mostra Game Over, aggiorna i record
 * personali e controlla la classifica.
 *
 * È l'unico imbuto attraverso cui una partita finisce — ci passano sia il tempo
 * scaduto sia i sei tentativi esauriti — quindi una chiamata sola qui copre
 * tutti i modi di perdere.
 *
 * A saveRun servono le sole parole, mentre wordsSeen contiene anche le
 * definizioni: `.map` costruisce un elenco nuovo tenendo di ogni voce il solo
 * campo che serve.
 */
function endRun() {
  stopTimer();
  status.value = "lost";
  saveRun(
    score.value,
    level.value,
    wordsSeen.value.map((seen) => seen.word),
  );
  reportRun();
  finishRun();
}

/**
 * Scarica i punteggi migliori del mese. Serve in due momenti: quando la partita
 * finisce, per sapere se questo punteggio entra, e subito dopo aver salvato un
 * nome, per rivedere la lista aggiornata.
 *
 * Restituisce se ha funzionato, e questo è il punto: una classifica VUOTA e una
 * NON CARICATA a schermo si assomigliano ma vogliono risposte opposte (vedi
 * finishRun). Senza il valore di ritorno, chi chiama non può distinguerle.
 *
 * Non solleva errori: una classifica mancante non deve fermare una partita.
 */
async function loadLeaderboard(): Promise<boolean> {
  try {
    leaderboard.value = await $fetch<LeaderboardEntry[]>("/api/leaderboard");
    return true;
  } catch (e) {
    console.error("Could not load leaderboard:", e);
    leaderboard.value = [];
    return false;
  }
}

/**
 * A partita finita: scarica i punteggi migliori e decide se questo punteggio si
 * merita un posto (classifica non ancora piena, oppure batte l'ultimo dei
 * primi). Un punteggio di zero non entra mai.
 *
 * La distinzione che conta: una classifica VUOTA (primo del mese, nessuno ha
 * ancora giocato) fa entrare chiunque abbia fatto punti; una classifica NON
 * CARICATA non permette di dire niente, quindi non si promette al giocatore un
 * posto che potrebbe non esserci. Confondendole, il primo del mese nessuno
 * entrerebbe più in classifica.
 */
async function finishRun() {
  if (!(await loadLeaderboard())) {
    qualifies.value = false;
    return;
  }

  const lowest = leaderboard.value[leaderboard.value.length - 1];
  qualifies.value =
    score.value > 0 &&
    (leaderboard.value.length < LEADERBOARD_SIZE ||
      score.value > (lowest?.score ?? 0));
}

/** Salva il nome scritto col punteggio della partita, poi ricarica la classifica. */
async function submitScore() {
  if (!isValidNickname(nick.value)) return;
  submitError.value = ""; // un nuovo tentativo cancella l'esito del precedente
  try {
    await $fetch("/api/leaderboard", {
      method: "POST",
      body: { nick: sanitizeNickname(nick.value), score: score.value },
    });
    scoreSubmitted.value = true;
    qualifies.value = false; // nasconde il modulo del nome
    await loadLeaderboard(); // per rivedere la lista col proprio nome dentro
  } catch (e) {
    console.error("Could not submit score:", e);

    // Il 429 merita un testo suo: è l'unico rifiuto che non si risolve
    // riprovando subito, e senza spiegarlo il giocatore ritenta all'infinito.
    // Non nomina il limite né il fatto che si conta per indirizzo: a chi ha
    // giocato onestamente non serve, e a chi sta provando a barare direbbe
    // esattamente quanto può osare.
    const status = (e as { statusCode?: number })?.statusCode;
    submitError.value =
      status === 429
        ? "Too many scores sent from here. Try again later."
        : "Could not save your score. Check your connection and try again.";
  }
}

/**
 * Fa scorrere l'orologio: un secondo in meno al secondo, e alla fine del tempo
 * la partita si chiude passando dalla spiegazione della parola.
 *
 * NON assegna tempo: quello lo fa grantLevelTime, ed è una funzione separata
 * apposta. Finché le due cose stavano insieme era impossibile rimettere in moto
 * l'orologio senza regalare anche i secondi di un livello — cioè esattamente
 * ciò che serve dopo uno skip, dove la parola cambia ma il livello no.
 */
function startCountdown() {
  stopTimer(); // mai due conti alla rovescia in funzione insieme
  countdownTimer = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      vaultPanelOpen.value = false;
      deathCause.value = "time";
      startExplanation("game-over");
    }
  }, 1000);
}

/** Valida e invia la riga attiva come tentativo. */
function submitGuess() {
  if (status.value !== "playing") return;

  // Due motivi per cui un tentativo può essere rifiutato, con messaggi diversi.
  if (currentGuess.value.length < WORD_LENGTH) {
    flashMessage("Not enough letters");
    return;
  }
  if (!isValidWord(currentGuess.value)) {
    flashMessage("Not in word list");
    return;
  }

  // Accettato: lo si valuta e si registrano sia la parola sia i suoi colori.
  const guess = currentGuess.value;
  const states = evaluateGuess(guess, answer.value);
  guesses.value.push(guess);
  evaluations.value.push(states);
  currentGuess.value = "";

  // Il tempo si guadagna solo per scoperte NUOVE, così non si può sfruttare
  // la stessa lettera più volte per accumulare secondi.
  let bonus = 0;
  for (let i = 0; i < states.length; i++) {
    const letter = guess[i]!;
    if (states[i] === "correct" && !rewardedGreens.has(i)) {
      rewardedGreens.add(i);
      bonus += TIME_BONUS_CORRECT;
    } else if (states[i] === "present" && !rewardedYellows.has(letter)) {
      rewardedYellows.add(letter);
      bonus += TIME_BONUS_PRESENT;
    }
  }
  if (bonus > 0) {
    timeLeft.value += bonus;
    flashMessage(`+${bonus} seconds!`);
  } else if (guess !== answer.value) {
    timeLeft.value = Math.max(0, timeLeft.value - TIME_PENALTY);
    flashMessage(`-${TIME_PENALTY} seconds!`);
  }

  // Fine del turno, in un modo o nell'altro: si passa la mano alla spiegazione,
  // che dopo i suoi secondi porterà al livello nuovo o al Game Over. I punti si
  // incassano SUBITO, prima che la griglia venga azzerata: wordScore() conta i
  // tentativi usati, e fra venti secondi quel dato non ci sarà più.
  if (guess === answer.value) {
    solvedWords.value.push({ word: answer.value, wasReview: isReview.value });
    score.value += wordScore();
    startExplanation("next-level");
  } else if (guesses.value.length >= MAX_ATTEMPTS || timeLeft.value <= 0) {
    deathCause.value = timeLeft.value <= 0 ? "time" : "attempts";
    startExplanation("game-over");
  }
}

/**
 * Chiede al server la voce di dizionario di `word` e la mette da parte.
 *
 * Viene lanciata all'INIZIO del livello, non quando serve mostrarla: così la
 * mezza attesa della rete cade mentre il giocatore sta indovinando, e quando la
 * finestra si apre il testo è già lì da un pezzo. L'attesa esiste ancora, ma in
 * un momento in cui nessuno la guarda.
 *
 * Non si aspetta il risultato (nessun await da chi la chiama): il gioco deve
 * partire subito, la definizione arriverà quando arriva.
 */
async function fetchDefinition(word: string) {
  currentDefinition.value = EMPTY_DEFINITION;
  try {
    const definition = await $fetch<WordEntry>("/api/definition", {
      query: { word },
    });
    // La parola potrebbe essere già cambiata (partita nuova, livello saltato):
    // in tal caso questa risposta è vecchia e va buttata, o mostreremmo la
    // spiegazione di una parola che il giocatore non sta più giocando.
    if (answer.value === word) {
      currentDefinition.value = definition;
      wordsSeen.value.push({ word, definition: definition.en });
    }
  } catch (e) {
    // Rete assente o server giù: si resta sulla voce vuota. Una spiegazione
    // mancante è un difetto estetico, non deve fermare la partita.
    console.error("Could not load definition:", e);
  }
}

/** Carica una parola nuova e pulisce la griglia per il turno successivo. */
function loadWord() {
  // Le parole candidate a tornare: le ultime salvate nel browser, meno quelle
  // già uscite in QUESTA partita. Rivedere una parola dieci minuti dopo non è
  // ripasso, è un livello regalato.
  const queue = loadReviewQueue();
  const thisRun = wordsSeen.value.map((seen) => seen.word);
  const forReview = queue.filter((word) => !thisRun.includes(word));

  answer.value = pickRandomAnswer(level.value, forReview);
  isReview.value = forReview.includes(answer.value);
  fetchDefinition(answer.value); // parte adesso, arriverà molto prima che serva
  guesses.value = [];
  evaluations.value = [];
  currentGuess.value = "";
  status.value = "playing";
  rewardedGreens = new Set(); // parola nuova → nessun premio ancora dato
  rewardedYellows = new Set();
  boughtHints.value = [];
  hintPanelOpen.value = false;
  startCountdown(); // l'orologio riparte, ma col tempo che c'era già
}

/**
 * Accredita i secondi che spettano a questo livello.
 *
 * Si SOMMA a quelli rimasti invece di sostituirli, ed è la regola che rende
 * Wordpace una corsa unica e non sei partite separate: i secondi risparmiati
 * restano tuoi e ti terranno in vita più avanti, quando un livello ne regala
 * quaranta. Con un `=` al posto del `+` ogni livello ripartirebbe da capo e
 * andare veloci non varrebbe nulla.
 *
 * Math.min mette il tetto: chi vola nei primi livelli, che sono facili e
 * generosi, si ritroverebbe altrimenti con un vantaggio tale da non guardare
 * più l'orologio per il resto della partita.
 *
 * La chiamano newRun e nextLevel, cioè i due soli punti in cui un livello
 * comincia davvero. Lo skip no: cambia la parola, non il livello.
 */
function grantLevelTime() {
  timeLeft.value = Math.min(
    timeLeft.value + timeForLevel(level.value),
    MAX_TIME,
  );
}

/** Avvia una partita nuova dal livello 1 con punteggio azzerato. */
function newRun() {
  level.value = 1;
  score.value = 0;
  timeLeft.value = 0;
  qualifies.value = false;
  scoreSubmitted.value = false;
  nick.value = "";
  skipsUsed.value = 0;
  wordsSeen.value = [];
  runHints.value = [];
  solvedWords.value = [];
  deathCause.value = null;
  vaultWord.value = vaultWordForTier(0);
  vaultTier.value = 0;
  vaultGuesses.value = [];
  vaultEvaluations.value = [];
  vaultWonWord.value = null;
  vaultLostWord.value = null;
  stopVaultExplanationTimer();
  vaultOpened.value = false;
  vaultNetScore.value = 0;
  vaultPaidGuesses.value = 0;
  grantLevelTime();
  loadWord();
}

/** Passaggio al tier successivo del Vault (il punteggio è già incassato). */
function advanceVaultTier() {
  if (vaultTier.value >= 3) return;
  vaultTier.value++;
  vaultWord.value = vaultWordForTier(vaultTier.value);
  vaultGuesses.value = [];
  vaultEvaluations.value = [];
}

/** Chiude la spiegazione della vittoria e passa al tier successivo. */
function continueVaultTier() {
  vaultWonWord.value = null;
  advanceVaultTier();
}

/**
 * Avvia il conto alla rovescia della spiegazione del Vault (vittoria o
 * sconfitta) — gemella di startExplanation, stessi EXPLANATION_TIME secondi
 * e la stessa doppia porta d'ingresso: allo scadere del tempo o al pulsante
 * "Continue" dentro il pannello, finisce sempre in finishVaultExplanation.
 */
function startVaultExplanation() {
  vaultExplanationTimeLeft.value = EXPLANATION_TIME;
  vaultExplanationTimer = setInterval(() => {
    vaultExplanationTimeLeft.value--;
    if (vaultExplanationTimeLeft.value <= 0) {
      finishVaultExplanation();
    }
  }, 1000);
}

/**
 * Chiude la spiegazione del Vault e prosegue di conseguenza: solo uno fra
 * vaultWonWord e vaultLostWord può essere pieno alla volta, quindi basta
 * controllare quale dei due lo sia per sapere se il tier avanza o riparte.
 */
function finishVaultExplanation() {
  stopVaultExplanationTimer();
  if (vaultWonWord.value) {
    continueVaultTier();
  } else if (vaultLostWord.value) {
    retryVaultTier();
  }
}

/**
 * Registra un tentativo contro il Vault e lo toglie dalle parole ancora
 * disponibili. Il tentativo libero non è mai bloccato in modo permanente:
 * costa punti solo se sbagliato, e il prezzo cresce con quante posizioni
 * sono già confermate — poco sai, poco rischi; molto sai, quasi compri la
 * vittoria. Il costo si legge PRIMA di registrare questo tentativo, così
 * riflette solo quello che sapevi già, non l'informazione appena arrivata.
 */
function submitVaultGuess(word: string, isFreeGuess: boolean) {
  const cost = vaultGuessCost.value.cost;
  if (isFreeGuess && score.value < cost) return;

  const colors = evaluateGuess(word, vaultWord.value);
  vaultGuesses.value.push(word);
  vaultEvaluations.value.push(colors);
  solvedWords.value = solvedWords.value.filter(
    (solved) => solved.word !== word,
  );
  if (word === vaultWord.value) {
    if (isFreeGuess) {
      vaultPaidGuesses.value++;
    }
    // Incassati subito, come wordScore() nel gioco principale: prima della
    // spiegazione, non dopo, altrimenti il punteggio in HUD resterebbe
    // fermo mentre leggi come se non avessi appena vinto nulla.
    score.value += 70 * vaultTierLevel(vaultTier.value);
    vaultNetScore.value += 70 * vaultTierLevel(vaultTier.value);
    vaultWonWord.value = word;
    startVaultExplanation();
  } else if (isFreeGuess) {
    score.value -= cost;
    vaultNetScore.value -= cost;
    vaultPaidGuesses.value++;
  }
  if (word !== vaultWord.value && vaultGuesses.value.length >= MAX_ATTEMPTS) {
    vaultLostWord.value = vaultWord.value;
    startVaultExplanation();
  }
}

function retryVaultTier() {
  vaultWord.value = vaultWordForTier(vaultTier.value);
  vaultLostWord.value = null;
  vaultGuesses.value = [];
  vaultEvaluations.value = [];
}

watch(vaultPanelOpen, (open) => {
  if (open) {
    vaultOpened.value = true;
  }
});

/** Parola indovinata: si sale di un livello e si carica la parola successiva. */
function nextLevel() {
  level.value++;
  flashMessage(`Level ${level.value}!`);
  grantLevelTime();
  loadWord();
}

/** Punti per la parola risolta: più tentativi risparmiati e livello più alto
 *  valgono di più. */
function wordScore(): number {
  const unused = MAX_ATTEMPTS - guesses.value.length;
  return (10 + unused * 5) * level.value;
}

/**
 * Punto d'ingresso unico per qualsiasi tasto, da entrambe le tastiere. Il tasto
 * è uno fra: "enter", "back", oppure una singola lettera a–z.
 */
function handleKey(key: string) {
  if (key === "enter") {
    submitGuess();
  } else if (key === "back") {
    removeLetter();
  } else if (/^[a-z]$/.test(key)) {
    addLetter(key);
  }
}

/** Traduce la pressione di un tasto fisico nei nostri nomi, poi la smista. */
function onPhysicalKey(event: KeyboardEvent) {
  // Ignora le scorciatoie (Cmd/Ctrl/Alt) per non rubare copia, ricarica…
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  // Con la finestra degli aiuti aperta la tastiera serve solo a chiuderla:
  // altrimenti si continuerebbe a scrivere su una griglia che non si vede.
  // Un controllo qui invece che in addLetter, removeLetter e submitGuess:
  // un punto solo da ricordare.
  if (hintPanelOpen.value) {
    if (event.key === "Escape") hintPanelOpen.value = false;
    return;
  }

  // Stessa ragione degli aiuti: con il Vault aperto la tastiera del gioco
  // principale non deve intercettare nulla. Quando si scrive il tentativo
  // libero, a battere i tasti ci pensa il campo di testo nativo, non questa
  // funzione.
  if (vaultPanelOpen.value) {
    if (event.key === "Escape") vaultPanelOpen.value = false;
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

// Blocca lo scorrimento della pagina ogni volta che c'è una finestra sopra il
// gioco (spiegazione o Game Over, o gli aiuti), e lo ripristina appena si
// torna a giocare. Il Vault NON entra in questa condizione: a differenza
// delle altre, non galleggia sopra una schermata ancora visibile sotto — la
// sostituisce — quindi bloccare lo scorrimento qui impedirebbe solo al
// contenuto del Vault di scorrere, se supera l'altezza o la larghezza dello
// schermo.
watch([status, hintPanelOpen], ([current, hintsOpen]) => {
  const covered = current !== "playing" || hintsOpen;
  document.body.style.overflow = covered ? "hidden" : "";
});

// Il tempo scorre anche dentro il Vault, come per gli aiuti: aprirlo non è
// più una pausa gratuita. Si ferma solo mentre leggi una spiegazione —
// vittoria o sconfitta, vaultWonWord o vaultLostWord pieno — esattamente
// come tra un livello e l'altro nel gioco principale, non mentre stai ancora
// indovinando.
watch([vaultWonWord, vaultLostWord], ([won, lost]) => {
  if (won || lost) {
    stopTimer();
  } else if (status.value === "playing") {
    startCountdown();
  }
});

// Quando il componente compare a schermo: avvia la partita e si mette in
// ascolto della tastiera. Quando sparisce, smette di ascoltare (pulizia).
onMounted(() => {
  newRun();
  window.addEventListener("keydown", onPhysicalKey);

  // Si prova subito (a volte la lista c'è già) e ci si iscrive all'evento per
  // quando arriva davvero.
  pickEnglishVoice();
  speechSynthesis.addEventListener("voiceschanged", pickEnglishVoice);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onPhysicalKey);
  speechSynthesis.removeEventListener("voiceschanged", pickEnglishVoice);
  stopTimer();
  stopExplanationTimer();
  stopVaultExplanationTimer();
  document.body.style.overflow = ""; // mai lasciare la pagina bloccata
});
</script>

<style scoped>
.wordle {
  /* Tutti i colori in un posto solo: cambiandone uno qui, cambia ovunque. */


  /* I tre colori storici di Wordle. Il verde è appena più scuro
     dell'originale (#6aaa64 → #5f9e58): a occhio è lo stesso colore, ma il
     testo bianco sopra passa da 2,8:1 a 3,3:1, cioè da illeggibile a
     conforme. Il giallo è sceso da #c9b458 a #ab8f3a per la stessa ragione:
     2,3:1 → 3,1:1. Non è un valore scelto a occhio, è il minimo che supera la
     soglia — qualunque tonalità più chiara non ci arriva, e avremmo cambiato
     colore senza guadagnarci niente. */

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  width: 100%;
  max-width: 30rem; /* mai più larga di così sugli schermi grandi */
  color: var(--color-text);

  /* Toglie lo zoom da doppio tocco dentro l'area di gioco. Qui il doppio tocco
     capita per forza — si scrive una parola in cinque battute veloci sulla
     tastiera a schermo — e ogni volta la pagina saltava dentro.
     `manipulation` disattiva solo quel gesto: il pinch per ingrandire resta,
     e resta apposta. La strada facile sarebbe `user-scalable=no` nel meta
     viewport, ma quella toglie l'ingrandimento a tutta la pagina e a chiunque
     ne abbia bisogno per leggere — si risolve il fastidio di qualcuno
     rendendo il gioco inservibile per qualcun altro. */
  touch-action: manipulation;
  font-family:
    "Helvetica Neue",
    -apple-system,
    Helvetica,
    Arial,
    sans-serif;
}

/* Due colonne appaiate: a sinistra le informazioni sulla parola, a destra le
   azioni. Altezza minima riservata per due righe, come i badge qui sotto —
   stesso motivo: comparendo (un badge, il bottone Hint), non deve spostare
   la griglia. */
/* Stessa griglia a tre colonne dell'HUD qui sopra (repeat(3, 1fr)): è quello
   che allinea davvero "Seen before" sotto "Time", non un centraggio a
   occhio che si sposta a seconda di quanto testo c'è a destra e sinistra. */
.wordle__side-by-side {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 4.4rem;
  /* Si appoggia all'HUD invece di stare a mezz'aria fra HUD e griglia: parlano
     della stessa cosa — a che punto è la partita — e due blocchi imparentati
     vicini si leggono come uno. */
  margin-top: -0.6rem;
}

.wordle__side-by-side > .wordle__badge.wordle__badge--review {
  justify-self: center;
}

.wordle__side-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* `stretch` (invece di `flex-end`) fa sì che entrambi i bottoni prendano la
   larghezza del più largo dei due, invece di restare ognuno alla misura del
   proprio testo — così Vault e Hint restano allineati sullo stesso bordo. */
.wordle__side-col--right {
  /* `align-items: stretch` fa combaciare Vault e Hint alla stessa larghezza
     (quella del più largo dei due). `justify-self: end` invece riguarda
     questa colonna nella griglia: senza, si allargherebbe fino a riempire
     l'intero terzo spazio (quello di "Score" nell'HUD) invece di restringersi
     al contenuto e restare a ridosso del bordo destro.
     `grid-column: 3` è esplicito e non lasciato all'ordine degli elementi:
     senza, quando "Seen before" non c'è, questo blocco scivolerebbe nella
     colonna 2 (la griglia riempie le colonne in sequenza, non per posizione
     voluta) e sembrerebbe spostato verso il centro. */
  align-items: stretch;
  justify-self: end;
  grid-column: 3;
}

/* .wordle__hint-open è pensato per la vecchia riga di stato, dove stava
   fermo con `position: absolute; right: 0`. Qui i bottoni sono impilati nella
   loro colonna: vanno rimessi nel flusso normale, altrimenti l'assoluto li
   stacca da qui e li manda ad ancorarsi al primo antenato posizionato che
   trovano, sovrapponendosi. */
.wordle__side-col .wordle__hint-open {
  position: static;
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

/* Le icone disegnate nella pagina. `currentColor` fa sì che prendano il colore
   del testo del pulsante che le contiene: si spengono quando lui si spegne,
   si scuriscono quando lui si scurisce. Un'emoji resterebbe accesa. */
.wordle__icon {
  width: 1.05em;
  height: 1.05em;
  flex-shrink: 0; /* non si schiaccia se lo spazio è poco */
}

.wordle__hint-open {
  position: absolute;
  right: 0;
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
  animation: wordle-hints-in 0.2s ease;
}

.wordle__hint-open:hover {
  filter: brightness(0.94);
}

/* Lampadina accesa = c'è almeno un aiuto comprabile adesso. È l'unica
   informazione che il giocatore non potrebbe avere senza aprire la finestra,
   quindi vale la pena darla qui.
   Il giallo qui non confligge con quello della griglia: dentro una lampadina
   si legge come "accesa", non come "lettera fuori posto". */
.wordle__icon-bulb {
  fill: none;
  transition: fill 0.25s ease;
}

.wordle__hint-open--lit .wordle__icon-bulb {
  fill: var(--color-present);
}

/* Stessa accensione, sulla ghiera del caveau invece che sulla lampadina:
   c'è almeno una parola risolta pronta da provare contro il Vault. */
.wordle__icon-dial {
  fill: none;
  transition: fill 0.25s ease;
}

.wordle__hint-open--lit .wordle__icon-dial {
  fill: var(--color-present);
}

.wordle__hint-open:active {
  transform: translateY(1px);
}

/* === Cruscotto (livello / tempo / punteggio) ===
   Una fascia sola divisa in tre, con i numeri grandi e le etichette piccole.
   Fondino chiarissimo invece di tre riquadri bordati: pesa meno della griglia,
   che deve restare il centro della scena. */
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

/* Separatore fra una voce e l'altra, tranne che prima della prima. */
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

/* Cifre a larghezza fissa: non ballano mentre il tempo scende. */
.wordle__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: lining-nums tabular-nums;
}

/* === I due badge: fascia sbloccata e parola di ripasso === */

/* Altezza riservata anche quando il secondo badge non c'è: senza, la griglia
   salterebbe su e giù di venti pixel a ogni parola di ripasso. È lo stesso
   accorgimento della riga del messaggio. */

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

/* Il valore in colore pieno, l'etichetta attenuata: fra i due, quello che il
   giocatore deve leggere è la fascia. */
.wordle__badge-value {
  font-size: 0.78rem;
  color: var(--color-text);
  font-variant-numeric: lining-nums tabular-nums;
}

/* Su fondino, come le altre pastiglie del gioco: senza, un testo minuscolo in
   fondo a destra si legge come un residuo invece che come un'informazione. */
.wordle__badge--review {
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  background: var(--color-surface);
  text-transform: uppercase;
}

/* Quando il tempo sta per scadere il riquadro si accende di rosso. */
.wordle__stat--urgent {
  background: #fdeceb;
}

.wordle__stat--urgent .wordle__stat-label,
.wordle__stat--urgent .wordle__stat-value {
  color: var(--color-urgent);
}

.wordle__stat--urgent .wordle__stat-value {
  animation: wordle-pulse 1s ease-in-out infinite;
}

@keyframes wordle-pulse {
  50% {
    transform: scale(1.07);
  }
}

/* Griglia e tastiera: spostate in GameBoard.vue e OnScreenKeyboard.vue. */

/* Animazione d'ingresso del pulsante che apre HintPanel.vue (il pannello in
   sé, con le sue regole, vive lì: qui resta solo il pulsante che lo apre). */
@keyframes wordle-hints-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
