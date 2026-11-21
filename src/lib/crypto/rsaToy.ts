// Toy RSA with small numbers. Teaching version - not secure.

export function isPrime(n: bigint): boolean {
  if (n < 2n) return false
  if (n % 2n === 0n) return n === 2n
  for (let i = 3n; i * i <= n; i += 2n) if (n % i === 0n) return false
  return true
}

export function gcd(a: bigint, b: bigint): bigint {
  while (b) [a, b] = [b, a % b]
  return a < 0n ? -a : a
}

export function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n
  base %= m
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % m
    base = (base * base) % m
    exp >>= 1n
  }
  return result
}

export interface EuclidStep { a: bigint; b: bigint; q: bigint; r: bigint }

/** Inverse of e mod phi with the extended Euclidean algorithm, plus the division steps. */
export function modInverse(e: bigint, phi: bigint): { d: bigint; steps: EuclidStep[] } {
  const steps: EuclidStep[] = []
  let [oldR, r] = [e, phi]
  let [oldS, s] = [1n, 0n]
  while (r !== 0n) {
    const q = oldR / r
    steps.push({ a: oldR, b: r, q, r: oldR - q * r })
    ;[oldR, r] = [r, oldR - q * r]
    ;[oldS, s] = [s, oldS - q * s]
  }
  if (oldR !== 1n) throw new Error(`e = ${e} has no inverse because gcd(e, phi) = ${oldR}`)
  return { d: ((oldS % phi) + phi) % phi, steps }
}

export interface ToyKeys { p: bigint; q: bigint; n: bigint; phi: bigint; e: bigint; d: bigint; steps: EuclidStep[] }

export function toyKeys(p: bigint, q: bigint, e: bigint): ToyKeys {
  if (!isPrime(p)) throw new Error(`p = ${p} is not prime`)
  if (!isPrime(q)) throw new Error(`q = ${q} is not prime`)
  if (p === q) throw new Error('p and q must be different primes')
  const n = p * q
  const phi = (p - 1n) * (q - 1n)
  if (e <= 1n || e >= phi) throw new Error(`e must be between 1 and phi (${phi})`)
  if (gcd(e, phi) !== 1n) throw new Error(`e = ${e} shares a factor with phi = ${phi}; pick another e`)
  const { d, steps } = modInverse(e, phi)
  return { p, q, n, phi, e, d, steps }
}

/** Smallest valid e (from 3 upward) for this phi; 17 or 65537 preferred when valid. */
export function suggestE(phi: bigint): bigint {
  for (const pref of [17n, 65537n]) if (pref < phi && gcd(pref, phi) === 1n) return pref
  for (let e = 3n; e < phi; e += 2n) if (gcd(e, phi) === 1n) return e
  throw new Error('No valid e found')
}

export const toyEncrypt = (m: bigint, k: { e: bigint; n: bigint }) => {
  if (m < 0n || m >= k.n) throw new Error(`m must be between 0 and n - 1 (${k.n - 1n})`)
  return modPow(m, k.e, k.n)
}
export const toyDecrypt = (c: bigint, k: { d: bigint; n: bigint }) => modPow(c, k.d, k.n)

/** Factor n by trial division (instant for toy sizes). */
export function trialFactor(n: bigint): [bigint, bigint] | null {
  if (n % 2n === 0n) return [2n, n / 2n]
  for (let i = 3n; i * i <= n; i += 2n) if (n % i === 0n) return [i, n / i]
  return null
}
