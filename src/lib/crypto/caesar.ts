// Caesar cipher: shift each letter by a fixed amount (the key). C = (P + k) mod 26.

export interface CaesarOptions { keepNonLetters?: boolean; keepCase?: boolean }

export const mod = (n: number, m: number) => ((n % m) + m) % m

export function caesar(text: string, key: number, opts: CaesarOptions = {}): string {
  const { keepNonLetters = true, keepCase = true } = opts
  const k = mod(Math.trunc(key), 26)
  let out = ''
  for (const ch of text) {
    const upper = ch >= 'A' && ch <= 'Z'
    const lower = ch >= 'a' && ch <= 'z'
    if (!upper && !lower) { if (keepNonLetters) out += ch; continue }
    const base = upper ? 65 : 97
    const shifted = String.fromCharCode(base + mod(ch.charCodeAt(0) - base + k, 26))
    out += keepCase ? shifted : shifted.toUpperCase()
  }
  return out
}

export const caesarEncrypt = (text: string, key: number, opts?: CaesarOptions) => caesar(text, key, opts)
export const caesarDecrypt = (text: string, key: number, opts?: CaesarOptions) => caesar(text, -key, opts)

// English letter frequencies (percent), A..Z.
export const ENGLISH_FREQ = [
  8.17, 1.49, 2.78, 4.25, 12.7, 2.23, 2.02, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41,
  6.75, 7.51, 1.93, 0.1, 5.99, 6.33, 9.06, 2.76, 0.98, 2.36, 0.15, 1.97, 0.07,
]

/** Chi-squared distance from English letter frequencies. Lower = more English-like. */
export function englishScore(text: string): number {
  const counts = new Array(26).fill(0)
  let total = 0
  for (const ch of text.toUpperCase()) {
    const c = ch.charCodeAt(0) - 65
    if (c >= 0 && c < 26) { counts[c]++; total++ }
  }
  if (total === 0) return Infinity
  return counts.reduce((sum: number, obs: number, i: number) => {
    const exp = (ENGLISH_FREQ[i] / 100) * total
    return sum + (obs - exp) ** 2 / exp
  }, 0)
}

export interface BruteRow { key: number; text: string; score: number }

/** Try all 25 useful shifts. Returns rows in key order plus the most English-like key. */
export function bruteForce(ciphertext: string): { rows: BruteRow[]; bestKey: number } {
  const rows: BruteRow[] = []
  for (let key = 1; key < 26; key++) {
    const text = caesarDecrypt(ciphertext, key)
    rows.push({ key, text, score: englishScore(text) })
  }
  const best = rows.reduce((a, b) => (b.score < a.score ? b : a))
  return { rows, bestKey: best.key }
}
