# CryptoLab — Decisions and shortcuts

Section 1A of PLAN.md is the scope. This file records choices made while building it.

## Phase 1 — Setup, layout, sidebar, tokens, crypto helpers

**Setup**
- The project lives directly in this folder (next to PLAN.md), not in a `cryptolab/` subfolder.
- Scaffolded by hand (package.json + config) instead of `npm create vite`, which is interactive.
- Tailwind v4 via `@tailwindcss/vite`. Design tokens are CSS variables in `src/styles/tokens.css`, mapped to Tailwind colours (`bg-paper`, `text-ink`, `text-sym`, `text-asym`, `text-keyless`, `text-ok`, `text-bad`, `bg-hl`) in `src/styles/index.css`.
- Light theme only (1A). No dark tokens.
- Fonts bundled with `@fontsource` (Fraunces 600, IBM Plex Sans 400/500/600, IBM Plex Mono 400/500), so the app works offline.
- Mobbin was not available, so `docs/design-notes.md` was skipped and Section 4 is used as is.
- The build script uses `tsc -p tsconfig.json` (one tsconfig, no project references) to keep it simple.

**Pages and navigation**
- 18 pages: Home, 4 fundamentals, 10 techniques, 3 practice pages (the 1A list only).
- Fundamentals are renumbered F1–F4 in the sidebar (Why, Pipeline = F2+F3 merged, Encoding = plan's F4, Sym vs asym = plan's F7) so students don't see gaps. Practice is P1–P3 (Activity 1, Activity 2, Misconceptions). Routes keep the plan's URLs.
- Three long titles have a shorter sidebar label (`short` in `routes.tsx`) so the whole sidebar fits on a 1366x768 screen without scrolling.
- `src/routes.tsx` is the single ordered page list; sidebar, page counter and next/previous all read from it.
- Keyboard: Right / Page Down = next step, then next page; Left / Page Up = previous; Shift + arrows = jump a page; P = presenter mode; F = fullscreen. Pages with an animation register a step handler (`useStepHandler`) so arrows step the animation first. Shortcuts are ignored while typing in an input.
- Presenter mode only scales text 1.25x (root font 18px -> 22.5px) and hides the sidebar behind a menu button. Its on/off state is remembered in `localStorage` (wrapped in try/catch).

**Crypto helpers (`src/lib/`)**
- `encoding.ts`: UTF-8, hex, Base64, binary, URL, random bytes, bit difference, PEM wrapping.
- `crypto/webcrypto.ts`: real SHA-256, HMAC-SHA256, PBKDF2, AES-GCM/CBC/CTR, RSA-OAEP, RSA signatures (PKCS#1 v1.5 or PSS), PEM export, key fingerprints. Errors are rewritten in plain English.
- `crypto/caesar.ts`: encrypt/decrypt (any integer key, wraps mod 26), brute force with a chi-squared English score.
- `crypto/des.ts`: real DES/3DES (ECB/CBC) through crypto-js.
- `crypto/rsaToy.ts`: small-number RSA with BigInt and the extended-Euclid step table.
- `crypto/hybrid.ts`: AES-256-GCM session key wrapped with RSA-OAEP.
- `crypto/pki.ts`: the 6 chain scenarios, **simulated** (1A says so): each certificate records who signed it and whether it was edited after signing, instead of carrying real signatures.
- No hand-written SHA-256, AES, HMAC or S-DES (1A: use Web Crypto and crypto-js). The "how it works" animations in Phase 3 will be illustrative diagrams.
- `tests/crypto.test.ts` (Vitest, 19 tests) checks the Section 10 known answers: Caesar HELLO+3/CYBER+2, SHA-256 "abc" and "", HMAC RFC 4231 #2, AES-128 FIPS-197, DES `85E813540F0AB405`, toy RSA 61/53/17/65, the OAEP 190-byte limit, sign/verify, hybrid round trip and the PKI scenarios. AES-192/256 FIPS vectors are not tested separately; Web Crypto handles all three key sizes the same way.

## Phase 2 — Home and the 4 fundamentals screens

**Shared pieces added**
- `StepPlayer` (start, previous, play/pause, next, last, progress dots, big caption). Arrow keys / Page Up / Page Down step it first and change page only at the first/last step. Space = play/pause, R = restart. **Skipped the 0.5x/1x/2x speed control** to keep it simple; play auto-advances every 2.6 s.
- The caption and controls are **pinned to the bottom of the screen**, and when a step's scene doesn't fit above them, the page scrolls the scene to the top (smoothly, or instantly with reduce-motion). This keeps every step readable at 1366x768, including in presenter mode.
- `Callout` (Course says / Common misconception / Teaching version / Note), `Actor`, `KeyChip`, `Mover`, `SegmentedControl`, `Toggle`, `TextField`, `Button`, `DataBox`, `useAsync`.
- Packets moving along a channel use a plain CSS transition (`Mover`) rather than Motion: Motion's percentage `left` animation lagged a step behind. Motion's `MotionConfig reducedMotion="user"` plus a global CSS rule respect the OS reduce-motion setting.

**Pages**
- Home: title, "Start presenting", the 6-stop course roadmap (each stop links to its section and lists its pages), colour legend and keyboard/clicker keys.
- F1 Why cryptography: Alice -> Bob with Eve tapping the line, 6 steps, editable message, encryption toggle (real AES-128-GCM; Bob's decryption is real too), clickable Confidentiality/Integrity/Availability question, "hides meaning, not existence" step.
- F2 Plaintext to ciphertext (plan F2 + F3 merged): the pipeline boxes are labelled with the key terms (plaintext, algorithm, key, ciphertext) and the steps add key space and cryptanalysis. Caesar or AES-GCM, live key input, "Try the wrong key" (Caesar gives gibberish, AES-GCM gives "Decryption failed"). The 25-key brute-force grid uses real decryptions; it highlights the tile for the actual key (Eve "spots the readable one") rather than scoring English, because a 5-letter word is too short to score reliably.
  - For AES here, the typed key text is turned into a 128-bit key with SHA-256 (first 16 bytes) so any text works as a key. This is a teaching shortcut; the AES page will use PBKDF2 for passwords.
- F3 Encoding vs encryption vs hashing: three lanes with real Base64/hex/binary/URL encoding, real AES-GCM and real SHA-256. Eve's decode really decodes; her decryption really runs with a wrong key and really fails; "Reverse" shakes. Summary table and both misconception callouts.
- F4 Symmetric vs asymmetric: both scenes in one 7-step player, the comparison table, and a real speed test (AES-GCM vs RSA-OAEP on 100 KB, RSA in 190-byte pieces; RSA key generation is not timed).
  - **Simplified:** hovering a table row highlights the row only, not the matching part of the scenes.

**Skipped fundamentals, one line each instead (1A)**
- F5 key space: on F2's key-space and cryptanalysis steps.
- F6 key not algorithm: the "The key, not the algorithm" callout on F2.
- F8 key-sharing problem: F4 step 3 and its "Key-sharing problem" line.
- F9 pick by goal: the "Pick the technique by security goal" callout on F4.

**Bug found and fixed**
- `randomBytes` crashed above 64 KB (the `getRandomValues` limit), which broke the 100 KB speed test. It now fills in 64 KB chunks; added a test.

**Testing note**
- In the Playwright window, CSS transitions and smooth scrolling barely advance (about 2 frames per 500 ms because the window is in the background), so raw screenshots catch animations halfway. The checks fast-forward animations (`getAnimations().finish()`) and use the reduce-motion setting before taking screenshots. In a normal foreground browser they run at full speed.

## Phase 3 — Techniques T1–T10

**Layout (`TechniqueLayout`)**
- Every page: **Idea** (plain explanation, analogy, security goal, Course says) on the left, **Try it** on the right, then **How it works inside** (one StepPlayer), then any extra section and the **In the lab** box. The plan's 5-tab template (Step by step / Break it / In the lab tabs) was not built (1A: only Idea + Try it).
- **Reset demo** remounts the Try it panel, so every demo returns to its defaults. On T9 the chosen scenario lives on the page (the animation also uses it), so Reset does not change the scenario.
- `LabBox` shows the Lab 7 commands with Windows PowerShell / Linux tabs, a copy button and "what to observe" (T2, T6, T7, T8 only, as 1A says). On Windows, `openssl` commands are the same as on Linux; T6 uses `python` vs `python3`.

**Real vs illustrated in "How it works inside"**
- Fully real: T1 (Caesar arithmetic), T3 (salt + SHA-256 values), T4 (HMAC built by hand from two real SHA-256 calls with ipad/opad, checked against the built-in HMAC), T7 (toy RSA numbers), T8 (real RSA-2048 signatures), T9 (the simulated chain checks for the chosen scenario).
- Partly illustrated, labelled on the page (1A): T2 SHA-256 (real padding block and real digest, made-up round values); T5 DES (made-up Feistel round values; real DES output and **real 3DES E-D-E intermediate values**, via a new `desBlock` helper with a test); T6 AES (real ShiftRows, made-up SubBytes/MixColumns/round keys; ends with the real FIPS-197 result computed by Web Crypto).

**Per page**
- T1 Caesar: presets, slider + any-integer key (wraps mod 26), encrypt/decrypt, keep-spaces/keep-case options, alphabet strip, and a brute-force mode with the chi-squared score (the "Long secret message" preset is cracked at key 7). The cipher wheel and frequency chart were skipped (1A).
- T2 SHA-256: live digest in hex/Base64/binary, input/output length meter, avalanche with three bit grids and a "Change one character" button, "Reverse this hash" explanation. The lab mirror downloads `message.txt` / `message_modified.txt` and shows both hashes. File drag-and-drop and the integrity-workflow toggles were skipped.
- T3 Salting: mini user database (Ali and Sara, SAMEPASS), no salt / salt + SHA-256 / salt + PBKDF2 with 1 to 600,000 iterations and measured ms per hash, random or custom salt, 8/16/32-byte salts, add-user. A custom salt shared by all users brings duplicates back, with a note on why each user needs their own. The precomputed-table attack and guessing-speed demos were skipped.
- T4 HMAC: tag maker, receiver verify panel, Mallory attack (plain SHA-256 fooled; HMAC catches it; "Mallory knows the key" fools it again), and a hash vs HMAC vs signature table.
- T5 DES/3DES: real crypto-js encrypt/decrypt, ECB/CBC, hex/Base64, wrong-key toggle, key-space bars and timeline. **Found while testing:** changing the key's last hex digit (e.g. `f1` to `f0`) only flips a parity bit that DES ignores, so the "wrong" key still decrypted. The demo now changes the first digit. Simplified DES was skipped (1A).
- T6 AES: 128/192/256 keys, random hex or PBKDF2-from-password, GCM/CBC, nonce/IV regenerate, wrong-key and flip-a-byte toggles (GCM refuses; CBC gives garbled text or a padding error), and a CBC block view with PKCS#7 padding highlighted. CTR and ECB are left out of the UI (1A lists GCM/CBC). The lab box shows a typical Fernet `symmetric_demo.py`.
- T7 RSA: real RSA-OAEP 1024/2048/4096 with timing, PEM display (private key blurred until Reveal), PEM downloads, two encryptions of the same message to show they differ, Eve's own key failing, and the 190-byte limit error linking to T10. Toy mode (labelled "Teaching version - not secure"): primes with a datalist, e suggestion, extended-Euclid steps, m → c → m, per-letter text mode with the equal-letters warning, and instant trial-division factoring.
- T8 Signatures: real RSASSA-PKCS1-v1_5 SHA-256 (2048-bit, 256-byte signature), verify with editable message, Alice's or Mallory's public key, plain-English reasons. RSA-PSS and file mode were skipped.
- T9 PKI: 6 simulated scenarios with three certificate cards, five browser checks with reasons, our own generic warning screen. **Changed:** certificate dates are now relative to today, so "Valid" will not turn into "Expired" after mid-2027; "Tampered" now swaps the public key (Mallory's) rather than the name, so the signature check is what catches it.
- T10 Hybrid: Bob's RSA-2048 made on the page, real AES-256-GCM + RSA-OAEP round trip, package bar with real sizes (wrapped key 256 B, IV 12 B, ciphertext N B), Eve's unwrap attempt fails, envelope animation, HTTPS/TLS 1.3 note. The speed race and 20 MB file mode were skipped (1A).

**Accessibility**
- All on-screen text is at least 14px (0.78rem); smaller sizes found by the Playwright check were raised. Superscripts in maths are the only exception.
- Data boxes wrap long hex anywhere but keep ordinary words whole.

## Phase 4 — Practice pages and polish

**Pages**
- P1 Activity 1: four scenario cards, four buckets (AES, Public-key mechanism, Hash, Digital signature). Drag and drop, or click a card then click a bucket (clicking a card already in a bucket also counts as that bucket). Optional one-line "justify" box per card, Reveal (right/wrong per card, score, answers with links to the demo pages), Reset.
- P2 Activity 2: the four triage questions from Section 8 as multiple choice with four options each, Reveal per question or Reveal all, each answer linking to its demo.
- P3 Misconceptions: the seven myths as flip cards (the back repeats the myth, says "No." and gives the correction, with a link to the page that shows it). Flip all / Hide all / Reset.
- Not built (1A: skip): exit check, quiz practice, Lab 7 companion page, recap page.

**Polish pass (Playwright, 1366x768, normal and presenter mode, all 18 pages)**
- No console errors, no horizontal overflow, nothing clipped, no text under 14px.
- In-app checks: HELLO +3 = KHOOR, CYBER +2 = EADGT, SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad.
- Fixed: P1 click-to-place into a bucket that already held a card selected that card instead; flip cards did not show which myth they answered; misconception cards were tight at the bottom.
- Added a short `README.md` (how to run, how to present, keyboard shortcuts).
- The build warns that the main JavaScript chunk is over 500 KB (crypto-js, Motion, React). This does not matter for a laptop serving the app locally, so it was left as is.

**Not verified**
- Animation smoothness at full frame rate: the Playwright window renders only a few frames per second in the background, so animations were checked by their end states, not by watching them move. Click through once in a normal browser before class.
- Firefox, the real projector, and a real presentation clicker were not tested.

## After Phase 4 — Scaling to large screens

**Problem (verified):** the layout never broke at any size, but it did not use large screens. Content stopped at 1200px wide and text stayed 18px, so at 2560x1440 the page used under half the width and everything looked small. This came from Section 4's "max 1200px, base 18px", which was written for a 1366x768 projector.

**Fix**
- `src/scale.ts` sets a CSS variable `--k = max(1, min(width / 1440, height / 810))` on load and on resize. The root font size is `18px × k` (presenter mode `22.5px × k`), so everything sized in rem grows together. k is 1 up to 1440x810, so the 1366x768 projector layout is unchanged. Using both width and height means ultrawide or short windows are limited by height and never overflow.
- The content limit is now `66.67rem` (1200px at k = 1) instead of a fixed 1200px, so it grows with the text.
- Fixed pixel sizes were converted to rem: actor circles, category chips, the SHA-256 bit grids, the toggle switch, the Home roadmap line and a T9 spacer. lucide icons (sized in px by the library) get `zoom: var(--k)`.
- Results: k = 1 at 1366x768, 1.33 at 1920x1080 (24px text), 1.78 at 2560x1440 (32px text). At 1920 and 2560 the content fills 99% of the area beside the sidebar; ultrawide 3440x1440 and 2560x1080 are height-limited with side margins.

**Related fixes found while checking**
- The step player also re-checks scene visibility when a scene changes size within 2 s of a step (real crypto results arrive a moment after the step), not only when the step changes.
- The HMAC animation had cut off the final tag with "…" at 1366x768; its rows now wrap. To keep it fitting in presenter mode, the 64-byte ipad/opad rows show the first 24 bytes and "… (64 bytes)"; the inner hash, the tag and the built-in HMAC are shown in full.

**Verified (Playwright, window in front at 60+ fps)**
- All 18 pages at 1366x768, 1920x1080, 2560x1440, 2560x1080 and 3440x1440: no horizontal overflow, nothing cut off, no console errors.
- Every step of every animation stays fully visible above the pinned caption at 1366x768, 1920x1080 and 2560x1440, in normal and presenter mode, with and without reduce-motion.
- Testing note: earlier "hidden step" failures were the test window being in the background (about 2 frames a second). Bringing it to the front fixed the measurements; only the HMAC case was real.
