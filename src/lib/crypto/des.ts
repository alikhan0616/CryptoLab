// Real DES and 3DES via crypto-js (Web Crypto does not support DES).
import CryptoJS from 'crypto-js'

export type DesAlgo = 'DES' | '3DES'
export type DesMode = 'ECB' | 'CBC'

const hex = (h: string) => CryptoJS.enc.Hex.parse(h.replace(/\s/g, ''))

/** Key length in hex characters: 8 bytes for DES, 24 bytes (K1|K2|K3) for 3DES. */
export const desKeyHexLength = (algo: DesAlgo) => (algo === 'DES' ? 16 : 48)

function cfg(mode: DesMode, ivHex: string, padding = CryptoJS.pad.Pkcs7) {
  return { mode: mode === 'ECB' ? CryptoJS.mode.ECB : CryptoJS.mode.CBC, iv: hex(ivHex), padding }
}

function checkHex(label: string, value: string, length: number) {
  const clean = value.replace(/\s/g, '')
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length !== length)
    throw new Error(`${label} must be ${length} hex characters (${length / 2} bytes)`)
}

function check(algo: DesAlgo, mode: DesMode, keyHex: string, ivHex: string) {
  checkHex(`${algo} key`, keyHex, desKeyHexLength(algo))
  if (mode === 'CBC') checkHex('IV', ivHex, 16)
}

const cipher = (algo: DesAlgo) => (algo === 'DES' ? CryptoJS.DES : CryptoJS.TripleDES)

/** Encrypt UTF-8 text. Returns ciphertext as hex. */
export function desEncrypt(algo: DesAlgo, mode: DesMode, keyHex: string, ivHex: string, plaintext: string): string {
  check(algo, mode, keyHex, ivHex)
  return cipher(algo).encrypt(CryptoJS.enc.Utf8.parse(plaintext), hex(keyHex), cfg(mode, ivHex)).ciphertext.toString()
}

/** Decrypt hex ciphertext back to UTF-8 text. Throws a plain-English error on failure. */
export function desDecrypt(algo: DesAlgo, mode: DesMode, keyHex: string, ivHex: string, ciphertextHex: string): string {
  check(algo, mode, keyHex, ivHex)
  const params = CryptoJS.lib.CipherParams.create({ ciphertext: hex(ciphertextHex) })
  const out = cipher(algo).decrypt(params, hex(keyHex), cfg(mode, ivHex))
  try {
    if (out.sigBytes < 0) throw new Error()
    return out.toString(CryptoJS.enc.Utf8)
  } catch {
    throw new Error('Decryption failed: wrong key or changed data')
  }
}

/** Encrypt one raw 8-byte block with no padding (used for the known-answer test). */
export function desEncryptBlockHex(keyHex: string, blockHex: string): string {
  return CryptoJS.DES.encrypt(hex(blockHex), hex(keyHex), cfg('ECB', '', CryptoJS.pad.NoPadding)).ciphertext.toString()
}

/** Encrypt or decrypt one raw 8-byte block with single DES (no padding). Used for the 3DES E-D-E chain. */
export function desBlock(keyHex: string, blockHex: string, decrypt = false): string {
  const c = cfg('ECB', '', CryptoJS.pad.NoPadding)
  if (!decrypt) return CryptoJS.DES.encrypt(hex(blockHex), hex(keyHex), c).ciphertext.toString()
  const params = CryptoJS.lib.CipherParams.create({ ciphertext: hex(blockHex) })
  return CryptoJS.DES.decrypt(params, hex(keyHex), c).toString()
}
