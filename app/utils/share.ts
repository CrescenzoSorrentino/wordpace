/**
 * Il testo che il giocatore copia e incolla in una chat a fine partita.
 *
 * Sta qui e non dentro il componente perché è logica pura: entrano due numeri,
 * esce una stringa. Nessuna reattività, nessun DOM — quindi si può provare
 * dando dei valori e guardando cosa esce.
 */
import { BANDS, bandForLevel } from "#shared/wordle";

/**
 * L'indirizzo del gioco. In una costante e non dentro il testo: il giorno che
 * cambia dominio c'è un posto solo da toccare.
 *
 * Col protocollo davanti anche se è più brutto: negli appunti finisce testo
 * semplice, e sono le chat a riconoscere gli indirizzi e renderli toccabili.
 * Quasi tutte lo fanno anche senza `https://`, ma "quasi" su un collegamento
 * che è l'intero scopo del messaggio non vale i quattro caratteri risparmiati.
 */
export const SHARE_URL = "https://wordpace.vercel.app";

/**
 * I tre quadratini, con lo stesso significato che i colori hanno nel gioco:
 * verde una cosa fatta, giallo una in corso, grigio una non ancora raggiunta.
 *
 * Sono emoji e non un disegno: il testo finisce negli appunti e poi in una
 * chat, dove sopravvive solo il testo semplice. È lo stesso vincolo per cui il
 * messaggio di Wordle usa i quadratini colorati invece di un'immagine.
 */
const PASSED = "🟩";
const REACHED = "🟨";
const NOT_REACHED = "⬜";

/**
 * Una barra di quattro quadratini che dice fin dove è arrivato il giocatore.
 *
 * Quattro e non uno per livello: al livello 40 la riga andrebbe a capo in
 * chat e diventerebbe illeggibile. Così è sempre lunga uguale e due messaggi
 * si confrontano a colpo d'occhio.
 */
function bandBar(level: number): string {
  // Calcolato una volta sola, fuori dal map: dentro rifarebbe la stessa
  // ricerca quattro volte per ottenere sempre lo stesso numero.
  const reached = BANDS.indexOf(bandForLevel(level));

  // `.map` costruisce un array della stessa lunghezza di BANDS, un quadratino
  // per fascia. Il primo parametro sarebbe il nome della fascia, ma qui non
  // serve: conta solo la POSIZIONE, cioè il secondo.
  const squares = BANDS.map((_band, i) => {
    if (i < reached) return PASSED;
    if (i === reached) return REACHED;
    return NOT_REACHED;
  });

  // `.join("")` incolla i quattro elementi in una stringa sola, senza separatore.
  return squares.join("");
}

/**
 * Il messaggio da condividere.
 *
 * Non contiene il nome di chi gioca, e non è una dimenticanza: il testo si
 * incolla in una chat, dove chi legge sa già chi glielo ha mandato. "Marco —
 * level 12" scritto da Marco è ridondante.
 *
 * La riga della fascia è quella che fa il lavoro: "1340 points" da solo non
 * dice niente a chi non conosce il gioco, mentre "C1-C2 words" dice insieme che
 * si tratta d'inglese, che c'è una progressione e quanto in alto si è arrivati.
 *
 * Qui l'indirizzo NON c'è: lo aggiunge shareText per gli appunti, mentre il
 * pannello di condivisione lo riceve nel suo campo apposta. Senza collegamento,
 * comunque lo si consegni, avresti condiviso un vanto e non un gioco.
 */
export function shareBody(level: number, score: number): string {
  return `Wordpace — level ${level}
${bandBar(level)}
${score} points · ${bandForLevel(level)} words

Can you beat me?`;
}

/**
 * Il messaggio completo, indirizzo incluso: la versione da mettere negli
 * appunti, dove non esiste nessun campo separato per il collegamento.
 *
 * Esiste separata da shareBody perché il pannello di condivisione del telefono
 * il link lo vuole a parte, nel suo campo `url` — passandolo anche nel testo
 * comparirebbe due volte.
 */
export function shareText(level: number, score: number): string {
  return `${shareBody(level, score)} ${SHARE_URL}`;
}
