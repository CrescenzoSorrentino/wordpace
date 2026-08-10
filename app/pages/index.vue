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
        Sfondo della testatina: le celle del gioco stesso, sfumate.
        Non è un'illustrazione decorativa presa altrove — è il linguaggio
        visivo della griglia, così chi arriva capisce di che gioco si tratta
        prima ancora di leggere il sottotitolo.

        È disegnato qui dentro invece di essere un file .svg separato: nessuna
        richiesta di rete in più, i colori arrivano dalle stesse variabili del
        gioco, e resta nitido su qualsiasi schermo.

        aria-hidden perché è puramente decorativo: per un lettore di schermo
        annunciare venti rettangoli sarebbe solo rumore.
      -->
      <svg
        class="hero__pattern"
        viewBox="0 0 600 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <g class="hero__tiles">
          <!-- Riga alta -->
          <rect x="18" y="14" width="44" height="44" rx="3" />
          <rect x="70" y="14" width="44" height="44" rx="3" class="is-correct" />
          <rect x="122" y="14" width="44" height="44" rx="3" />
          <rect x="434" y="14" width="44" height="44" rx="3" />
          <rect x="486" y="14" width="44" height="44" rx="3" class="is-present" />
          <rect x="538" y="14" width="44" height="44" rx="3" />

          <!-- Riga centrale, arretrata per lasciare respiro al titolo -->
          <rect x="-8" y="66" width="44" height="44" rx="3" class="is-absent" />
          <rect x="44" y="66" width="44" height="44" rx="3" />
          <rect x="512" y="66" width="44" height="44" rx="3" />
          <rect x="564" y="66" width="44" height="44" rx="3" class="is-correct" />

          <!-- Riga bassa -->
          <rect x="18" y="118" width="44" height="44" rx="3" />
          <rect x="70" y="118" width="44" height="44" rx="3" />
          <rect x="122" y="118" width="44" height="44" rx="3" class="is-present" />
          <rect x="174" y="118" width="44" height="44" rx="3" />
          <rect x="382" y="118" width="44" height="44" rx="3" />
          <rect x="434" y="118" width="44" height="44" rx="3" class="is-correct" />
          <rect x="486" y="118" width="44" height="44" rx="3" />
          <rect x="538" y="118" width="44" height="44" rx="3" />
        </g>
      </svg>

      <div class="hero__content">
        <h1 class="hero__title">Wordpace</h1>
        <p class="hero__tagline">Keep the pace</p>
      </div>
    </header>

    <!-- Su schermo largo il gancio sta a sinistra e la dimostrazione a destra:
         impilati diventerebbero due blocchi stretti in mezzo a metà schermo
         vuoto. Su telefono tornano una colonna sola, nell'ordine in cui sono
         scritti — prima si capisce cos'è, poi lo si vede. -->
    <div class="top">
      <!-- Il gancio e il tasto stanno insieme e in alto: su un telefono devono
           entrambi entrare nella prima schermata, senza scorrere. Chi riceve il
           link legge una riga e decide; chi torna a giocare clicca e basta. -->
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

      <!-- Una partita finta, ferma. Vale più delle tre caselle qui sotto messe
           insieme: chi arriva vede in mezzo secondo che è un gioco di parole E
           che ti spiega la parola, senza leggere una riga.

           Le tre righe sono una partita plausibile verso ACORN, non lettere a
           caso: SLATE trova la A fuori posto, ACRID inchioda le prime due e
           sposta la R, ACORN chiude.

           La parola, la pronuncia e il livello sono quelli veri del dizionario,
           non inventati: chi arriva qui e poi gioca deve ritrovare le stesse
           cose, non una versione pubblicitaria.

           La griglia è aria-hidden perché quindici lettere sciolte, lette una
           per una da un lettore di schermo, sarebbero rumore: il senso lo porta
           la didascalia qui sotto. -->
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
  border-bottom: 1px solid var(--wg-border);
}

.hero__pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Sfuma verso il centro, così il titolo resta su fondo pulito e leggibile
     invece di sovrapporsi ai riquadri. Il prefisso -webkit- serve alle versioni
     di Safari precedenti alla 15.4. */
  -webkit-mask-image: radial-gradient(
    ellipse 55% 95% at center,
    transparent 32%,
    #000 78%
  );
  mask-image: radial-gradient(
    ellipse 55% 95% at center,
    transparent 32%,
    #000 78%
  );
}

/* I riquadri vuoti: solo il contorno, come le celle non ancora giocate. */
.hero__tiles rect {
  fill: none;
  stroke: var(--wg-border);
  stroke-width: 2;
}

/* I tre colori del gioco, molto smorzati: devono suggerire, non gridare. */
.hero__tiles .is-correct {
  fill: var(--wg-correct);
  stroke: var(--wg-correct);
  opacity: 0.55;
}

.hero__tiles .is-present {
  fill: var(--wg-present);
  stroke: var(--wg-present);
  opacity: 0.5;
}

.hero__tiles .is-absent {
  fill: var(--wg-absent);
  stroke: var(--wg-absent);
  opacity: 0.3;
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

/* === Gancio e tasto === */

/* Una colonna sola a ogni larghezza di schermo: la stessa impaginazione del
   telefono, centrata. La versione a due colonne per il desktop è stata provata
   e scartata — su schermo largo il testo a sinistra e la griglia a destra
   lasciavano il centro vuoto e la pagina sembrava sbilanciata.

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
