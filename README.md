# CryptoLab

An interactive classroom app for COMP3143 Week 7, Basic Cryptography (Easttom, *Computer Security Fundamentals*, Chapter 8). Every key, hash, ciphertext and signature on screen is computed for real in the browser.

## Run it

You need Node.js (version 20 or newer).

```powershell
npm install
npm run build
npm run preview
```

Open the `localhost` address it prints. After `npm install` it needs **no internet**: fonts and libraries are bundled.

Do **not** double-click `dist/index.html`. The browser's crypto features only work on `localhost` or HTTPS, so the app must be served.

For development: `npm run dev`. To run the crypto tests: `npm test`.

## What is inside

| Part | Pages |
| --- | --- |
| Home | Course roadmap, colour key, keyboard shortcuts |
| Part 1 · Fundamentals | F1 Why cryptography? · F2 Plaintext to ciphertext · F3 Encoding vs encryption vs hashing · F4 Symmetric vs asymmetric |
| Part 2 · Techniques | T1 Caesar · T2 SHA-256 · T3 Salting · T4 HMAC · T5 DES/3DES · T6 AES · T7 RSA · T8 Digital signatures · T9 PKI · T10 Hybrid |
| Part 3 · Practice | P1 Activity 1: choose the right tool · P2 Activity 2: triage · P3 Misconceptions |

Each technique page has an **Idea** panel, a **Try it** demo (with **Reset demo**), a step-by-step **How it works inside** animation, and on T2, T6, T7 and T8 an **In the lab** box with the Lab 7 commands.

## Presenting

| Key | Action |
| --- | --- |
| Right arrow / Page Down | Next animation step; at the last step, next page |
| Left arrow / Page Up | Previous step; at the first step, previous page |
| Shift + arrows | Jump a whole page |
| Space | Play / pause the animation |
| R | Restart the animation |
| P | Presenter mode (text 1.25x bigger, sidebar hidden behind the menu button) |
| F | Fullscreen |

Presentation clickers send Page Up / Page Down, so they work without setup. Shortcuts are ignored while typing in a text box (click outside the box first).

The layout scales to the screen: it is designed at 1366x768 and grows in proportion on larger displays (1080p, 1440p, 4K), so text and animations stay readable from the back of the room. Ultrawide screens get side margins instead of overflowing.

Before class: open the app on the presenting laptop, press **P**, and click through once with the clicker.

## Deploying (auto-rebuild on every push)

The app is a static site, so any static host works. The setup we use:

1. The code lives in a GitHub repository.
2. Vercel is connected to that repository (vercel.com → **Add New → Project** → import the repo → **Deploy**). Vercel detects Vite by itself: build command `npm run build`, output folder `dist`. No extra settings are needed.
3. From then on:
   - every push to `main` rebuilds and updates the live site within about a minute;
   - every pull request or other branch gets its own **preview link**, so teammates can check a change before it goes live.

Hash-based page URLs (`#/techniques/aes`) mean refreshing or sharing any page works without redirect rules. Vercel serves over HTTPS, which the browser's crypto features require.

Teammates who want to change something: clone the repo, run `npm install` and `npm run dev`, make the change, run `npm test`, then push a branch and open a pull request.

## Plain-text study guide

The app is a JavaScript single-page app, so tools that don't run JavaScript (AI assistants, search engines) see an empty page. All of its teaching content is also in [`public/guide.md`](public/guide.md), served at **https://cryptolab-nine.vercel.app/guide.md**. Give that link to Claude or any other AI to have it explain the project. `/llms.txt` points AI tools to it.

When you change a page's text, update `public/guide.md` too. `npm test` fails if a page is missing from the guide or its "Course says" lines no longer match.

## Notes

- Teaching-only versions (Toy RSA, ECB mode) are labelled "Teaching version - not secure".
- The SHA-256, DES and AES "How it works inside" animations are simplified illustrations; each page says which values are real.
- Design and scope choices are recorded in [DECISIONS.md](DECISIONS.md).
