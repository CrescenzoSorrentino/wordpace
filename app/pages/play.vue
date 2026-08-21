<template>
  <main class="play">
    <!-- Il rimando alla home. Non è un tasto "indietro" del browser: da qui si
         può arrivare anche con un link diretto, e in quel caso indietro non
         porterebbe da nessuna parte. -->
    <NuxtLink to="/" class="play__home">Wordpace</NuxtLink>

    <WordpaceGame />
  </main>
</template>

<script setup lang="ts">
/**
 * La pagina del gioco. Volutamente spoglia: qui il compito è non stare in mezzo.
 *
 * Niente testatina col titolo, a differenza della home: su un telefono quei
 * centoventi pixel si pagano in altezza della griglia, e chi sta giocando il
 * nome del gioco lo sa già. Resta solo un rimando piccolo per tornare indietro.
 */
useSeoMeta({
  title: "Play — Wordpace",
});
</script>

<style scoped>
.play {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-height: 100vh;
  padding: 0.75rem 1rem 2rem;
  box-sizing: border-box;
  font-family:
    "Helvetica Neue",
    -apple-system,
    Helvetica,
    Arial,
    sans-serif;
  background: #ffffff;
  color: #1a1a1a;
}

.play__home {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-decoration: none;
  color: #6e7275;
  transition: color 0.12s ease;
}

.play__home:hover {
  color: #1a1a1a;
}
</style>
