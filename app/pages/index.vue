<script setup lang="ts">
/**
 * Home: la pagina su cui atterra chi riceve il link, e il punto da cui si
 * riparte fra una partita e l'altra. Non contiene il gioco — quello sta in
 * /play — perché le due pagine hanno mestieri opposti: qui si legge con calma,
 * lì si corre contro il tempo.
 */
import type { LeaderboardEntry } from "#shared/leaderboard";

/**
 * La classifica del mese, chiesta al server DURANTE la resa della pagina e non
 * dal browser dopo: così arriva già dentro l'HTML e la sezione non compare con
 * un sussulto un istante dopo il resto.
 *
 * `default` copre il caso in cui la rotta non risponda: una home senza
 * classifica è accettabile, una home rotta no.
 */
const { data: leaderboard } = await useFetch<LeaderboardEntry[]>(
  "/api/leaderboard",
  { default: () => [] },
);
</script>

<template>
  <main class="page">
    <header class="hero">
      <!--
        Sfondo della testatina: le celle vuote del gioco, ripetute.

        La versione precedente aveva diciotto riquadri a coordinate fisse dentro
        un viewBox 600×200 con `slice`: le celle venivano quindi INGRANDITE o
        ritagliate a seconda della larghezza dello schermo — riquadroni da cento
        pixel su un monitor grande, celle tagliate via su uno stretto. Le
        posizioni funzionavano per una proporzione sola.

        Ora è un <pattern>: il disegno non si ridimensiona, si RIPETE. Le celle
        restano di 52 pixel su qualsiasi schermo, cambia solo quante ce ne
        stanno. Il riquadro del motivo è di tre righe per cinque colonne — come
        una griglia del gioco — con tre celle colorate in posizioni diverse:
        abbastanza grande perché la ripetizione non si legga come una piastrella.

        aria-hidden perché è decorativo: per un lettore di schermo sarebbe solo
        rumore.
      -->
      <svg class="hero__pattern" aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id="hero-cells"
            width="260"
            height="156"
            patternUnits="userSpaceOnUse"
          >
            <g class="hero__tiles">
              <rect x="4" y="4" width="44" height="44" rx="3" />
              <rect x="56" y="4" width="44" height="44" rx="3" />
              <rect x="108" y="4" width="44" height="44" rx="3" class="is-correct" />
              <rect x="160" y="4" width="44" height="44" rx="3" />
              <rect x="212" y="4" width="44" height="44" rx="3" />

              <rect x="4" y="56" width="44" height="44" rx="3" />
              <rect x="56" y="56" width="44" height="44" rx="3" class="is-present" />
              <rect x="108" y="56" width="44" height="44" rx="3" />
              <rect x="160" y="56" width="44" height="44" rx="3" />
              <rect x="212" y="56" width="44" height="44" rx="3" class="is-absent" />

              <rect x="4" y="108" width="44" height="44" rx="3" />
              <rect x="56" y="108" width="44" height="44" rx="3" />
              <rect x="108" y="108" width="44" height="44" rx="3" />
              <rect x="160" y="108" width="44" height="44" rx="3" class="is-correct" />
              <rect x="212" y="108" width="44" height="44" rx="3" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-cells)" />
      </svg>

      <div class="hero__content">
        <h1 class="hero__title">Wordpace</h1>
        <p class="hero__tagline">Keep the pace</p>
      </div>
    </header>

    <div class="top">
      <!-- Il gancio e il tasto stanno subito sotto la testatina: su un telefono
           devono entrare nella prima schermata, senza scorrere. Chi riceve il
           link legge una riga e decide; chi torna a giocare clicca e basta.

           Sono stati provati DENTRO la fascia della testatina, per giustificarne
           la larghezza piena: da guardare era peggio, e sono tornati qui. -->
      <section class="intro">
        <p class="intro__pitch">
          A word game for people learning English. Guess five-letter words
          against the clock, and walk away knowing what they mean.
        </p>
        <NuxtLink to="/play" class="intro__play">Play</NuxtLink>
        <!-- Le due cose che tolgono l'ultimo dubbio prima di cliccare: quanto ci
             metto e cosa mi costa. Nel piede della pagina non le leggeva
             nessuno; accanto al tasto rispondono nel momento in cui uno se le
             sta chiedendo. -->
        <p class="intro__reassure">No sign-up · about 3 minutes a run</p>
      </section>

      <!-- Una partita finta, ferma. Vale più di qualunque descrizione: chi
           arriva vede in mezzo secondo che è un gioco di parole E che ti spiega
           la parola, senza leggere una riga.

           Le tre righe sono una partita plausibile verso ACORN, non lettere a
           caso: SLATE trova la A fuori posto, ACRID inchioda le prime due e
           sposta la R, ACORN chiude. Parola, pronuncia e livello sono quelli veri
           del dizionario: chi clicca deve ritrovare le stesse cose.

           La griglia è aria-hidden perché quindici lettere sciolte, lette una per
           una da un lettore di schermo, sarebbero rumore: il senso lo porta la
           didascalia. -->
      <figure class="demo">
        <div class="demo__grid" aria-hidden="true">
          <span class="demo__cell demo__cell--absent">S</span>
          <span class="demo__cell demo__cell--absent">L</span>
          <span class="demo__cell demo__cell--present">A</span>
          <span class="demo__cell demo__cell--absent">T</span>
          <span class="demo__cell demo__cell--absent">E</span>

          <span class="demo__cell demo__cell--correct">A</span>
          <span class="demo__cell demo__cell--correct">C</span>
          <span class="demo__cell demo__cell--present">R</span>
          <span class="demo__cell demo__cell--absent">I</span>
          <span class="demo__cell demo__cell--absent">D</span>

          <span class="demo__cell demo__cell--correct">A</span>
          <span class="demo__cell demo__cell--correct">C</span>
          <span class="demo__cell demo__cell--correct">O</span>
          <span class="demo__cell demo__cell--correct">R</span>
          <span class="demo__cell demo__cell--correct">N</span>
        </div>

        <figcaption class="demo__word">
          <p class="demo__meta">
            <span class="demo__pos">noun</span>
            <span class="demo__ipa">/ˈeɪkɔːrn/</span>
            <span class="demo__level">B2</span>
          </p>
          <p class="demo__definition">The nut of an oak tree.</p>
        </figcaption>
      </figure>
    </div>

    <!-- Perché non è l'ennesimo clone. Chi vede una griglia 5×6 pensa "questo
         l'ho già visto" e chiude: queste tre caselle sono l'unico posto in cui
         il gioco dice di essere uno strumento per imparare l'inglese. -->
    <section class="facts" aria-labelledby="facts-title">
      <h2 id="facts-title" class="section-title">How it works</h2>

      <div class="facts__list">
        <article class="fact">
          <p class="fact__title">A1 → C2</p>
          <p class="fact__text">
            The higher you climb, the rarer the words you're asked for.
          </p>
        </article>
        <article class="fact">
          <p class="fact__title">The clock is the enemy</p>
          <p class="fact__text">
            Every level is shorter than the last, and every letter you uncover
            buys seconds back.
          </p>
        </article>
        <article class="fact">
          <p class="fact__title">Every word explained</p>
          <p class="fact__text">
            Meaning, pronunciation and an example — the ones you missed included.
          </p>
        </article>
      </div>
    </section>

    <!-- La classifica riparte il primo di ogni mese, quindi è sempre battibile:
         è il motivo per tornare domani, e la prova che qualcun altro gioca. -->
    <section v-if="leaderboard.length" class="board" aria-labelledby="board-title">
      <h2 id="board-title" class="section-title">Best this month</h2>
      <ol class="board__list">
        <li v-for="(entry, i) in leaderboard" :key="i" class="board__row">
          <span class="board__rank">{{ i + 1 }}</span>
          <span class="board__nick">{{ entry.nick }}</span>
          <span class="board__score">{{ entry.score }}</span>
        </li>
      </ol>
      <p class="board__note">The board starts fresh on the 1st of every month.</p>
    </section>

    <footer class="foot">
      <p>Free and open source. Made for people learning English.</p>
    </footer>
  </main>
</template>

<style scoped>
.page {
  /* Gli stessi colori del gioco. Sono ridichiarati qui e non importati perché
     là vivono dentro `.wordle`, che su questa pagina non esiste. */
  --wg-text: #1a1a1a;
  --wg-dim: #6e7275;
  --wg-border: #d3d6da;
  --wg-surface: #f6f7f8;
  --wg-correct: #5f9e58;
  --wg-present: #ab8f3a;
  --wg-absent: #787c7e;

  /* La larghezza della colonna, una sola per tutta la pagina. */
  --col: 26rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  min-height: 100vh;
  padding: 0 1rem 3rem;
  box-sizing: border-box;
  font-family:
    "Helvetica Neue",
    -apple-system,
    Helvetica,
    Arial,
    sans-serif;
  background: #ffffff;
  color: var(--wg-text);
}

/* === Testatina ===
   La fascia esce dai margini della pagina e tocca i bordi dello schermo.
   Lo fa con margini negativi pari al padding di .page, e NON con `100vw`:
   quella misura include anche la barra di scorrimento, quindi sui computer che
   la mostrano sempre la fascia risulterebbe più larga della finestra e
   comparirebbe una barra di scorrimento orizzontale. */
.hero {
  position: relative; /* riferimento per lo sfondo, che sta sotto in assoluto */
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% + 2rem);
  margin: 0 -1rem;
  padding: clamp(1.75rem, 7vw, 3rem) 1rem clamp(1.25rem, 4vw, 2rem);
  overflow: hidden; /* le celle che escono dai bordi vengono tagliate */
}

.hero__pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Sfuma verso il centro, così il titolo resta su fondo pulito e leggibile
     invece di sovrapporsi ai riquadri. Con un motivo che si ripete la sfumatura
     conta più di prima: senza, la fascia sarebbe una scacchiera uniforme da
     bordo a bordo e il titolo ci si perderebbe dentro.
     Il prefisso -webkit- serve alle versioni di Safari precedenti alla 15.4. */
  -webkit-mask-image: radial-gradient(
    ellipse 60% 100% at center,
    transparent 30%,
    #000 85%
  );
  mask-image: radial-gradient(
    ellipse 60% 100% at center,
    transparent 30%,
    #000 85%
  );
}

/* I riquadri vuoti: solo il contorno, come le celle non ancora giocate. */
.hero__tiles rect {
  fill: none;
  stroke: var(--wg-border);
  stroke-width: 2;
}

/* I tre colori del gioco, molto smorzati: devono suggerire, non gridare. */
/* Più smorzati di prima: con il motivo ripetuto le celle colorate sono molte di
   più, e alla vecchia intensità la fascia diventerebbe un tappeto a pois. */
.hero__tiles .is-correct {
  fill: var(--wg-correct);
  stroke: var(--wg-correct);
  opacity: 0.32;
}

.hero__tiles .is-present {
  fill: var(--wg-present);
  stroke: var(--wg-present);
  opacity: 0.3;
}

.hero__tiles .is-absent {
  fill: var(--wg-absent);
  stroke: var(--wg-absent);
  opacity: 0.18;
}

.hero__content {
  position: relative; /* sopra lo sfondo */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.hero__title {
  margin: 0;
  /* Cresce con lo schermo ma si ferma: oltre una certa dimensione il titolo
     comincerebbe a competere con la griglia del gioco. */
  font-size: clamp(1.9rem, 8.5vw, 3.25rem);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1;
  /* Con le lettere spaziate resta uno spazio anche dopo l'ultima: senza questo
     rientro la parola sembrerebbe spostata a sinistra. */
  text-indent: 0.16em;
}

.hero__tagline {
  margin: 0;
  font-size: clamp(0.62rem, 2.6vw, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-indent: 0.22em;
  color: var(--wg-dim);
}

/* Una colonna sola a ogni larghezza di schermo: la stessa impaginazione del
   telefono, centrata. Sono state provate e scartate due alternative — il
   gancio e la dimostrazione affiancati su schermo largo, e il gancio col tasto
   dentro la fascia della testatina: entrambe peggio da guardare.

   Tutte le sezioni condividono la stessa larghezza (--col): la ragione per cui
   la pagina sembrava un foglio era che ognuna ne aveva una diversa. */
.top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
  width: 100%;
  max-width: var(--col);
}

.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  text-align: center;
}

.intro__pitch {
  margin: 0;
  font-size: clamp(1rem, 3.4vw, 1.15rem);
  line-height: 1.5;
  color: var(--wg-dim);
}

/* Il tasto è un link, non un <button>: porta a un'altra pagina, quindi deve
   comportarsi come tale — apribile in una scheda nuova, trascinabile nei
   segnalibri, annunciato come collegamento da un lettore di schermo. */
.intro__play {
  display: inline-block;
  min-width: 12rem;
  padding: 0.95rem 2.5rem;
  border-radius: 4px;
  background: var(--wg-correct);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: filter 0.12s ease;
}

.intro__play:hover {
  filter: brightness(0.94);
}

.intro__play:active {
  transform: translateY(1px);
}

.intro__reassure {
  margin: -0.4rem 0 0;
  font-size: 0.75rem;
  color: var(--wg-dim);
}

/* === La partita dimostrativa === */

.demo {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
}

/* Cinque colonne uguali, come la griglia vera. Le celle si rimpiccioliscono
   con lo schermo invece di andare a capo: una griglia di parole spezzata su
   due righe non è più una griglia di parole. */
.demo__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  width: 100%;
}

.demo__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 4px;
  color: #ffffff;
  font-size: clamp(1.1rem, 5vw, 1.6rem);
  font-weight: 700;
}

.demo__cell--correct {
  background: var(--wg-correct);
}

.demo__cell--present {
  background: var(--wg-present);
}

.demo__cell--absent {
  background: var(--wg-absent);
}

/* La scheda della parola, sotto la griglia: è la metà del messaggio. Senza,
   la griglia direbbe soltanto "è un gioco di parole come tanti". */
.demo__word {
  width: 100%;
  padding: 0.7rem 0.9rem;
  box-sizing: border-box;
  border-radius: 6px;
  background: var(--wg-surface);
  text-align: left;
}

.demo__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.3rem;
  font-size: 0.8rem;
  color: var(--wg-dim);
}

.demo__pos {
  font-style: italic;
}

.demo__ipa {
  font-variant-numeric: lining-nums;
}

/* La stessa pastiglia che il gioco mostra a fine parola, stesso colore per la
   fascia B: chi arriva qui e poi gioca ritrova un segno che ha già visto. */
.demo__level {
  margin-left: auto;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: var(--wg-present);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
}

.demo__definition {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* === Le tre caselle === */

/* Il titoletto che apre una sezione. Una classe sola per tutte, invece di una
   regola per sezione: erano già quasi identiche, e due copie di uno stile
   prima o poi divergono.

   Serve soprattutto qui: con la pagina su una colonna, la scheda della parola
   dell\'esempio e queste tre caselle hanno lo stesso fondo grigio e si
   leggevano come un unico blocco di quattro riquadri. */
.section-title {
  margin: 0 0 0.7rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--wg-dim);
  text-align: center;
}

.facts {
  width: 100%;
  max-width: var(--col);
}

.facts__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fact {
  padding: 1.1rem 1.2rem;
  border-radius: 6px;
  background: var(--wg-surface);
  text-align: left;
}

.fact__title {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.fact__text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--wg-dim);
}

/* === Classifica === */

.board {
  width: 100%;
  max-width: var(--col);
}

.board__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.board__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.6rem;
  border-radius: 4px;
  background: var(--wg-surface);
  font-size: 0.95rem;
}

.board__rank {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: var(--wg-absent);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
}

/* Oro, argento e bronzo per i primi tre, come nel gioco. */
.board__row:nth-child(1) .board__rank {
  background: #c9a227;
}
.board__row:nth-child(2) .board__rank {
  background: #8e949a;
}
.board__row:nth-child(3) .board__rank {
  background: #a9743f;
}

.board__nick {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.board__score {
  font-variant-numeric: lining-nums tabular-nums;
}

.board__note {
  margin: 0.6rem 0 0;
  font-size: 0.72rem;
  color: var(--wg-dim);
  text-align: center;
}

.foot {
  font-size: 0.75rem;
  color: var(--wg-dim);
  text-align: center;
}

.foot p {
  margin: 0;
}
</style>
