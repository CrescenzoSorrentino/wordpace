# Wordpace

A five-letter word game turned into an **endless, time-pressured run** with a
global leaderboard — and a dictionary entry after every word, so a run also
teaches you vocabulary.

Inspired by the classic five-letter guessing game. Not affiliated with, or
endorsed by, The New York Times.

🎮 **Play it:** https://wordpace.vercel.app

## How to play

- Guess the hidden five-letter English word in six tries. Each letter is marked
  **🟩 green** (right spot), **🟨 yellow** (in the word, wrong spot) or
  **⬜ grey** (not in the word).
- Solve a word to **advance a level**, bank points, and get a fresh word.
- **Words get harder as you climb, on the scale you're taught on.** Every
  answer is graded by the CEFR level at which a learner is expected to know it,
  and the levels draw from a widening pool: **A1–A2** to start, **+B1** from
  level 3, **+B2** from level 5, **+C1–C2** from level 8. The pools add up
  rather than replace each other, so a familiar word can still turn up at level
  20 — just less often. Which means the level you reach is a rough read on your
  own English: a B1 learner tends to stall around 5–8.
- Every level has a **countdown timer**. It starts at 5 minutes and each level
  hands out 8% less than the one before, fading toward nothing — so the late
  game is spent on savings rather than on what the level gives you.
- Time left over **carries into the next level**, capped at 5 minutes, which is
  what makes solving fast worth something beyond the points.
- Each guess **rewards time** for its useful letters — +10s per new green, +5s
  per new yellow — but only the *first* time you discover each one, so you can't
  farm time by re-typing the same letters. A guess that reveals nothing costs 5s.
- Whatever the outcome, the word is then **explained**: part of speech, IPA
  pronunciation with a button that speaks it aloud, its CEFR level, a
  definition and an example sentence. The clock and the keyboard are frozen
  while you read; a **Continue** button skips the remaining seconds.
- The game says what it is doing while you play. A badge shows the **widest
  CEFR band unlocked** at your level — the pool, not the current word, because
  pools stack: a level-10 run can still serve an A2 word, and a badge reading
  "A2" right after "B2" would look like a demotion. A second badge marks the
  word as one you have **seen before**. Both were invisible before: the bands
  and the review system lived in the logic, and a run looked like a plain
  five-letter game with a definition at the end.
- **Words you have already met come back.** One answer in four is drawn from
  the last twenty words you have seen rather than from the dictionary at large,
  because a word met once is a word lost — vocabulary needs several spaced
  encounters to stick, and until now every Wordpace word was shown once and
  never returned. A review still has to belong to your current level's pool, so
  a C1 word met yesterday cannot surface at level 1, and a word that already
  appeared in the run you're playing is never repeated inside it.
- The run ends when you run out of guesses **or** run out of time. If your score
  makes the top 10 **of the current month**, you're prompted for a nickname and
  added to the leaderboard. The board starts fresh on the first of every month,
  so a good run is never locked out by scores set long ago.
- Either way the run is **yours to keep**: your best level, your best score and
  how many distinct words you have met are stored in the browser and shown on
  the home page — the ten names on the board are not the only measure of
  progress, and for a learner the word count is the more honest one.
- A finished run can be **shared** as four squares, one per CEFR band: green for
  the bands you cleared, yellow for the one you reached. On a phone it opens the
  system share sheet, on a desktop it goes to the clipboard.

## When you're stuck

Once you've made **3 guesses** — or the clock drops under **45 seconds** — a
**Hint** button appears. Everything behind it is paid for in points, and the
clock keeps running while the panel is open: being stuck is meant to cost
something.

**Hints** reveal a bit of the word and stay readable for the rest of it. Prices
are per level (`cost × level`), because the points a word is worth grow with the
level too:

| Hint | Reveals | Price |
| --- | --- | --- |
| Letter | One letter of the word you haven't tried yet | 3 × level |
| Sentence | The example sentence, with the word blanked out | 6 × level |
| Definition | What the word means | 12 × level |

**Skips** give up on the word entirely — you get a new one, and you never find
out what it was worth. You get **3 per run**, and each one costs more than the
last: `10 × level × 2^(skips already used)`. At level 3, where a solved word is
worth around 60 points, that's 30, then 60, then 120.

A skip buys you a word you might actually know — not more time. The level stays
the same and the abandoned word scores zero. The one thing it does give back is
a **floor**: if the clock is under 45 seconds, a skip lifts it back to 45. Not a
gift — you get nothing at all if you were above it — but without that floor a
skip was only useful when you didn't need it. With the clock nearly out, which
is exactly when the button looks like a way out, you changed word and died
anyway, poorer by the points. Runs end on time, so that was the one moment a
player had no lever at all.

## The Vault

A second board, open any time via the **Vault** button — free, no time or
points cost. It's a ladder of four hidden words, one per CEFR band you've
unlocked (A1–A2, then +B1, +B2, all bands), cracked with words you've
**already solved** in the current run rather than ones typed cold.

- Pick any solved word from the **List** and try it against the Vault's secret
  word — colored exactly like a normal guess. A wrong try costs nothing; a
  word leaves the list only once you've tried it.
- You can also **type a guess freely** with the same on-screen keyboard,
  whenever you want. It never locks the tier, but a wrong one costs points —
  the price rises with how many letters you've already confirmed, so a wild
  guess with no clues is cheap and a near-certain one costs close to what
  the tier is worth. The List stays free either way, so score only leaves
  your pocket when you choose to gamble.
- Solving a tier banks `50 × level` points, explains the word (same as
  after any level), and unlocks the next tier immediately, whatever your
  main-game level is.
- Resets with every new run, same as score, hints and skips.

Nothing in it is invented: every word on offer is one you genuinely won, so
the Vault stays the same game seen from a second angle, not a bolted-on
mini-game.

## Scoring

Per solved word: `(10 + unusedAttempts * 5) * level` — faster solves and higher
levels are worth more.

## Tech

- **Nuxt 4** / **Vue 3** (`<script setup>`), vanilla scoped CSS (BEM). Two
  pages: a home that explains the game and does not run a clock, and the game
  itself — the timer starts when you press Play, not when the page loads.
- **Upstash Redis** for the leaderboard, stored as a sorted set (`ZADD` / `ZRANGE`)
  under a per-month key (`wordle:leaderboard:2026-08`), so the board resets on
  its own and old months expire instead of piling up.
- Pure game rules live in `shared/` (imported via the `#shared` alias) and are
  reused on the client and re-validated on the server.
- Personal records live in `localStorage`, not on the server: with no accounts
  there is no "who", so the server would need an identifier kept in the browser
  anyway. Nothing about a player is stored server-side except a nickname they
  typed themselves to enter the board.
- The review queue is deliberately **short** — the last twenty words, not every
  word ever met. Drawing a review at random from the whole archive dilutes
  itself as the archive grows: at 10 words met a given word returns every 8
  runs, at 150 every 120, which is never. A fixed-length queue keeps the review
  interval constant however much you play. It needs no extra stored data, since
  the saved word list is already in first-met order.
- Every finished run logs **one line** — level reached, score, whether time or
  guesses ended it, which hints were bought, how many skips — kept as a Redis
  list capped at the last thousand. It exists because the game had been tuned
  on one player's impressions: the level thresholds for the CEFR bands assume
  most runs end around level 3-4, and that was an estimate nobody had measured.
  The call is not awaited and swallows its own failure — a run that cannot be
  logged must cost the player nothing. `npm run runs` reads those lines back
  and prints how runs end, how many ever reach the levels where each band
  opens, and whether hints and skips get bought at all. The level counts are
  cumulative on purpose: "how many reach level 3" is the question the band
  design rests on.
- A review word is worth the same as any other. Scoring is
  `(10 + unusedAttempts * 5) * level`, so remembering a word already pays —
  you solve it in fewer guesses and keep the seconds. Adding a bonus would pay
  twice for the same thing, and taking points away would punish the one
  outcome the game exists to produce.
- The game area sets `touch-action: manipulation`, which drops double-tap zoom
  (and the ~300ms wait browsers spend deciding whether a second tap is coming)
  on a keyboard where five quick taps are the normal case. Pinch zoom is left
  alone on purpose: `user-scalable=no` would have been the quick fix and takes
  zooming away from everyone who needs it to read.
- Pronunciation uses the browser's built-in `speechSynthesis` — no audio files
  and no network call. A named preference list picks a real English voice, since
  macOS ships novelty voices (Zarvox, Boing…) that also declare themselves
  `en-US`.
- The dictionary (~440 KB) and the CEFR grades are **never sent to the browser**.
  Both are imported only by a server route, and the game fetches one entry at a
  time — at the *start* of each level, so the request has finished long before
  the entry is shown. The client gets only the word lists it needs to pick an
  answer (~148 KB).

```
app/pages/index.vue                  home: the pitch, Play, your records, the board
app/pages/play.vue                   the game page, deliberately bare
app/utils/stats.ts                   personal records, kept in localStorage
app/utils/share.ts                   the text of a shared run
app/components/WordpaceGame.vue      the game (state, timer, UI) and the Vault's own state
app/components/GameBoard.vue         the letter grid, shared by the game and the Vault
app/components/OnScreenKeyboard.vue  the on-screen keyboard, shared by the game and the Vault
app/components/VaultPanel.vue        the Vault screen (reads its state as props)
shared/wordle.ts                     pure rules: evaluate, validate, timer formula
shared/words/answer-words.ts         the answers, split into four CEFR bands
shared/words/cefr-levels.json        the CEFR level of every answer (server-side)
shared/words/valid-words.ts          every word accepted as a guess
shared/definitions.ts                dictionary lookup, with a never-throwing fallback
shared/words/definitions.ts          2,315 generated entries (do not edit by hand)
shared/leaderboard.ts                leaderboard rules shared by client and server
server/utils/leaderboard.ts          the Redis key of the current month's board
server/api/definition.get.ts         one dictionary entry, by word
server/api/leaderboard.get.ts        read the top 10
server/api/leaderboard.post.ts       save a score (validated + rate limited)
server/api/telemetry.post.ts         log one line per finished run
scripts/analyze-runs.mjs             read the recorded runs (npm run runs)
scripts/                             dictionary generation + validation (see below)
```

## Local development

Requires Node 20+ and an [Upstash Redis](https://console.upstash.com) database
(the free tier is plenty).

```bash
npm install
cp .env.example .env      # then fill in your Upstash REST URL + token
npm run dev               # http://localhost:3000
```

Environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `NUXT_UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `NUXT_UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `ANTHROPIC_API_KEY` | Only to regenerate the dictionary — the app never uses it |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check app, server and shared code |
| `npm run runs` | Read the recorded runs and print what they say |

## The dictionary

`shared/words/definitions.ts` holds one entry per answer word — part of
speech, IPA, a definition, a short gloss for the recall quiz, and an example
sentence. It is generated, not hand-written, so that all 2,315 entries come
out of a single prompt and stay consistent with each other.

```bash
node --env-file=.env scripts/generate-definitions.mjs   # generate what's missing
node scripts/build-definitions.mjs                      # assemble + validate
node --env-file=.env scripts/generate-cefr.mjs          # grade answers A1–C2
node scripts/build-answer-tiers.mjs                     # re-split answers by tier
```

- **Generation** needs `ANTHROPIC_API_KEY` in `.env`. It asks for 50 words per
  request, four requests at a time, and constrains the reply with a JSON schema
  so the response cannot arrive as prose. Re-running it is safe and cheap: it
  only asks for words that are still missing, so an interrupted run resumes
  where it stopped and nothing is paid for twice.
- **Validation** is a separate step on purpose. It checks coverage against the
  answer list, duplicates, unknown parts of speech, IPA wrapped in slashes, the
  short gloss's length (1–6 words), and that every example sentence actually
  uses its word. Irregular verbs (`cling` → *clung*) trip the last check; known
  ones are whitelisted after being checked by eye, everything else is a
  warning to look at, not to auto-fix. **It refuses to write the dictionary at
  all while any problem is open** — this file can't be reconstructed by hand,
  so a partial rewrite is worse than stopping.
- Intermediate JSON blocks live in `scripts/.cache/` and are git-ignored; they
  can be regenerated at any time.
- **CEFR grading** asks for the level at which a learner is expected to know
  each answer (A1–C2) and stores it in `shared/words/cefr-levels.json`. It is a
  separate pass from generation because it answers a different question than
  the dictionary's own `level` field: `level` says how common a word is for a
  *native speaker*, which put `lease`, `merge` and `grasp` among the "common"
  ones and made the opening levels of the game demand solid B1. It is
  resumable, and takes a word count as its first argument for a trial run.
- **Tiering** turns those grades into the four pools — A1+A2, B1, B2, C1+C2 —
  and rewrites `answer-words.ts`. It exists because the dictionary is 449 KB
  and stays on the server, while the word has to be picked in the browser, so
  the one bit the client needs is baked into a 20 KB file instead. It refuses
  to write unless every answer has a grade, rather than mixing the two scales.

## Deployment

Deploys as a standard Nuxt app (e.g. Vercel). Set the two `NUXT_*` environment
variables in the host's dashboard — the local `.env` is not uploaded — and
redeploy so they take effect.

## Notes

- No accounts: the leaderboard keeps only the top 10 and trims the rest.
- Nothing identifying is stored about a player. The only name Wordpace ever
  keeps is one typed deliberately to enter the leaderboard; personal records
  never leave the browser, and a logged run carries no nickname and no address
  — an address is used to rate-limit the write and is never part of the line.
- The score is still reported by the client, so it can be faked — the server
  only limits the damage: it rejects anything above a plausible ceiling, allows
  5 submissions per hour per address, and wipes the board monthly. A forged
  score is therefore beatable and temporary rather than permanent. Verifying it
  properly would mean replaying the run server-side, which is overkill here.
- Everything the player reads is in English, so the game isn't limited to one
  audience. Code comments are in Italian — different readers, different language.
- The dictionary was written by Claude and reviewed by sampling, not entry by
  entry. Expect the odd imprecise IPA transcription; the 🔊 button is the
  authoritative pronunciation.
- Definitions and examples use a **controlled vocabulary**: explain a word
  with easier words, never one as hard as the word itself — the same
  principle behind every learner's dictionary (Longman, Oxford Advanced
  Learner's). It exists because the first version didn't follow it: "the nut
  of an oak tree" is a correct definition of *acorn* and a useless one — a
  learner who doesn't know *acorn* usually doesn't know *oak* either. A paper
  test with real entries confirmed it before the full 2,315-word rebuild.

## License

[MIT](./LICENSE) © Crescenzo Sorrentino
