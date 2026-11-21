# CryptoLab — Build Plan for Claude Code

Nov 19, 2026 · @Ali

## 1. How to use this plan

This plan asks Claude Code to build **CryptoLab**: a single-page web app that our group shows on the classroom projector to teach COMP3143 Week 7, Basic Cryptography (Easttom, *Computer Security Fundamentals*, 4th ed., Chapter 8). The app has three parts. Part 1 animates the fundamentals. Part 2 simulates 10 techniques live, with custom inputs and modes. Part 3 holds the class activities, quiz practice and the Lab 7 companion.

**For the student handing this over:**

1. Export this doc as Markdown and save it as `PLAN.md` in an empty folder.
2. Optional but recommended: connect Mobbin to Claude Code (Section 4).
3. Open Claude Code in that folder and say: *"Read PLAN.md fully, then build the app end to end, phase by phase, following Section 9."*

**Instructions to Claude Code:**

- Read the whole plan before writing code. Then build in the phase order of Section 9.
- After each phase, run the tests, open the app in a browser, check that phase's "Done when" list, and fix problems before moving on.
- Do not stop to ask for approval between phases. Make sensible choices and record them in `DECISIONS.md`. Stop only if something is truly blocked.
- Keep it simple. This is a classroom teaching tool, not a production product: no backend, no login, no database.
- Every technique must really work. Ciphertexts, hashes, keys and signatures shown on screen are computed for real, never faked for the animation.
- Teaching-only versions (Toy RSA, Simplified DES, ECB mode) must carry a visible "Teaching version - not secure" label.
- Keep the content faithful to the course notes. Lines marked **Course says** in this plan are facts from the lecture notes and slides; use them as written.
- Write all on-screen text in plain, simple English for first-time learners. Explain any technical term the first time it appears (the glossary tooltip in Section 5 does this).

## 1A. What to build (the only version): build this, skip the rest

**This section overrides everything below it.** The app is a one-time class showcase due Monday, not a product. Build only what this section lists; it is the whole app. The later sections hold extra detail and ideas, not a checklist. Where a later section asks for something listed under "Skip", skip it.

**Build**

- Home page with the roadmap, and a sidebar to move between pages. Previous/next buttons and arrow keys to step through animations.
- **4 fundamentals screens:** F1 (why cryptography, Alice/Bob/Eve with the encryption toggle), F2 + F3 merged (plaintext to ciphertext pipeline, with the key terms labelled on it), F4 (encoding vs encryption vs hashing), F7 (symmetric vs asymmetric, both scenes plus the comparison table).
- **All 10 technique pages, each with only two parts:** a short **Idea** panel (plain explanation + the "Course says" points) and a **Try it** panel with the live demo and its main modes. Add one simple step-by-step animation per page where Section 7 describes one, and keep it simple.
- **Every technique page explains how it works inside**, with a simple illustrated step animation. For the four complex ones, use these simplified versions. They are illustrative diagrams, not computed byte by byte: **SHA-256**: message, padding into fixed blocks, many mixing rounds, fixed 64-character digest. **HMAC**: secret key + message, inner hash, key again, outer hash, tag. **DES/3DES**: block split into left and right halves, one half mixed with a round key, swap, repeat (16 rounds), then the 3DES Encrypt-Decrypt-Encrypt chain. **AES**: a 4x4 grid of bytes going through the 4 round steps (SubBytes = swap each byte via a lookup table, ShiftRows = slide the rows, MixColumns = mix each column, AddRoundKey = combine with the key), repeated 10/12/14 times by key size.
- **Lab commands:** on the SHA-256, AES, RSA and Signatures pages, add a small "In the lab" box with the matching Lab 7 commands from Section 7 (PowerShell and Linux) and one line on what students should observe.
- Must-have modes: Caesar key slider, encrypt/decrypt, brute force table. SHA-256 avalanche ("Cyber Security" vs "Cyber security"). Salting with no salt vs random salt vs custom salt. HMAC with the Mallory tampering demo. DES/3DES real encrypt/decrypt plus the 3DES E-D-E diagram. AES key size and mode (GCM/CBC), wrong-key demo. RSA real key generation plus toy RSA with small numbers. Signatures: sign, verify, edit one letter and fail. PKI: the chain check with the 6 scenarios, simulated. Hybrid: the 4-step envelope animation plus a real round trip.
- **Practice:** Activity 1 (choose the right tool), Activity 2 (triage), and the misconceptions cards.
- Light theme only, using the colours and fonts in Section 4. A simple presenter-mode toggle that just makes text bigger.

**Skip**

- Mobbin research, dark theme, presenter names, the Settings drawer, glossary tooltips, the hidden components page.
- Fundamentals F5, F6, F8, F9 (mention their key points in one line on other pages instead).
- The exact, byte-accurate internals (real AES round values, real SHA-256 round values, Simplified DES maths, toy signature maths). Use the simplified "how it works" animations listed under Build instead.
- The ECB picture demo, frequency-analysis chart, rainbow-table attack, speed races, file upload/download modes, OpenSSL file compatibility, Fernet tokens, real PKI signatures.
- Quiz practice, exit check, Lab 7 companion page, recap page.
- Writing our own versions of SHA-256, AES or DES. Use Web Crypto, and crypto-js for DES.

**Build order (4 short phases)**

1. Setup, layout, sidebar, design tokens, and the small crypto helpers. Check: the app runs and every page opens.
2. Home + the 4 fundamentals screens.
3. Techniques T1-T5, then T6-T10.
4. Practice pages, then a quick polish pass: screenshot every page with Playwright, fix anything cut off or broken, and check that HELLO +3 gives KHOOR, CYBER +2 gives EADGT, and SHA-256 of "abc" starts with `ba7816bf`.

Keep the code simple. Prefer working and clear over clever. If something is taking too long, simplify it and note it in `DECISIONS.md`.

## 2. Scope, audience and constraints

The app teaches at the course's level, C3 Apply: students should be able to choose the right technique and use a tool. They do not need to derive the maths. So every page leads with a plain idea and a live demo, and puts the deep internals behind an **Under the hood** toggle.

**Audience and setting**

- Viewers: BSCS 2023-2027 students in their first cryptography course.
- Presenters: our group, one or two members per section, often using a presentation clicker.
- Screen: a classroom projector, usually 1366x768 or 1280x720 with washed-out colours. Laptops should look good too. Phones only need to not break.

**In scope**

| Part | Contents |
| --- | --- |
| Part 1: Fundamentals | 9 animated screens: why cryptography, plaintext to ciphertext, vocabulary, encoding vs encryption vs hashing, key space, "key not algorithm", symmetric vs asymmetric, the key-sharing problem, choosing a technique by security goal |
| Part 2: Techniques | 10 sections, easiest to hardest: Caesar, SHA-256, Salting, HMAC, DES/3DES, AES, RSA, Digital signatures, PKI and certificates, Hybrid cryptography |
| Part 3: Practice | Activity 1, Activity 2, exit check, misconceptions, quiz practice, Lab 7 companion, "five things to remember" recap |
| Presenter tools | Presenter mode, clicker and keyboard control, presenter names per section, light/dark theme |

Encoding/decoding (Base64, hex, binary) is not in the course notes but was requested. It appears only in Fundamentals, to show how it differs from encryption.

**Out of scope**

- Accounts, saving to a server, analytics.
- Real implementations of bcrypt, scrypt, Argon2, ECC or Diffie-Hellman. They may be named in one line where relevant, nothing more.
- Real X.509 certificate parsing. PKI uses a simplified certificate format with real signatures (Section 7, T9).

**Constraints**

- Runs fully in the browser. After the first load it must work with no internet, because classroom Wi-Fi is unreliable. So fonts and libraries are bundled, never loaded from a CDN.
- The browser's built-in Web Crypto API only works on `localhost` or HTTPS. The app must therefore be served, not opened as a file (Section 10).
- Target browsers: latest Chrome and Edge. Firefox should work.
- Animations must run smoothly (about 60 frames per second) on a mid-range laptop. Slow work, such as making RSA-4096 keys or 600,000-round PBKDF2, runs asynchronously with a visible "working..." state so the page never freezes.

## 3. Tech stack and project structure

Use a small, standard stack: Vite + React + TypeScript, Tailwind for styling, Motion for animation, and the browser's own Web Crypto API for the real cryptography. Add no other libraries unless this table lists them.

| Tool | Used for | Notes |
| --- | --- | --- |
| Vite + React + TypeScript | App framework | `npm create vite@latest` with the react-ts template |
| Tailwind CSS | Styling | Colours and fonts come from the design tokens in Section 4 |
| Motion (`motion` package, formerly Framer Motion) | All animations | Layout animations, step transitions, the Caesar wheel spin |
| React Router (`HashRouter`) | Pages | Hash routing works on any static host with no server setup |
| Web Crypto API (`crypto.subtle`, built in) | Real SHA-256, HMAC, PBKDF2, AES-GCM/CBC/CTR, RSA-OAEP, RSA signatures | No install needed |
| `crypto-js` | Real DES and 3DES only | Web Crypto does not support DES |
| `lucide-react` | Icons | Line icons only, no emoji as icons |
| `@fontsource/*` | Fonts | Bundled locally so the app works offline |
| Vitest | Unit tests for the crypto code | Test vectors in Section 10 |

Charts (letter frequency, timing bars, key-space bars) are a small hand-written SVG component. No chart library is needed. State stays simple: React state inside each demo, plus one small context for presenter mode, theme and presenter names (saved in `localStorage`).

**Folder structure**

```
cryptolab/
  PLAN.md  DECISIONS.md  docs/design-notes.md
  src/
    main.tsx  App.tsx  routes.tsx
    styles/tokens.css          design tokens (Section 4)
    content/                   all teaching text, one file per page
      glossary.ts              term -> plain-English definition
    lib/
      encoding.ts              utf8, hex, base64, binary helpers
      bigint.ts                modPow, modInverse (with steps), gcd, isPrime
      crypto/
        webcrypto.ts           thin async wrappers around crypto.subtle
        caesar.ts              encrypt, decrypt, bruteForce, englishScore
        sha256.ts              teaching SHA-256 that returns a step trace
        hmac.ts                teaching HMAC (ipad/opad) with trace
        aes.ts                 teaching AES-128/192/256 with round trace, ECB + CBC
        sdes.ts                Simplified DES with trace (teaching version)
        des.ts                 real DES / 3DES via crypto-js
        rsaToy.ts              small-number RSA with steps
        pki.ts                 simplified certificates + chain checking
        hybrid.ts              session key + RSA-OAEP key wrap + AES-GCM
    components/
      layout/                  AppShell, Sidebar, TopBar, PageHeader, TechniqueLayout
      ui/                      Button, Slider, SegmentedControl, Toggle, TextField, Tabs, Callout, Term
      viz/                     StepPlayer, ByteView, BitGrid, KeyChip, Actor, Channel, CipherWheel, MiniBarChart
      practice/                MultipleChoice, BucketSort, FlipCard, RevealAnswer
    pages/
      Home.tsx
      fundamentals/F1..F9
      techniques/T1-caesar .. T10-hybrid
      practice/P1..P7
  tests/                       one test file per lib/crypto file
```

**Rules for the crypto code**

- Everything in `src/lib/` is plain TypeScript with no React, so it is easy to test.
- Each teaching implementation returns both the result and a `steps` array (a trace). The StepPlayer (Section 5) animates that trace. The animation never computes anything itself; it only shows the trace.
- Each teaching implementation is checked in tests against Web Crypto or a published test vector, so what students see is provably correct.

## 4. Design direction and Mobbin research

The look is **"lab notebook meets terminal"**: warm off-white paper, ink-black text, monospace for data, and one strong colour per category of technique. It must be calm and readable from the back of a classroom, and look made on purpose rather than generic.

**Step 1: Research real app patterns with Mobbin (before building any UI)**

Mobbin is a library of screenshots from real, shipped apps. Its official MCP server lets Claude Code search those screens ([mobbin.com/mcp](https://mobbin.com/mcp)).

1. Setup (the student does this once, before starting Claude Code): run `claude mcp add mobbin --scope user --transport http https://api.mobbin.com/mcp`, start Claude Code, type `/mcp`, choose **mobbin**, then **Authenticate** and sign in. MCP access needs a paid Mobbin plan.
2. If Mobbin is not connected, skip to Step 2 and use this section's spec as is. Do not stall.
3. If connected, search Mobbin for these patterns and study 5-10 screens each:
   - Interactive lesson screens, step-by-step explainers and progress steppers (learning apps such as Brilliant and Duolingo).
   - Developer tool and code playground layouts: input on one side, live output on the other (Vercel, Linear, Stripe docs, Raycast).
   - Segmented controls, sliders, toggles and settings panels.
   - Comparison tables and side-by-side views.
   - Documentation-style side navigation with numbered sections.
   - Terminal and command blocks with copy buttons.
   - Success, error and warning states (for verify passed or failed).
4. Write `docs/design-notes.md`: the 6-10 patterns adopted, which app inspired each, and which of our components uses it. Borrow patterns only. Never copy logos, brand colours, illustrations or whole screens.
5. If a `frontend-design` skill is available in Claude Code, read it before writing UI code.

**Step 2: Avoid the "AI-made" look**

- No purple-to-blue gradients, glowing blobs, glassmorphism or neon "hacker" green-on-black.
- No emoji used as icons, no stock "Secure. Fast. Modern." hero with three identical cards.
- No identical rounded cards with drop shadows everywhere. Use thin 1px lines, clear spacing and alignment instead.
- No filler text, fake statistics or decorative animation. Every animation explains something.

**Step 3: Design tokens** (put these in `src/styles/tokens.css` and wire them into Tailwind)

| Token | Light (default) | Dark | Used for |
| --- | --- | --- | --- |
| paper | `#F7F5F0` | `#0F1114` | Page background |
| panel | `#FFFFFF` | `#171A1F` | Demo panels |
| ink | `#14171C` | `#ECEAE4` | Main text |
| muted | `#5F646C` | `#9AA0A8` | Secondary text |
| line | `#DDD8CE` | `#2A2F36` | Borders, dividers |
| symmetric | `#0F766E` (teal) | `#2DD4BF` | Shared keys, AES, DES, Caesar, HMAC |
| asymmetric | `#C2410C` (burnt orange) | `#FB923C` | Public/private keys, RSA, signatures, PKI |
| keyless | `#4338CA` (indigo) | `#818CF8` | Hashing, salting, encoding |
| ok | `#15803D` | `#4ADE80` | Verified, match |
| bad | `#B91C1C` | `#F87171` | Failed, tampered, attacker |
| highlight | `#FDE68A` | `#854D0E` | The byte or letter being processed right now |

Hybrid uses a split chip: half teal, half orange. Light theme is the default because projectors wash out dark themes. All text must reach at least 4.5:1 contrast (the WCAG AA standard).

**Typography**

- Headings: **Fraunces** (serif, weight 600), for the editorial "notebook" feel.
- Interface and body: **IBM Plex Sans**.
- All data (keys, hex, ciphertext, commands): **IBM Plex Mono**.
- Base size 18px. Presenter mode scales everything by 1.25x. Nothing on screen goes below 14px.

**Cast of characters** (the same on every page, simple flat geometric avatars: a coloured circle with an initial, not cartoons)

| Character | Role | Colour |
| --- | --- | --- |
| Alice | Sender | ink outline |
| Bob | Receiver | ink outline |
| Eve | Eavesdropper: can copy and read traffic, cannot change it | bad, dashed outline |
| Mallory | Active attacker: can change, replace or fake traffic | bad, solid fill |
| CA | Certificate Authority, the trusted vouching body | asymmetric |

**Motion rules**

- Animations explain a process. Each meaningful step is a separate step the presenter controls.
- Durations 250-600ms with ease-out. Data moving along a channel takes about 800ms.
- Respect the operating system's "reduce motion" setting: swap movement for simple fades.

**Layout**

- A left sidebar with numbered sections that collapses in presenter mode. Content is max 1200px wide.
- Technique pages use two columns on wide screens (explanation left, live demo right) and stack on narrow screens.

## 5. App map, shared components and presenter mode

The app is one ordered path: Home, then Part 1, Part 2 and Part 3, so a presenter can click "next" from start to finish. The sidebar also allows jumping anywhere.

**App map (routes)**

```
#/                              Home: title, roadmap, "Start presenting"
#/fundamentals/why              F1  Why cryptography?
#/fundamentals/pipeline         F2  Plaintext -> ciphertext -> plaintext
#/fundamentals/vocabulary       F3  Core vocabulary
#/fundamentals/encoding         F4  Encoding vs encryption vs hashing
#/fundamentals/key-space        F5  Keys, key space and brute force
#/fundamentals/key-not-algo     F6  Security depends on the key, not the algorithm
#/fundamentals/sym-vs-asym      F7  Symmetric vs asymmetric
#/fundamentals/key-sharing      F8  The key-sharing problem
#/fundamentals/goals            F9  Pick the technique by security goal
#/techniques/caesar             T1  Caesar cipher            symmetric   level 1
#/techniques/sha256             T2  SHA-256 hashing          keyless     level 2
#/techniques/salting            T3  Salting passwords        keyless     level 3
#/techniques/hmac               T4  HMAC                     symmetric   level 4
#/techniques/des                T5  DES and 3DES             symmetric   level 5
#/techniques/aes                T6  AES                      symmetric   level 6
#/techniques/rsa                T7  RSA                      asymmetric  level 7
#/techniques/signatures         T8  Digital signatures       asymmetric  level 8
#/techniques/pki                T9  PKI and certificates     asymmetric  level 9
#/techniques/hybrid             T10 Hybrid cryptography      hybrid      level 10
#/practice/choose-tool          P1  Activity 1: choose the right tool
#/practice/triage               P2  Activity 2: cryptographic triage
#/practice/exit-check           P3  Exit check
#/practice/misconceptions       P4  Misconceptions
#/practice/quiz                 P5  Quiz practice
#/practice/lab                  P6  Lab 7 companion
#/practice/recap                P7  Five things to remember
```

The Home page shows the course roadmap from the slides as a horizontal line: Fundamentals, Symmetric, Asymmetric, Hash/HMAC, Signatures/PKI, Practical. Each stop links to its section. Each sidebar item shows its category colour chip and level (1-10).

**Technique page template** (every T page uses `TechniqueLayout` with these tabs; a tab is hidden when it does not apply)

1. **Idea**: a one-sentence plain explanation, an everyday analogy, the **Course says** facts, and category, level and security-goal badges.
2. **Try it**: the live playground. Inputs and modes on the left, output updating as you type on the right.
3. **Step by step**: the StepPlayer animation of how it works inside.
4. **Break it**: an attack demo showing where it fails or why it holds.
5. **In the lab**: the matching Lab 7 commands, plus an in-browser mirror of the lab step.

Every tab has a **Reset demo** button that restores the defaults.

**Shared components**

| Component | What it does |
| --- | --- |
| `StepPlayer` | The heart of the app. Takes a list of steps (title, caption, state) and a render function. Controls: back to start, previous, play/pause, next, end, speed 0.5x/1x/2x, progress dots. The current step's caption shows in large text under the visual. |
| `ByteView` | Shows bytes as text, hex, Base64 or binary (switchable). Can highlight given positions, such as changed bytes or the byte being processed. |
| `BitGrid` | A 16x16 grid of 256 cells for hash bits. Compare mode highlights bits that differ and shows "X of 256 bits changed (Y%)". |
| `KeyChip` | A key drawn as a chip. Shared key = teal, public key = orange outline with an open padlock, private key = solid orange with a key icon. Shows a short fingerprint (first 8 hex characters). |
| `Actor` | Alice, Bob, Eve, Mallory and CA avatars (Section 4). |
| `Channel` | The "network" line between two actors. A packet travels across it. Eve can tap it (her copy appears in her notebook). Mallory can intercept and change it. |
| `CipherWheel` | Two rotating SVG alphabet rings, used by Caesar. |
| `MiniBarChart` | Small SVG bar chart: letter frequency, timing comparisons, log-scale key space. |
| `CodeBlock` | Monospace command block with a copy button and Windows PowerShell / Linux-macOS tabs. |
| `Callout` | Four styles: **Course says**, **Common misconception**, **Teaching version - not secure**, **Under the hood** (collapsible). |
| `Term` | A dotted-underlined word. Hover or tap shows its plain-English definition from `glossary.ts` (for example IV, nonce, block, padding, modulus, digest). |
| Controls | `SegmentedControl`, `Slider` with a number box, `Toggle`, `TextField` with a character counter, `RandomButton` (dice icon that creates a random key, salt or IV). |
| Practice parts | `MultipleChoice`, `BucketSort` (drag cards into buckets, with click-to-place as a fallback), `FlipCard`, `RevealAnswer`. |

**Presenter mode** (toggle with the `P` key or the top-bar button)

- Text scales 1.25x, the sidebar collapses, step captions get larger, and only the active tab's demo shows.
- Keyboard and clicker: `Right arrow` / `Page Down` = next animation step. On the last step it moves to the next page. `Left arrow` / `Page Up` = previous. `Space` = play/pause, `R` = reset, `F` = fullscreen, `Shift + arrows` = jump a whole page. Presentation clickers send Page Up/Page Down, so a clicker works out of the box.
- The keyboard shortcuts are ignored while typing in an input box.
- A small "Presenting: \<name>" chip shows in the corner. Names per section are set in a Settings drawer and saved in `localStorage`.
- The Settings drawer also has: theme (light/dark), reduce motion, "reset all demos".
- The top bar shows a page counter, such as "12 / 27".

## 6. Part 1: Fundamentals (9 animated screens)

Each fundamentals screen is one big animated scene driven by the StepPlayer, with one or two controls the class can play with. Caesar (shift 3) is the running example because everyone can follow it.

### F1. Why cryptography?

- **Course says:** you must send exam results over an untrusted network that an attacker can copy. The property needed is confidentiality.
- **Scene:** Alice (teacher's office) on the left, Bob (student portal) on the right, a `Channel` between them, Eve below the line with a tap on it. The packet reads "Result: 82".
- **Steps:** (1) Alice sends the readable packet. (2) Eve's copy appears in her notebook, fully readable. (3) A question card: "Which security property do we need?" with options Confidentiality / Integrity / Availability. Click to reveal Confidentiality. (4) The encryption toggle turns on: the packet turns into scrambled ciphertext, Eve's copy is unreadable, and Bob decrypts it with the key.
- **Controls:** encryption on/off toggle, editable message text.
- **Key message:** encryption hides the meaning, not the existence, of a message. Eve still sees that *a* packet was sent.

### F2. Plaintext to ciphertext and back (Board 1 from the notes)

- **Scene:** a pipeline of boxes: Plaintext + Algorithm + Key -> Encrypt -> Ciphertext -> Decrypt (+ key) -> Plaintext. Each box lights up in turn while stepping.
- **Controls:** plaintext input, algorithm choice (Caesar or AES-GCM), key input. The ciphertext updates live.
- **"Try the wrong key" button:** with Caesar the result is gibberish; with AES-GCM the box shows "Decryption failed: wrong key or changed data".

### F3. Core vocabulary

- Six cards: Plaintext, Ciphertext, Algorithm, Key, Key space, Cryptanalysis. Each opens a short animation using the same Caesar example.
- Plaintext "HELLO" -> Ciphertext "KHOOR" -> Algorithm "shift every letter forward" -> Key "3" -> Key space "25 useful shifts" (25 small tiles) -> Cryptanalysis (Eve tries all 25 tiles and finds HELLO).
- Plain definitions on each card come from the notes' vocabulary slide.

### F4. Encoding vs encryption vs hashing

- **Scene:** the same input text flows into three lanes side by side.
  - **Encoding** (choose Base64, hex, binary or URL encoding): no key. Anyone can decode it. Its purpose is formatting data for transport, not secrecy.
  - **Encryption** (AES-GCM): needs a key. Only key holders can decrypt.
  - **Hashing** (SHA-256): no key and one way only. Output is always 64 hex characters.
- **Steps:** Eve tries to read all three. She succeeds on encoding ("Decode" works for anyone), fails on encryption without the key, and fails on hashing (the "Reverse" button shakes: "Not possible. You can only guess and compare.").
- **Summary table:** Needs a key? Can be reversed? Purpose? Example.
- **Misconception callouts:** "Base64 is encryption" (No) and the course's "Hashing is another form of encryption" (No, hashing is one way and is never decrypted).

### F5. Keys, key space and brute force

- **Controls:** key length slider from 1 to 256 bits, with presets: Caesar (25 keys, about 4.6 bits), DES (56), AES-128, AES-192, AES-256. Guess speed: 1 thousand, 1 billion or 1 trillion guesses per second.
- **Output:** number of possible keys (2^n, in scientific notation and in words) and the worst-case time to try them all, in human units. For huge values, compare to the age of the universe (about 13.8 billion years). Use `BigInt` for this maths.
- **Animation:** a grid of locks being tried. For Caesar it visibly finishes in under a second. For AES the progress bar stays at 0.000000%.
- **Course says:** a longer key is only one part of secure implementation.

### F6. Security depends on the key, not on hiding the algorithm

- **Two panels from the slide:** Weak mindset ("Nobody knows our secret algorithm, so it must be safe") vs Modern mindset (the algorithm is public and reviewed; only the key is secret).
- **Steps:** a secret homemade algorithm leaks (a card slides to Eve), and every past message becomes readable. Then AES: its full design is public on screen, yet Eve still cannot read without the key.
- **Callout:** distrust "unbreakable because secret" claims.

### F7. Symmetric vs asymmetric

- **Symmetric scene:** Alice and Bob each hold the same teal key. Alice locks a box, sends it, and Bob unlocks it with his copy of the key (the notes' "locked box with one shared key" analogy). Strengths: fast, good for bulk data. Main challenge: sharing the key safely. Examples: AES, historically DES/3DES.
- **Asymmetric scene:** Bob hands out open orange padlocks (his public key) to everyone, Eve included. Alice snaps one shut on her box. Only Bob's private key opens it. Uses: key exchange, signatures, identity. Slower.
- **Comparison table** (from slide 17): keys, speed, bulk data, key distribution, examples, common role. Hovering a row highlights the matching part of each scene.
- **Speed teaser:** real timing in the browser of AES-GCM vs RSA-OAEP encrypting the same 100 KB, shown as two bars. The full race is in T10.

### F8. The key-sharing problem

- **Course says:** if the shared key K is simply sent as plaintext, the confidentiality problem comes back. This is what motivates public-key techniques and hybrid systems.
- **Steps:** (1) Alice has K and Bob needs it. (2) Alice sends K in the open; Eve copies it. (3) Eve now decrypts every later message. (4) Preview of the fix: Bob sends his public padlock, Alice locks K with it, and Eve's copy is useless. A "See the full version" link goes to T10.

### F9. Pick the technique by security goal

- **Interactive map** (from slide 28): goals on the left, techniques on the right. Clicking a goal draws a line to its technique and offers a link to that page.

| Security goal | Technique |
| --- | --- |
| Confidentiality of a large file | AES / symmetric encryption |
| Integrity fingerprint | SHA-256 hash |
| Keyed integrity | HMAC |
| Origin + integrity | Digital signature |
| Linking an identity to a public key | Certificate / PKI |
| Protecting a symmetric key in transit | Public-key / key-exchange mechanism |

- Above the map, plain one-line definitions of confidentiality, integrity, authenticity and non-repudiation.

## 7. Part 2: The 10 techniques

Each technique gets its own page built on the template in Section 5 (Idea, Try it, Step by step, Break it, In the lab), ordered from easiest to hardest. Every output is computed for real.

### T1. Caesar cipher (symmetric, classical, level 1)

- **Course says:** shift each letter by a fixed amount. HELLO with shift +3 = KHOOR. The shift amount is the key. Not secure today: the key space is tiny and language patterns are obvious. Class activity: CYBER with shift +2 = EADGT.
- **Try it:** text input. Key slider 0-25 plus a number box (negative or large numbers wrap round with mod 26). Mode: Encrypt / Decrypt. Options: keep spaces and punctuation, keep upper/lower case. Presets: "HELLO +3", "CYBER +2", ROT13.
- **Visuals:** (a) `CipherWheel`: the outer ring is the plain alphabet and the inner ring the cipher alphabet, which spins to the key with a spring animation. Dragging the inner ring changes the key. (b) The alphabet strip from the slide (A-Z above, shifted A-Z below), with the current letter highlighted in both rows.
- **Step by step:** letter by letter. Highlight H, show its position (H = 7), add the key (7 + 3 = 10), show the result (10 = K). Formula: C = (P + k) mod 26. Include one wrap-round example (X + 3 = A).
- **Break it:** (1) Brute force: a table of all 25 shifts, filled in with animation, each row scored for how English-like it looks (a chi-squared score against English letter frequencies). The best row is highlighted. (2) Frequency analysis: a bar chart of the ciphertext's letter counts next to normal English frequencies, with a slider that shifts the English bars until they line up, revealing the key. Use a longer, original sample paragraph (for example about exam results) so the frequencies are meaningful.
- **In the lab:** no lab command. Show the class activity instead: encrypt CYBER with +2, swap with another group, decrypt, then discuss why it fails against a determined attacker.

### T2. SHA-256 hashing (keyless, level 2)

- **Course says:** one way, fixed-size 256-bit output (64 hex characters). Same input gives the same digest. A small change gives a very different digest (the avalanche effect). Not designed to be decrypted. Used for integrity checking. A plain hash alone does not prove who created the data. Trust in the published hash matters.
- **Try it:** text input, or drag and drop any file (hashed in the browser; show name, size and digest). Output as hex, Base64 or binary. Updates as you type. A length meter shows that the input grows while the output stays 64 characters.
- **Avalanche demo:** two inputs side by side, defaulting to the slide's "Cyber Security" vs "Cyber security". Two `BitGrid`s plus a difference grid, with a counter such as "131 of 256 bits changed (51%)". A "Change one character" button edits input B at random.
- **Integrity workflow (slide 22, 4 steps):** (1) publisher hashes the original and posts the digest, (2) student downloads the file, (3) student hashes the local copy, (4) compare. Toggles: "Tamper with the file in transit" (mismatch, red cross) and "Attacker replaces both file and hash" (they match but the file is fake; a warning explains why, linking to HMAC and signatures).
- **Step by step (Under the hood, optional):** using the teaching `sha256.ts` trace: text to bytes, padding to 512-bit blocks (show the 1 bit, the zeros and the 64-bit length), the message schedule W0-W63, the 64 rounds updating working values a-h (animate the first 3 rounds, then fast-forward), and adding into H0-H7 to form the digest. Label it "you do not need to memorise this".
- **Break it:** a "Reverse this hash" button explains that it cannot be reversed; the only attack is guessing inputs and comparing, which leads into T3.
- **In the lab (Part A):** `Get-FileHash .\message.txt -Algorithm SHA256` (PowerShell) and `sha256sum message.txt` (Linux/macOS), for both message.txt and message\_modified.txt. In-browser mirror: buttons that create and download those two sample files (one character apart) and show both hashes.

### T3. Salting passwords (keyless, level 3)

- **Course says:** a salt is random data combined with a password before a password-hashing or KDF (key-derivation function) step. It stops identical passwords from producing identical stored values and makes precomputed attacks less useful. Plain SHA-256 alone is not best practice for passwords; use a dedicated password KDF.
- **Try it: a mini user database.** Add users (name + password). A table shows username, salt and stored value. Defaults: Ali and Sara, both with the slide's password SAMEPASS.
- **Modes:** (1) No salt + SHA-256: identical rows are highlighted. (2) Salt + SHA-256. (3) Salt + PBKDF2-SHA256 with an iteration slider (1; 1,000; 100,000; 600,000), showing the measured time per hash.
- **Salt controls:** random salt (regenerate button) or custom salt text. Salt length 8, 16 or 32 bytes.
- **Step by step:** sign-up: password + salt, combine, KDF, store salt and result. Login: user types a password, the system looks up the salt, recomputes and compares.
- **Break it:** (1) Precomputed-table attack: the attacker has a list of 20 common passwords and their unsalted SHA-256 values. The database leaks: unsalted rows are cracked instantly; salted rows show "no match in table". (2) Guessing speed: measured guesses per second for SHA-256 vs PBKDF2, and the time to try 10,000 common passwords against each.
- **Note:** real systems also use bcrypt, scrypt or Argon2 (one line, names only). PBKDF2 is used here because the browser supports it.

### T4. HMAC (symmetric, keyed hash, level 4)

- **Course says:** a plain hash detects change, but an attacker who can replace both the message and the hash can just recompute the hash. HMAC combines a secret key with hashing to give keyed integrity and authentication. The key is shared only by trusted parties.
- **Try it:** message + secret key (typed text or random hex) gives a live HMAC-SHA256 tag. A verify panel: the receiver's key, the received message and the received tag show a pass or fail.
- **Main animation: the tampering attack.** Alice sends "Pay Rs 1,000 to Bob". Mallory intercepts and changes it to "Pay Rs 9,000 to Mallory".
  - Mode A, plain SHA-256: Mallory recomputes the hash and Bob's check passes (bad).
  - Mode B, HMAC: Mallory cannot make a valid tag without the key and Bob's check fails (good).
  - Toggle "Mallory knows the key": the check passes again, showing that the key's secrecy is the whole point.
- **Step by step (Under the hood):** HMAC = H((K XOR opad) joined with H((K XOR ipad) joined with message)), drawn as two stages: pad the key to 64 bytes, XOR with ipad (0x36), inner hash, XOR with opad (0x5c), outer hash.
- **Compare card:** plain hash vs HMAC vs digital signature: who can create it, who can check it, what it proves.

### T5. DES and 3DES (symmetric, historical, level 5)

- **Course says:** DES and 3DES are historical symmetric ciphers. AES is the modern replacement for DES.
- **Idea:** DES encrypts 64-bit blocks with a 56-bit effective key through 16 rounds of a Feistel network (split the block in half, mix one half with a round key, swap, repeat). 3DES runs DES three times (Encrypt-Decrypt-Encrypt with keys K1, K2, K3) to make the key effectively longer.
- **Try it (real, via crypto-js):** plaintext, key in hex (8 bytes for DES, 24 for 3DES), mode ECB or CBC, IV for CBC, output in hex or Base64, plus decrypt. Show the DES weakness label: "56-bit key: broken by brute force".
- **Step by step (teaching version):** a Feistel animation using **Simplified DES** (8-bit block, 10-bit key, 2 rounds), clearly labelled as a teaching version. Show the key schedule (P10, left shift, P8 giving K1 and K2), the initial permutation, the split into left and right halves, the round function with K1, XOR, swap, round 2 with K2, and the final permutation. Then show decryption is the same process with the keys in reverse order, which is the key insight of Feistel ciphers. End with a zoom-out: real DES has the same shape with 16 rounds on 64 bits.
- **3DES animation:** block -> Encrypt(K1) -> Decrypt(K2) -> Encrypt(K3) -> ciphertext. Note that if K1 = K2 = K3 it collapses to plain DES, which kept it compatible with old systems.
- **Break it:** key-space bars (DES 2^56 vs AES-128 2^128, log scale). A timeline: DES standard (1977), the EFF "Deep Crack" machine finds a DES key in 56 hours (1998), 3DES used as a stopgap, AES standard published (2001), NIST retires 3DES for new encryption (after 2023).

### T6. AES (symmetric, level 6)

- **Course says:** symmetric block cipher, 128-bit block size, key sizes 128, 192 or 256 bits. Widely deployed, efficient for bulk encryption, the modern replacement for DES. A longer key is only one part of secure implementation. Students do not need to reproduce every internal round; the focus is choosing and using an AES tool correctly.
- **Try it:** plaintext. Key size 128 / 192 / 256. Key: generate random, type hex, or derive from a password (PBKDF2). Mode: GCM (default, recommended), CBC, CTR, or ECB (teaching only, with a warning). IV/nonce shown with a regenerate button. Output in Base64 or hex. A decrypt panel.
- **Wrong key and tampering:** decrypt with the wrong key. A "Flip one ciphertext byte" button: GCM refuses ("authentication failed: data was changed"); CBC returns a garbled block.
- **Picture demo (ECB vs CBC):** draw an original simple picture on a canvas (for example a large padlock with the word EXAM, about 128x128 pixels). Encrypt its pixel bytes with ECB and with CBC and show three images side by side. The ECB image still shows the outline; the CBC image looks like random noise. Lesson: identical input blocks give identical output blocks in ECB. Web Crypto has no ECB, so use the teaching `aes.ts` for this demo.
- **Block view:** a long message split into 16-byte blocks, with the padding (PKCS#7) in the last block highlighted.
- **Step by step (Under the hood, optional):** a 4x4 grid of state bytes. Key expansion, then the first AddRoundKey, then each round: SubBytes (each byte looked up in the S-box, with the S-box table highlighting the lookup), ShiftRows (rows slide left by 0, 1, 2, 3), MixColumns (one column at a time highlighted), AddRoundKey (XOR with that round's key grid). The last round skips MixColumns. 10, 12 or 14 rounds depending on key size. The default preset is the official FIPS-197 test vector, so the class sees the known correct answer appear.
- **In the lab (Part B):** the lab runs `python symmetric_demo.py`, using Python's `cryptography.Fernet`. Show a short typical Fernet snippet (generate a key, encrypt, decrypt) and explain that Fernet is AES-128 in CBC mode plus an HMAC-SHA256 tag. In-browser mirror: generate key, then ciphertext, then recovered plaintext; and "Lose the key" shows that recovery is impossible from the ciphertext alone.
- **Stretch goal (only after everything else is done):** produce real Fernet tokens (version byte, timestamp, IV, ciphertext, HMAC, all Base64url) so a token made in the browser can be decrypted by the lab's Python.

### T7. RSA (asymmetric, level 7)

- **Course says:** a public/private key pair. The public key can be shared; the private key stays secret. Encrypt with the recipient's public key, decrypt with the recipient's private key. Based on number theory. Generally slower than AES, so real systems use hybrids. Students should know the key roles, why the private key must stay secret, and how to generate keys with tools. They do not derive the maths by hand.
- **Story animation:** Bob generates a key pair, then publishes his public key (padlock copies fly to Alice and to Eve). Alice locks her message. Eve tries to open it with the public key and fails. Bob opens it with his private key.
- **Try it, Real mode (Web Crypto RSA-OAEP with SHA-256):** key size 1024 (labelled demo only) / 2048 / 4096. Generate with a spinner and show the time taken. Show the public key in PEM format; blur the private key until "Reveal" is clicked. Encrypt a short message with Bob's public key and decrypt with his private key. Extras:
  - Encrypt the same message twice and get different ciphertexts (random padding).
  - Generate an "Eve key pair" and try to decrypt with it: it fails.
  - Size limit: show the maximum message size (190 bytes for 2048-bit OAEP-SHA256). Going over shows a clear error with the lesson "this is why we use hybrid encryption" and a link to T10.
  - Download the keys as `private_key.pem` and `public_key.pem` so they also work with OpenSSL.
- **Try it, Toy mode (Teaching version - not secure):** pick small primes p and q (a dropdown or custom input with a prime check). Show n = p x q, phi = (p-1)(q-1), choose e (suggest a valid one), and compute d with a step table of the extended Euclidean algorithm. Encrypt a number m smaller than n: c = m^e mod n. Decrypt: m = c^d mod n. Default: p = 61, q = 53, e = 17, giving n = 3233, phi = 3120, d = 2753; m = 65 encrypts to c = 2790. Text mode encrypts each letter's code separately, and a warning shows that equal letters give equal numbers.
- **Break it:** "Factoring is hard". The toy n is factored instantly by trial division (show it). A slider for the number of digits in n shows trial-division time exploding. A real 2048-bit n is shown in full (617 digits) with "not feasible". A "Private key leaked" scenario shows that everything becomes readable.
- **In the lab (Part C):** `openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048` and `openssl pkey -in private_key.pem -pubout -out public_key.pem`. Label private\_key.pem "keep secret, protect access" and public\_key.pem "may be distributed".

### T8. Digital signatures (asymmetric, level 8)

- **Course says:** hash the message, sign the hash with the sender's private key, and the recipient verifies with the sender's public key. Provides authenticity, integrity and non-repudiation. Does not provide confidentiality. Encryption answers "who can read it?"; a signature answers "who signed it, and was it changed?"
- **4-step animation (slide 25):** (1) Hash: message to digest. (2) Sign: digest + Alice's private key gives the signature. (3) Send: message and signature travel. Eve can read the message, which shows signing does not hide it. (4) Verify: Bob uses Alice's public key and recomputes the hash; it matches. Then a branch: Mallory edits one line, and verification fails (this is Activity 2's second question).
- **Try it:** generate Alice's key pair, type a message, Sign (show the signature in Base64; 256 bytes for 2048-bit keys). Verify panel: editable message, the signature, and a public key choice (Alice's or Mallory's), giving "Valid" or "Invalid" with a plain reason. Algorithm: RSASSA-PKCS1-v1\_5 with SHA-256, which matches what `openssl dgst -sha256 -sign` makes. An optional RSA-PSS toggle.
- **File mode, compatible with the lab:** drop a file (for example a result PDF), sign it, and download `signature.bin`. Or verify: upload a file, a `signature.bin` and a `public_key.pem` made by the lab's OpenSSL commands, and the app verifies them for real.
- **Under the hood:** with toy RSA keys, s = h^d mod n and the check h = s^e mod n (h reduced mod n), shown with small numbers.
- **Compare card (slide 26):** Encryption vs Digital signature: the question each answers, the goal, which keys are used, the output. "Secure systems often use both."
- **In the lab (Part D):** `openssl dgst -sha256 -sign private_key.pem -out signature.bin message.txt`, then `openssl dgst -sha256 -verify public_key.pem -signature signature.bin message.txt`, then edit the message and verify again. Expected: the original verifies; the modified file fails.

### T9. PKI and certificates (asymmetric trust system, level 9)

- **Course says:** a certificate links an identity to a public key and is vouched for by a trust system of Certificate Authorities (CAs). The CA issues and signs the certificate. A certificate holds the identity, the public key and the issuer's information. The browser validates the trust chain and the certificate details. This is the foundation of HTTPS/TLS trust (Week 2).
- **Problem animation:** Mallory publishes her own public key labelled "Bob". Alice encrypts to it and Mallory reads everything. Lesson: we need a trusted way to know whose key is whose.
- **Try it: certificate chain simulator** (simplified format with real signatures from Web Crypto). Make three key pairs: "CryptoLab Root CA" (in the browser's trust store), "CryptoLab Intermediate CA" and the website "portal.example.edu". Each certificate is a card with Subject, Issuer, Public key fingerprint, Valid from and to, Serial number, and Signature by the issuer over the other fields. Label it "Simplified; real certificates use the X.509 format."
- **Browser check animation:** domain name matches? Dates valid? Website certificate's signature verifies with the intermediate's public key? Intermediate's signature verifies with the root's public key? Root in the trust store? All yes: a padlock appears.
- **Scenario switcher:** Valid, Expired, Wrong domain, Self-signed, Unknown CA (not in the trust store), Tampered (Mallory edits the subject after signing, so the signature check fails). Each failure shows our own generic warning screen in plain words, such as "Warning: this site's identity could not be checked", not a copy of a real browser's screen.
- **Real-world tie-in:** a short guide: open any HTTPS website, click the padlock, and view its certificate and chain.

### T10. Hybrid cryptography (symmetric + asymmetric, level 10)

- **Course says:** (1) generate a fast symmetric session key, (2) protect that key with a public-key mechanism, (3) encrypt the data with a symmetric algorithm, (4) transmit. Use the expensive public-key operation for a small key and efficient symmetric encryption for the bulk data. AES and RSA are not competitors; they are combined.
- **Envelope animation:** the data is locked in a teal box (AES). The teal key goes into a small box locked with Bob's orange padlock (RSA). Both travel. Eve copies both but cannot open the small box, so she never gets the teal key. Bob opens the small box with his private key, takes the teal key and opens the data.
- **Try it (all real, Web Crypto):** input a message or a file up to 20 MB. Bob's RSA key pair is generated on the page. Run: make an AES-256-GCM session key, encrypt the data, wrap the session key with RSA-OAEP, and show the package as a `ByteView` with sizes (wrapped key 256 bytes, IV 12 bytes, ciphertext N bytes). Then Bob unwraps and decrypts.
- **Speed race:** encrypt the same data (100 KB up to 5 MB) two ways: RSA only (cut into 190-byte pieces) vs hybrid. Show real measured times as bars and the number of RSA pieces needed. Cap RSA-only at 1 MB and estimate larger sizes from that, labelled "estimated".
- **Tie-in:** HTTPS uses the same idea: a public-key step to agree on a key, then fast symmetric encryption. One line of accuracy: modern TLS 1.3 agrees on the key with Diffie-Hellman rather than sending it inside RSA, but the idea is the same.
- **Assignment link:** this page is the model answer shape for the assignment's "Explain a hybrid cryptographic design" question.

## 8. Part 3: Practice (activities, quiz and lab)

The practice pages turn the course's own activities and assessments into interactive class exercises. Answers stay hidden until the presenter clicks **Reveal**. Nothing is saved or graded on a server.

### P1. Activity 1: choose the right tool

- `BucketSort` with four scenario cards and four buckets: AES, Public-key mechanism, Hash, Digital signature.
- Scenarios: protecting a 10 GB backup stored on a laptop; verifying that a software update truly came from the vendor; checking whether a downloaded ISO file was altered; protecting a short session key sent to a remote recipient.
- Each card has an optional one-line "justify your choice" box, since the notes ask groups to justify in one sentence.
- Reveal: bulk encryption = AES; origin check = digital signature; file-change check = hash; protecting a session key = public-key mechanism. Each answer links to its technique page.

### P2. Activity 2: cryptographic triage

| Evidence | Expected answer |
| --- | --- |
| A file hash no longer matches the trusted value. Which security property is in doubt? | Integrity |
| A signature check fails after one line of the document is edited. Why? | Changed content invalidates the signature |
| Two users choose the same password but should not have identical stored values. What should the system add? | A unique salt |
| A company wants a check value that only parties with a shared secret can recompute. Which concept fits? | HMAC |

Each row is a `MultipleChoice` with four options and a reveal that links to the matching demo.

### P3. Exit check (end of Theory 1)

Three scenarios, each with the answer revealed on click: encrypting a large backup (symmetric / AES), sending a secret to someone you have never met (asymmetric / public key), verifying who signed a document (digital signature).

### P4. Misconceptions

`FlipCard`s. The front shows the myth, the back shows "No" and the correction:

- "Hashing is another form of encryption." Hashing is one way and is never decrypted.
- "The public key must be secret." Public keys are meant to be shared; the private key needs protection.
- "A digital signature hides the message." Its job is authenticity and integrity, not confidentiality.
- "AES and RSA are direct competitors." They solve different problems and are usually combined.
- "RSA is best for huge files." Symmetric encryption is the bulk-data choice.
- "A custom secret algorithm is safer." Peer-reviewed, standard algorithms with secret keys are preferred.
- "Base64 encoding is encryption." Anyone can decode it; there is no key (from F4).

### P5. Quiz practice

Ten multiple-choice questions, two for each topic in the course's formative quiz: choosing a technique for bulk encryption; applying SHA-256 to an integrity check; assigning public/private key roles; predicting signature verification after a change; the purpose of salting. Write the questions as new scenarios, not definitions, because the course is at the "Apply" level. Show a score at the end, with "Try again".

### P6. Lab 7 companion

- The 7-step lab workflow as a checklist: hash the original file, change one character, hash again, encrypt/decrypt text, generate RSA keys, sign the original file, verify then modify then verify again.
- One card per lab part (A: SHA-256, B: symmetric with Fernet, C: RSA key pair, D: sign and verify). Each card has the commands in a `CodeBlock` with PowerShell and Linux tabs, the expected observation, a "Try it in the browser" link to the matching T page, and a fill-in template for the one-sentence security interpretation the lab asks for.
- "Download practice files" buttons for message.txt and message\_modified.txt.
- Note from the slides: no special lab network is needed; everything runs locally.
- The lab rubric (20 marks) as a small table: SHA-256 integrity 4, symmetric encryption/decryption 5, RSA key generation 4, signature verification 5, reflection/report 2.

### P7. Five things to remember (closing page)

A calm final page from slide 43, one line each with a link back to the page that taught it:

1. Encryption protects confidentiality.
2. AES is efficient symmetric bulk encryption.
3. Public/private keys solve key-management and identity problems.
4. Hash vs HMAC: integrity fingerprint vs keyed integrity.
5. Digital signature: origin + integrity, verified with the public key.

## 9. Build phases

Build in 9 phases, in this order. A phase is finished only when every "Done when" item is true. The crypto engine and shared components come first, so every page after them is mostly assembling tested parts.

1. **Phase 0: Setup and design research**
   - Scaffold Vite + React + TypeScript; add Tailwind, Motion, React Router, lucide-react, fontsource fonts, Vitest.
   - Run the Mobbin research (Section 4) and write `docs/design-notes.md`. Create `tokens.css` and the light and dark themes.
   - Build `AppShell`, `Sidebar`, `TopBar` and every route from Section 5 as a placeholder page.
   - **Done when:** `npm run dev` shows the shell, every route opens, the theme toggle works, and the design notes exist.
2. **Phase 1: Crypto engine and tests**
   - Write `encoding.ts`, `bigint.ts`, `webcrypto.ts`, `caesar.ts`, `sha256.ts`, `hmac.ts`, `aes.ts` (ECB + CBC, with round trace), `sdes.ts`, `des.ts`, `rsaToy.ts`, `pki.ts`, `hybrid.ts`.
   - **Done when:** `npm test` passes, including every test vector in Section 10 and the cross-checks against Web Crypto.
3. **Phase 2: Shared components and presenter mode**
   - Build every component in the Section 5 table, then presenter mode, keyboard and clicker controls, the Settings drawer and `glossary.ts`.
   - Add a hidden `#/dev/components` page showing each component with sample data.
   - **Done when:** the StepPlayer works by mouse and keyboard, Page Down moves to the next step and then the next page, and presenter mode is readable at 1366x768.
4. **Phase 3: Home and Part 1 (F1-F9)**
   - **Done when:** each screen's animation steps forward and back, the controls change the result live, and the text matches the notes.
5. **Phase 4: T1-T4 (Caesar, SHA-256, Salting, HMAC)**
   - **Done when:** every mode, preset and attack demo in Section 7 works; HELLO +3 shows KHOOR; the avalanche counter shows about 50%; file hashing works.
6. **Phase 5: T5-T6 (DES/3DES, AES)**
   - **Done when:** the S-DES and AES round animations match their traces, the FIPS-197 preset shows the expected output, the ECB picture demo shows the outline, and the GCM tamper test fails as expected.
7. **Phase 6: T7-T8 (RSA, signatures)**
   - **Done when:** real keys generate without freezing the page, the toy RSA defaults give the values in Section 10, downloaded PEM keys load in OpenSSL, and an OpenSSL-made `signature.bin` verifies in the app.
8. **Phase 7: T9-T10 (PKI, hybrid) and Part 3 (P1-P7)**
   - **Done when:** all six PKI scenarios give the right result, the hybrid round trip works on a 20 MB file, and every activity reveals the answers listed in Section 8.
9. **Phase 8: Polish, QA and handover**
   - Run the QA checklist in Section 10, fix everything it finds, and write a short `README.md`: how to run it, how to present with it, keyboard shortcuts.
   - **Done when:** the whole QA checklist passes and `npm run build` succeeds with no errors.

## 10. Testing, QA and running it in class

The app counts as correct when its crypto code passes the known-answer tests below, it passes the manual checklist on a projector-sized screen, and it runs from the presenting laptop with no internet.

**Known-answer tests** (each must be a Vitest case; all values below were checked by computing them)

| What | Input | Expected output |
| --- | --- | --- |
| Caesar | HELLO, key 3 | KHOOR |
| Caesar | CYBER, key 2 | EADGT |
| SHA-256 | "abc" | `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` |
| SHA-256 | "" (empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| HMAC-SHA256 (RFC 4231, test 2) | key "Jefe", data "what do ya want for nothing?" | `5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843` |
| AES-128 (FIPS-197) | key `000102...0f`, block `00112233445566778899aabbccddeeff` | `69c4e0d86a7b0430d8cdb78070b4c55a` |
| AES-192 (FIPS-197) | key `000102...17`, same block | `dda97ca4864cdfe06eaf70a0ec0d7191` |
| AES-256 (FIPS-197) | key `000102...1f`, same block | `8ea2b7ca516745bfeafc49904b496089` |
| DES | key `133457799BBCDFF1`, block `0123456789ABCDEF` | `85E813540F0AB405` |
| Toy RSA | p 61, q 53, e 17, m 65 | n 3233, phi 3120, d 2753, c 2790, decrypts back to 65 |
| RSA-OAEP 2048, SHA-256 | message size limit | 190 bytes |

**Cross-checks** (100 random inputs each): teaching `sha256.ts` equals `crypto.subtle.digest`; teaching `hmac.ts` equals Web Crypto HMAC; teaching `aes.ts` in CBC mode equals Web Crypto AES-CBC; every cipher decrypts back to the original; S-DES round-trips all 256 blocks for at least 10 keys and matches a published worked example (cite it in a test comment).

**Manual QA checklist** (if browser automation such as Playwright or Chrome tools is available in Claude Code, use it to screenshot every page at 1366x768 and check them)

- [ ] Every page: no console errors, Reset works, the StepPlayer works by mouse, keyboard and Page Up/Page Down.
- [ ] Presenter mode at 1366x768: nothing cut off, no text under 14px, captions readable from a distance.
- [ ] Light and dark themes both meet 4.5:1 text contrast.
- [ ] Reduce-motion setting swaps movement for fades.
- [ ] Slow tasks (RSA-4096 keys, PBKDF2 at 600,000 rounds, 20 MB hybrid) show a working state and never freeze the page.
- [ ] Typing in any input box never triggers a keyboard shortcut.
- [ ] Every "Course says" line matches Sections 6-8 of this plan.
- [ ] Every teaching-only demo shows the "Teaching version - not secure" label.
- [ ] With Wi-Fi off after loading, every page still works (fonts and libraries are bundled).
- [ ] Works in the latest Chrome and Edge; spot-check Firefox.
- [ ] Keys downloaded from T7 work with the lab's OpenSSL commands, and an OpenSSL signature verifies in T8.

**Running it in class**

- On the presenting laptop: `npm install`, `npm run build`, then `npm run preview`, and open the `localhost` address it prints. This needs no internet once installed.
- Do not double-click `dist/index.html`. The browser's crypto features only work on `localhost` or HTTPS, so the app must be served.
- Optional sharing: deploy the `dist` folder to a free static host (Vercel, Netlify or GitHub Pages) for an HTTPS link classmates can open.
- Before class: set each section's presenter name in Settings, run through once in presenter mode with the clicker, and press "Reset all demos" before starting.

**Sources**

- COMP3143 Week 7 Lecture Notes (Instructor Edition) and the Week 7 "Basic Cryptography" slides, based on Easttom, *Computer Security Fundamentals*, 4th ed., Chapter 8.
- [Mobbin MCP setup](https://mobbin.com/mcp) and the [official Mobbin MCP server repository](https://github.com/mobbin/mobbin-mcp-server).
