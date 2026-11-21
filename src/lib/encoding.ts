// Small byte/text helpers. Plain TypeScript, no React.

const enc = new TextEncoder()
const dec = new TextDecoder()

export const utf8ToBytes = (s: string): Uint8Array => enc.encode(s)
export const bytesToUtf8 = (b: Uint8Array): string => dec.decode(b)

export function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '')
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Hex may only contain 0-9 and a-f')
  if (clean.length % 2 !== 0) throw new Error('Hex must have an even number of characters')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function bytesToBase64(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s)
}

export function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64.trim())
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

export function bytesToBinary(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(2).padStart(8, '0')).join(' ')
}

export const textToBase64 = (s: string) => bytesToBase64(utf8ToBytes(s))
export const textToHex = (s: string) => bytesToHex(utf8ToBytes(s))
export const textToBinary = (s: string) => bytesToBinary(utf8ToBytes(s))
export const textToUrl = (s: string) => encodeURIComponent(s)

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n)
  // getRandomValues gives at most 65,536 bytes per call, so fill large buffers in chunks.
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(b.subarray(i, i + 65536))
  return b
}

/** Count how many bits differ between two equal-length byte arrays. */
export function bitDiff(a: Uint8Array, b: Uint8Array): number {
  let n = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = a[i] ^ b[i]
    while (x) { n += x & 1; x >>= 1 }
  }
  return n
}

/** Wrap DER bytes in a PEM block (64-character lines, like OpenSSL). */
export function toPem(der: ArrayBuffer, label: string): string {
  const b64 = bytesToBase64(new Uint8Array(der))
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`
}
