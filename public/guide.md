# CryptoLab study guide

A plain-text version of everything taught in **CryptoLab**, an interactive web app for **COMP3143 Week 7: Basic Cryptography** (Easttom, *Computer Security Fundamentals*, 4th ed., Chapter 8).

- Live app: https://cryptolab-nine.vercel.app (needs a normal browser with JavaScript)
- This guide: https://cryptolab-nine.vercel.app/guide.md (readable by people and AI tools)

**About the app.** It has 18 pages in three parts: 4 fundamentals screens, 10 technique pages ordered from easiest to hardest, and 3 practice pages. Everything shown on screen (keys, hashes, ciphertexts, signatures) is computed for real in the browser, using the Web Crypto API and crypto-js for DES. Lines marked **Course says** are facts taken directly from the course notes and slides.

**Colour code used in the app**

- Teal = **symmetric** (one shared key): Caesar, HMAC, DES, AES
- Orange = **asymmetric** (public and private keys): RSA, signatures, PKI
- Indigo = **keyless** (no key at all): hashing, salting
- Teal + orange = **hybrid** (both together)

**Cast of characters**

- **Alice**: the sender.
- **Bob**: the receiver.
- **Eve**: an eavesdropper. She can copy and read traffic, but cannot change it.
- **Mallory**: an active attacker. She can change, replace or fake traffic.
- **CA**: a Certificate Authority, the trusted body that vouches for public keys.

**Course roadmap:** Fundamentals → Symmetric → Asymmetric → Hash / HMAC → Signatures / PKI → Practical.

---

## Part 1: Fundamentals

### F1. Why cryptography?

**Scenario.** Alice, in the teacher's office, must send an exam result ("Result: 82") to Bob's student portal over an **untrusted network**. Eve taps the line.

**The animation, in 6 steps:**
1. Alice sends the result as plain, readable text.
2. Eve copies the packet, and her copy is fully readable.
3. Question: which security property do we need? Confidentiality, Integrity or Availability? **Answer: Confidentiality**, meaning only the right people can read it.
4. Encryption is switched on (real AES-GCM). The packet becomes scrambled **ciphertext**, Eve's copy is useless, and Bob decrypts it with the shared key.
5. **Key message:** encryption hides the *meaning* of a message, not its *existence*. Eve still sees that a packet was sent, and how big it was.

**Course says:** you must send exam results over an untrusted network that an attacker can copy. The property needed is **confidentiality**.

### F2. Plaintext to ciphertext (and the key terms)

The path every message takes: **Plaintext → Encrypt (algorithm + key) → Ciphertext → Decrypt (same key) → Plaintext**. The running example is Caesar with shift 3 (HELLO → KHOOR). AES-GCM is also available.

**Key terms**
- **Plaintext**: the original, readable message.
- **Algorithm** (or cipher): the recipe for scrambling. It is public, so everyone may know how it works.
- **Key**: the secret value that controls the algorithm. Same algorithm with a different key gives a different result.
- **Ciphertext**: the scrambled, unreadable output of encryption.
- **Decryption**: running the same algorithm backwards with the **same key** gives back the original plaintext.
- **Key space**: the set of all possible keys. Caesar has only **25 useful shifts** (0 and 26 change nothing). AES-128 has **2^128** keys, about 340 followed by 36 zeros.
- **Cryptanalysis**: breaking a cipher without being given the key. Against Caesar, Eve simply tries all 25 keys and spots the readable one. Against AES, even a trillion guesses per second would take far longer than the age of the universe.

**"Try the wrong key" demo:** with Caesar, a wrong key produces gibberish. With AES-GCM, the browser refuses: "Decryption failed: wrong key or the data was changed".

**Security depends on the key, not on hiding the algorithm.** AES is fully public and peer-reviewed, yet without the key Eve still cannot read the message. Distrust any claim that something is "unbreakable because it is secret".

**Course says:** HELLO with shift +3 becomes KHOOR. Caesar is not secure today: the key space is tiny and language patterns are obvious.

### F3. Encoding vs encryption vs hashing

The same input goes into three lanes. All three outputs look unreadable, but only one keeps a secret.

| | Encoding | Encryption | Hashing |
|---|---|---|---|
| Needs a key? | No | Yes | No |
| Can be reversed? | Yes, by anyone | Yes, only with the key | No, it is one way only |
| Purpose | Format data for transport | Keep data secret (confidentiality) | Check data was not changed (integrity) |
| Example | Base64 in email attachments | AES protecting a backup | SHA-256 of a downloaded file |

- **Encoding** (Base64, hex, binary, URL encoding): Eve decodes it straight away.
- **Encryption** (AES-GCM): Eve's decryption attempt without the key really fails.
- **Hashing** (SHA-256): the output is always 64 hex characters. Nobody can reverse it, not even the owner. Eve can only guess inputs, hash them and compare.

**Common misconceptions**
- "Base64 is encryption." **No.** It has no key, and anyone can decode it.
- "Hashing is another form of encryption." **No.** Hashing is one way and is never decrypted. It is used to check integrity, not to hide data.

### F4. Symmetric vs asymmetric

**Symmetric (locked box with one shared key):** Alice and Bob each hold a copy of the **same** key. Alice locks the box, sends it, and Bob unlocks it with his copy. It is fast and simple. The catch is the **key-sharing problem**: if the shared key K is sent as plaintext, Eve copies it and the confidentiality problem comes back.

**Asymmetric (open padlocks):** Bob hands out open padlocks (his **public key**) to everyone, even Eve. Alice snaps one shut on her box and sends it, and no secret had to be shared first. Eve has a padlock too, but a padlock cannot open anything. Only Bob's **private key** opens the box.

| | Symmetric | Asymmetric |
|---|---|---|
| Keys | One shared secret key | A public key and a private key |
| Speed | Fast | Slower |
| Bulk data | Good for large files | Not for large data |
| Key distribution | Hard: the key must be shared safely | Easy: the public key can be shared openly |
| Examples | AES; historically DES / 3DES | RSA, ECC |
| Common role | Encrypting the data itself | Key exchange, signatures, identity |

**Speed test (real, in the browser):** encrypting 100 KB with AES-GCM takes one operation. With RSA-OAEP 2048 it needs 539 pieces of up to 190 bytes each, and was about 45 times slower in testing. Real systems combine the two (see T10 Hybrid).

**Pick the technique by security goal**
| Security goal | Technique |
|---|---|
| Confidentiality of a large file | AES / symmetric encryption |
| Integrity fingerprint | SHA-256 hash |
| Keyed integrity | HMAC |
| Origin + integrity | Digital signature |
| Linking an identity to a public key | Certificate / PKI |
| Protecting a symmetric key in transit | Public-key / key-exchange mechanism |

---

## Part 2: Techniques (easiest to hardest)

Each technique page has an **Idea** panel, a **Try it** live demo, a step-by-step **How it works inside** animation and, for Lab 7 topics, an **In the lab** box.

### T1. Caesar cipher (symmetric, level 1)

**Idea.** Replace each letter with the letter a fixed number of places further along the alphabet. The number of places is the **key**. To decrypt, shift back by the same amount, so it is symmetric: one shared key.
**Analogy:** two friends agree to "move every letter 3 along" before passing notes in class.
**Security goal:** confidentiality (historically).

**Course says**
- Shift each letter by a fixed amount. HELLO with shift +3 = KHOOR.
- The shift amount is the key.
- Not secure today: the key space is tiny and language patterns are obvious.
- Class activity: CYBER with shift +2 = EADGT.

**How it works.** Number the letters A = 0 … Z = 25. Encrypt with **C = (P + k) mod 26**.
- H = 7, and 7 + 3 = 10 = K
- E = 4, and 4 + 3 = 7 = H
- L = 11, and 11 + 3 = 14 = O (twice)
- O = 14, and 14 + 3 = 17 = R

So HELLO becomes KHOOR. It wraps round at the end of the alphabet: X = 23, 23 + 3 = 26, and 26 mod 26 = 0 = A.

**Demo features:**
- Presets: HELLO +3, CYBER +2, ROT13.
- Encrypt and decrypt with any key; large or negative keys wrap round, so 29 becomes 3.
- An alphabet strip shows what each letter becomes.
- **Brute force:** all 25 shifts are decrypted, and each is scored by how close its letter counts are to normal English (a chi-squared score). The best guess is highlighted. The long sample message is cracked at key 7.

**Class activity**
1. Encrypt CYBER with shift +2. The answer is EADGT.
2. Encrypt a message of your own and swap it with another group.
3. Decrypt theirs (use brute force if you don't know the key).
4. Discuss why it fails against a determined attacker: there are only 25 keys, and letter patterns survive.

### T2. SHA-256 hashing (keyless, level 2)

**Idea.** A hash function turns any input into a short, fixed-size **digest**. The same input always gives the same digest, but you cannot run it backwards. There is no key.
**Analogy:** a fingerprint identifies a person, but you cannot rebuild the person from the fingerprint.
**Security goal:** integrity.

**Course says**
- One way, fixed-size 256-bit output (64 hex characters).
- Same input gives the same digest. A small change gives a very different digest (the **avalanche effect**).
- Not designed to be decrypted. Used for integrity checking.
- A plain hash alone does not prove who created the data. Trust in the published hash matters.

**Known answer:** SHA-256("abc") = `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.

**Avalanche demo:** "Cyber Security" and "Cyber security" differ by one letter, yet about **half of the 256 output bits differ**. The app shows bit grids and a counter such as "127 of 256 bits changed (50%)". You cannot tell from two hashes how similar the inputs were.

**"Reverse this hash":** this is not possible. The only attack is to guess inputs, hash each one and compare, which is why weak passwords are dangerous (see T3).

**How it works inside** (a simplified illustration: the padding and the final digest are real, the round values are not):
1. The message is turned into bytes: "abc" = 61 62 63 (hex).
2. **Padding** fills a fixed 64-byte (512-bit) block: the message, a single 1 bit (0x80), zeros, then the message length in bits at the end (24 bits = 0x18).
3. Eight working values (a to h) are mixed with the block, round after round.
4. After **64 rounds**, every output bit depends on every input bit. That is the avalanche effect.
5. The final values form the digest: always 256 bits (64 hex characters), whatever the input length.

**In the lab (Lab 7, Part A)**
- Windows PowerShell: `Get-FileHash .\message.txt -Algorithm SHA256`, then the same for `message_modified.txt`.
- Linux / macOS: `sha256sum message.txt` and `sha256sum message_modified.txt`.
- **Observe:** changing a single character gives a completely different hash, so any change to the file is detected. The app can download the two practice files, which differ only by "." vs "!".

### T3. Salting passwords (keyless, level 3)

**Idea.** Systems should not store passwords, only a hash of them. A **salt** is random data added to each password before hashing, so identical passwords produce different stored values and precomputed tables of common-password hashes become useless.
**Analogy:** two people buy the same padlock, but each gets a different random code engraved on it, so one master list cannot open both.
**Security goal:** protecting stored passwords.

**Course says**
- A salt is random data combined with a password before a password-hashing or KDF (key-derivation function) step.
- It stops identical passwords from producing identical stored values and makes precomputed attacks less useful.
- Plain SHA-256 alone is not best practice for passwords; use a dedicated password KDF.

**Demo: a mini user database.** Ali and Sara both use the password SAMEPASS.
- **No salt + SHA-256:** both rows store the **same value**. Crack one and you crack both.
- **Salt + SHA-256:** each user gets their own random salt, so the stored values differ. But SHA-256 is very fast, so guessing is still cheap.
- **Salt + PBKDF2:** the hashing is repeated many times on purpose (1 to 600,000 iterations, timed live; about 90 ms per hash at 600,000 in testing). A normal login waits a fraction of a second, while an attacker trying millions of guesses waits millions of times longer.
- **One custom salt for everyone** brings the duplicates back. Each user needs their **own** random salt.

**How it works: sign-up and login**
1. Sign-up: the user picks a password.
2. The system makes a fresh random salt for that user.
3. The salt and password are combined and hashed (the KDF step).
4. The database stores the salt and the result, never the password itself.
5. Login: the user types a password.
6. The system looks up that user's salt and recomputes the result.
7. If it equals the stored result, the password was right.

**Note:** real systems also use **bcrypt**, **scrypt** or **Argon2**. The app uses PBKDF2 because browsers support it.

### T4. HMAC (symmetric, keyed hash, level 4)

**Idea.** An HMAC combines a secret key with hashing. The result, a **tag**, can only be created and checked by someone who knows the key. If an attacker changes the message, they cannot make a matching tag.
**Analogy:** a wax seal stamped with a ring that only you and your friend own.
**Security goal:** keyed integrity and authentication.

**Course says**
- A plain hash detects change, but an attacker who can replace both the message and the hash can just recompute the hash.
- HMAC combines a secret key with hashing to give keyed integrity and authentication.
- The key is shared only by trusted parties.

**Mallory's tampering attack.** Alice sends "Pay Rs 1,000 to Bob" and Mallory changes it to "Pay Rs 9,000 to Mallory".
- **Plain SHA-256:** Mallory recomputes the hash for her fake message, and Bob's check **passes**. Bob is fooled.
- **HMAC:** Mallory cannot make a valid tag without the key, so Bob's check **fails** and he rejects it.
- **HMAC when Mallory knows the key:** the check passes again. The key's secrecy is the whole point.

**Known answer (RFC 4231, test 2):** HMAC-SHA256 with key "Jefe" and data "what do ya want for nothing?" = `5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843`.

**How it works inside** (all values computed for real): **HMAC = H((K ⊕ opad) ‖ H((K ⊕ ipad) ‖ message))**
1. Take the key and the message.
2. Pad the key to 64 bytes and XOR it with **ipad** (0x36 repeated).
3. **Inner hash** = SHA-256(K ⊕ ipad ‖ message).
4. Use the key again, XORed with **opad** (0x5c repeated).
5. **Outer hash** = SHA-256(K ⊕ opad ‖ inner hash). This is the tag.
6. It is identical to the browser's built-in HMAC.

**Plain hash vs HMAC vs digital signature**
| | Plain hash | HMAC | Digital signature |
|---|---|---|---|
| Who can create it? | Anyone | Only holders of the shared key | Only the sender (with their private key) |
| Who can check it? | Anyone | Only holders of the shared key | Anyone with the sender's public key |
| What it proves | Data matches the published hash | Data unchanged and from a key holder | Data unchanged and from that sender (non-repudiation) |

### T5. DES and 3DES (symmetric, historical, level 5)

**Idea.** **DES** encrypts 64-bit blocks with a **56-bit** effective key through **16 rounds** of a **Feistel network**: split the block in half, mix one half with a round key, swap, repeat. **3DES** runs DES three times (Encrypt-Decrypt-Encrypt with keys K1, K2, K3) to make the key effectively longer.
**Analogy:** a lock that was strong in 1977, but today's tools can pick it, so three were fitted, and later the door was replaced (AES).
**Security goal:** confidentiality (historical).

**Course says**
- DES and 3DES are historical symmetric ciphers.
- AES is the modern replacement for DES.

**Known answer:** DES with key `133457799BBCDFF1` on block `0123456789ABCDEF` gives `85E813540F0AB405`.

**Demo:**
- Real DES and 3DES encryption and decryption, in ECB or CBC mode, with output in hex or Base64.
- The warning label reads "56-bit key: broken by brute force".
- ECB encrypts each 8-byte block on its own, so identical blocks give identical ciphertext. It is shown for teaching only.
- **Parity bits:** the last bit of each key byte is ignored by DES, so changing a key from `…f1` to `…f0` decrypts just the same. That's why only 56 of the 64 key bits count.

**How it works inside**
1. Split the 64-bit block into a left half and a right half (32 bits each).
2. Mix the right half with that round's key using a function F.
3. Combine F's output with the left half (XOR).
4. Swap the halves. That is one round.
5. Repeat for 16 rounds, each with its own round key. To decrypt, run the same steps with the round keys in reverse order.
6. **3DES = E(K1) → D(K2) → E(K3).** If K1 = K2 = K3, the decrypt step undoes the first encrypt and 3DES collapses to plain DES. That kept it compatible with old systems.

**Timeline**
- **1977:** DES becomes the US standard.
- **1998:** the EFF "Deep Crack" machine finds a DES key in 56 hours.
- **1999 onwards:** 3DES is used as a stopgap.
- **2001:** AES is published.
- **After 2023:** NIST retires 3DES for new encryption.

**Key space:** DES has 2^56 keys, 3DES (effective) has 2^112, and AES-128 has 2^128. AES-128 has 2^72 times more keys than DES. Use AES for anything new.

### T6. AES (symmetric, level 6)

**Idea.** AES is a symmetric block cipher. It scrambles data in 128-bit blocks using a key of 128, 192 or 256 bits, and the same key decrypts. A **mode** such as GCM says how to handle messages longer than one block, and GCM also detects any change to the ciphertext.
**Analogy:** a high-security safe. Everyone knows how it is built, but only people with the key can open it.
**Security goal:** confidentiality (GCM adds integrity).

**Course says**
- Symmetric block cipher, 128-bit block size, key sizes 128, 192 or 256 bits.
- Widely deployed, efficient for bulk encryption, the modern replacement for DES.
- A longer key is only one part of secure implementation.
- Students do not need to reproduce every internal round; the focus is choosing and using an AES tool correctly.

**Demo:**
- Choose the key size and either a random key or a key derived from a password (PBKDF2, 100,000 rounds).
- Choose the mode: **GCM** (recommended, 12-byte nonce, adds a 16-byte authentication tag) or **CBC** (16-byte IV, PKCS#7 padding).
- **Wrong key or one flipped ciphertext byte:** GCM refuses to return anything ("wrong key or the data was changed"). CBC has no built-in integrity check, so it either fails on the padding or returns garbled text without warning. That is why GCM is recommended.
- **Padding (CBC):** the last block is filled with bytes that all equal the number of padding bytes. For example, 10 bytes each with the value 10.

**Known answer (FIPS-197):** key `000102030405060708090a0b0c0d0e0f` on block `00112233445566778899aabbccddeeff` gives `69c4e0d86a7b0430d8cdb78070b4c55a`.

**How it works inside** (a simplified illustration: ShiftRows is exact, the other byte values are made up, and the final result is real AES). The 16-byte block is arranged as a **4x4 grid** of bytes (the "state"), filled column by column.
1. **AddRoundKey:** combine every byte with the round key (XOR).
2. **SubBytes:** swap every byte for another using a fixed lookup table (the S-box).
3. **ShiftRows:** slide row 1 left by 0, row 2 by 1, row 3 by 2 and row 4 by 3.
4. **MixColumns:** mix the four bytes in each column together.
5. **AddRoundKey** again. That completes round 1.
6. Repeat: **10 rounds** for a 128-bit key, **12** for 192 and **14** for 256. The last round skips MixColumns.

**In the lab (Lab 7, Part B)**
- Windows: `python symmetric_demo.py`. Linux / macOS: `python3 symmetric_demo.py`.
- A typical script uses Python's **Fernet**, which is AES-128 in CBC mode plus an HMAC-SHA256 tag:
  ```python
  from cryptography.fernet import Fernet
  key = Fernet.generate_key()          # random secret key
  f = Fernet(key)
  token = f.encrypt(b"Exam results: 82")
  print(token)                         # ciphertext (a Fernet token)
  print(f.decrypt(token))              # b'Exam results: 82'
  ```
- **Observe:** the script prints a ciphertext token, then the original message after decryption. Without the key, the token cannot be decrypted.

### T7. RSA (asymmetric, level 7)

**Idea.** RSA uses a **key pair**. Anyone can encrypt with the **public key**, but only the matching **private key** can decrypt. Its security rests on number theory: multiplying two large primes is easy, but splitting the result back into them (factoring) is not.
**Analogy:** Bob hands out open padlocks. Anyone can snap one shut, but only Bob's key opens it.
**Security goal:** confidentiality and key exchange.

**Course says**
- A public/private key pair. The public key can be shared; the private key stays secret.
- Encrypt with the recipient's public key, decrypt with the recipient's private key.
- Based on number theory. Generally slower than AES, so real systems use hybrids.
- Know the key roles, why the private key must stay secret, and how to generate keys with tools. You do not derive the maths by hand.

**Real RSA demo (RSA-OAEP with SHA-256):**
- Generate 1024 (demo only), 2048 or 4096-bit keys, shown in PEM format. The private key stays hidden until you click Reveal, and both keys can be downloaded.
- Encrypting the **same message twice gives different ciphertexts**, because OAEP adds random padding.
- Eve's own key pair cannot decrypt Bob's message.
- **Size limit:** RSA-2048 with OAEP-SHA256 can encrypt at most **190 bytes**. That limit is why we use hybrid encryption.

**Toy RSA (teaching version, not secure):**
- p = 61 and q = 53, so n = p × q = **3233**.
- φ = (p − 1)(q − 1) = **3120**.
- Public exponent e = **17**.
- Private exponent d = **2753**, found with the extended Euclidean algorithm. (17 × 2753) mod 3120 = 1.
- Encrypt m = 65: c = 65^17 mod 3233 = **2790**.
- Decrypt: m = 2790^2753 mod 3233 = **65**.
- Encrypting a word letter by letter shows that equal letters give equal numbers (a weakness that real RSA's padding prevents).
- **Why toy RSA is weak:** n = 3233 factors instantly into 53 × 61, and from p and q anyone can compute d. A real 2048-bit n has 617 digits, and factoring it is not feasible.

**In the lab (Lab 7, Part C)**
```
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl pkey -in private_key.pem -pubout -out public_key.pem
```
**Observe:** two files appear. `private_key.pem` must be kept secret, with access protected. `public_key.pem` may be distributed.

### T8. Digital signatures (asymmetric, level 8)

**Idea.** A digital signature is made with the sender's **private key** and checked with their **public key**. Only the sender could have made it, and any change to the message breaks it. It does **not** hide the message.
**Analogy:** a handwritten signature that is impossible to copy and that smudges if anyone edits the page.
**Security goal:** authenticity, integrity and non-repudiation.

**Course says**
- Hash the message, sign the hash with the sender's private key, and the recipient verifies with the sender's public key.
- Provides authenticity, integrity and non-repudiation. Does not provide confidentiality.
- Encryption answers "who can read it?"; a signature answers "who signed it, and was it changed?"

**The 4 steps (plus an attack)**
1. **Hash:** Alice hashes her message with SHA-256.
2. **Sign:** she signs the digest with her private key.
3. **Send:** the message and signature travel together. Eve can read the message, because signing does not hide it.
4. **Verify:** Bob uses Alice's public key and his own hash of the message. It matches, so the signature is valid.
5. **Mallory edits one line** ("82 (A-)" becomes "92 (A+)"). Bob's hash no longer matches, so verification fails. **Changed content invalidates the signature.**

**Demo:** real RSA-2048 signatures (RSASSA-PKCS1-v1_5 with SHA-256, which is what `openssl dgst -sha256 -sign` makes). The signature is 256 bytes. Editing one character, or checking with Mallory's public key instead of Alice's, gives "Invalid" with a plain reason.

**Encryption vs digital signature**
| | Encryption | Digital signature |
|---|---|---|
| Question it answers | Who can read it? | Who signed it, and was it changed? |
| Goal | Confidentiality | Authenticity, integrity, non-repudiation |
| Key used to create | Recipient's public key | Sender's private key |
| Key used to check / open | Recipient's private key | Sender's public key |
| Output | Ciphertext (unreadable) | Signature (message stays readable) |

Secure systems often use both.

**In the lab (Lab 7, Part D)**
```
openssl dgst -sha256 -sign private_key.pem -out signature.bin message.txt
openssl dgst -sha256 -verify public_key.pem -signature signature.bin message.txt
```
Then edit `message.txt` and run the verify command again. **Observe:** the original prints `Verified OK`. After the edit, it prints `Verification failure`.

### T9. PKI and certificates (asymmetric trust system, level 9)

**Idea.** A public key alone does not say who owns it. A **certificate** links an identity (such as a website name) to a public key, and a trusted **Certificate Authority (CA)** signs it. Your browser checks this chain of signatures up to a root CA it already trusts.
**Analogy:** a passport. The government (the CA) vouches that this photo (the public key) belongs to this name, and border staff (browsers) trust the government.
**Security goal:** linking an identity to a public key.

**Course says**
- A certificate links an identity to a public key and is vouched for by a trust system of Certificate Authorities (CAs).
- The CA issues and signs the certificate. A certificate holds the identity, the public key and the issuer's information.
- The browser validates the trust chain and the certificate details.
- This is the foundation of HTTPS/TLS trust (Week 2).

**The problem it solves:** Mallory publishes her own public key labelled "Bob". Alice encrypts to it, and Mallory reads everything. We need a trusted way to know whose key is whose.

**The chain:** website certificate (portal.example.edu) ← signed by an intermediate CA ← signed by a root CA in the browser's trust store. The app uses a simplified, simulated format; real certificates use X.509.

**What the browser checks**
1. Does the domain name match the site you visited?
2. Is today between the "valid from" and "valid to" dates?
3. Does the website certificate's signature check with the intermediate's public key?
4. Does the intermediate's signature check with the root's public key?
5. Is the root CA in the browser's trust store?

If all pass, a padlock appears. If any fails, the browser shows a warning that the site's identity could not be checked.

**The 6 scenarios**
| Scenario | Result | Why |
|---|---|---|
| Valid | Padlock | All checks pass |
| Expired | Warning | The certificate's dates have passed |
| Wrong domain | Warning | You visited portal.example-login.com, but the certificate is for portal.example.edu |
| Self-signed | Warning | The website signed its own certificate, and no CA vouches for it |
| Unknown CA | Warning | The chain leads to a "Shady Root CA" that the browser does not trust |
| Tampered | Warning | Mallory swapped in her own public key after signing, so the signature no longer matches |

**Try it yourself:** open any HTTPS website, click the padlock, and view the certificate. You will see its subject, issuer, validity dates and the chain up to a root CA.

### T10. Hybrid cryptography (symmetric + asymmetric, level 10)

**Idea.** Hybrid cryptography combines both families. A fast symmetric key (AES) encrypts the data, and slow public-key crypto (RSA) only encrypts that small key. You get AES's speed and RSA's easy key sharing.
**Analogy:** send a heavy locked suitcase by courier, and post its small key separately in an envelope only the receiver can open.
**Security goal:** confidentiality with practical key sharing.

**Course says**
- (1) Generate a fast symmetric session key, (2) protect that key with a public-key mechanism, (3) encrypt the data with a symmetric algorithm, (4) transmit.
- Use the expensive public-key operation for a small key and efficient symmetric encryption for the bulk data.
- AES and RSA are not competitors; they are combined.

**The envelope animation**
1. Alice makes a fresh **session key** (the teal key).
2. She locks the big data in a teal box with **AES**.
3. She locks the small teal key in a small box with **Bob's RSA public key** (his orange padlock).
4. Both boxes travel to Bob. Eve copies both but cannot open the small box, so she never gets the session key.
5. Bob opens the small box with his **private key**, takes out the session key, and opens the data.

**Real round trip in the demo:** an AES-256-GCM session key encrypts the message, and RSA-OAEP 2048 wraps the key. The package sent is the **wrapped key (256 bytes)**, the **IV (12 bytes)** and the **ciphertext**. Bob unwraps the key and decrypts the original message. Eve's own key pair cannot unwrap the session key.

**This is how HTTPS works.** Your browser uses a public-key step to agree on a session key with the website, then fast symmetric encryption for everything after. Modern TLS 1.3 agrees on the key with Diffie-Hellman rather than sending it inside RSA, but the idea is the same.

**Assignment tip:** this is the model answer shape for "Explain a hybrid cryptographic design". Name the four steps and say why each tool is used where it is.

---

## Part 3: Practice

### P1. Activity 1: choose the right tool

Sort each scenario into AES, Public-key mechanism, Hash or Digital signature, and justify your choice in one sentence.

| Scenario | Answer | Why |
|---|---|---|
| Protecting a 10 GB backup stored on a laptop | **AES** | Bulk encryption: AES is fast for large data |
| Verifying that a software update truly came from the vendor | **Digital signature** | Origin check: only the vendor's private key can make a signature that their public key verifies |
| Checking whether a downloaded ISO file was altered | **Hash** | File-change check: compare the SHA-256 of your copy with the trusted published hash |
| Protecting a short session key sent to a remote recipient | **Public-key mechanism** | Lock it with the recipient's public key (the hybrid pattern) |

### P2. Activity 2: cryptographic triage

| Evidence | Answer | Why |
|---|---|---|
| A file hash no longer matches the trusted value. Which security property is in doubt? | **Integrity** | The hash changed because the data changed |
| A signature check fails after one line of the document is edited. Why? | **Changed content invalidates the signature** | The signature covers the document's hash; edit one line and the hash no longer matches |
| Two users choose the same password but should not have identical stored values. What should the system add? | **A unique salt** | A unique random salt per user makes identical passwords produce different stored values |
| A company wants a check value that only parties with a shared secret can recompute. Which concept fits? | **HMAC** | HMAC mixes a shared secret key into the hash, so only key holders can make or check the tag |

### P3. Misconceptions

Each myth below is false, and the answer to each is "No".

1. "Hashing is another form of encryption." Hashing is one way and is never decrypted.
2. "The public key must be secret." Public keys are meant to be shared; the private key needs protection.
3. "A digital signature hides the message." Its job is authenticity and integrity, not confidentiality.
4. "AES and RSA are direct competitors." They solve different problems and are usually combined.
5. "RSA is best for huge files." Symmetric encryption is the bulk-data choice.
6. "A custom secret algorithm is safer." Peer-reviewed, standard algorithms with secret keys are preferred.
7. "Base64 encoding is encryption." Anyone can decode it; there is no key.

---

## Quick reference: values to remember

| What | Input | Result |
|---|---|---|
| Caesar | HELLO, key 3 | KHOOR |
| Caesar | CYBER, key 2 | EADGT |
| SHA-256 | "abc" | ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad |
| SHA-256 | "" (empty) | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| HMAC-SHA256 | key "Jefe", "what do ya want for nothing?" | 5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843 |
| AES-128 (FIPS-197) | key 000102…0f, block 00112233…eeff | 69c4e0d86a7b0430d8cdb78070b4c55a |
| DES | key 133457799BBCDFF1, block 0123456789ABCDEF | 85E813540F0AB405 |
| Toy RSA | p 61, q 53, e 17, m 65 | n 3233, φ 3120, d 2753, c 2790, decrypts back to 65 |
| RSA-OAEP 2048 (SHA-256) | maximum message size | 190 bytes |

## Five things to remember (from the course slides)

1. Encryption protects confidentiality.
2. AES is efficient symmetric bulk encryption.
3. Public/private keys solve key-management and identity problems.
4. Hash vs HMAC: integrity fingerprint vs keyed integrity.
5. Digital signature: origin + integrity, verified with the public key.
