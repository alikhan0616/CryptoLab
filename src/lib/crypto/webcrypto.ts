// Thin async wrappers around the browser's Web Crypto API (crypto.subtle).
// Everything shown on screen is computed here for real.
import { utf8ToBytes, randomBytes, toPem, bytesToHex } from '../encoding'

const subtle = () => globalThis.crypto.subtle
const bs = (b: Uint8Array) => b as unknown as BufferSource

// ---------- Hashing ----------
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  const bytes = typeof data === 'string' ? utf8ToBytes(data) : data
  return new Uint8Array(await subtle().digest('SHA-256', bs(bytes)))
}

export const sha256Hex = async (data: Uint8Array | string) => bytesToHex(await sha256(data))

// ---------- HMAC ----------
export async function hmacSha256(key: Uint8Array | string, message: Uint8Array | string): Promise<Uint8Array> {
  const k = typeof key === 'string' ? utf8ToBytes(key) : key
  const m = typeof message === 'string' ? utf8ToBytes(message) : message
  if (k.length === 0) throw new Error('The HMAC key cannot be empty')
  const ck = await subtle().importKey('raw', bs(k), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await subtle().sign('HMAC', ck, bs(m)))
}

// ---------- PBKDF2 (password key derivation) ----------
export async function pbkdf2Sha256(password: string, salt: Uint8Array, iterations: number, lengthBytes = 32): Promise<Uint8Array> {
  const base = await subtle().importKey('raw', bs(utf8ToBytes(password)), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bs(salt), iterations }, base, lengthBytes * 8)
  return new Uint8Array(bits)
}

// ---------- AES ----------
export type AesMode = 'GCM' | 'CBC' | 'CTR'

export function generateAesKeyBytes(bits: 128 | 192 | 256): Uint8Array {
  return randomBytes(bits / 8)
}

/** IV/nonce size per mode: GCM uses a 12-byte nonce, CBC/CTR a 16-byte IV/counter. */
export const ivLength = (mode: AesMode) => (mode === 'GCM' ? 12 : 16)

function aesParams(mode: AesMode, iv: Uint8Array): Algorithm {
  if (mode === 'GCM') return { name: 'AES-GCM', iv: bs(iv) } as Algorithm
  if (mode === 'CBC') return { name: 'AES-CBC', iv: bs(iv) } as Algorithm
  return { name: 'AES-CTR', counter: bs(iv), length: 64 } as Algorithm
}

async function importAes(keyBytes: Uint8Array, mode: AesMode) {
  if (![16, 24, 32].includes(keyBytes.length)) throw new Error('AES keys must be 16, 24 or 32 bytes')
  return subtle().importKey('raw', bs(keyBytes), { name: `AES-${mode}` }, false, ['encrypt', 'decrypt'])
}

export async function aesEncrypt(mode: AesMode, keyBytes: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
  const key = await importAes(keyBytes, mode)
  return new Uint8Array(await subtle().encrypt(aesParams(mode, iv), key, bs(plaintext)))
}

/** Throws a plain-English error when decryption fails (wrong key or changed data). */
export async function aesDecrypt(mode: AesMode, keyBytes: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
  const key = await importAes(keyBytes, mode)
  try {
    return new Uint8Array(await subtle().decrypt(aesParams(mode, iv), key, bs(ciphertext)))
  } catch {
    throw new Error(mode === 'GCM'
      ? 'Decryption failed: wrong key or the data was changed'
      : 'Decryption failed: wrong key or bad padding')
  }
}

// ---------- RSA ----------
export type RsaBits = 1024 | 2048 | 4096

export async function generateRsaOaepKeys(bits: RsaBits = 2048): Promise<CryptoKeyPair> {
  return subtle().generateKey(
    { name: 'RSA-OAEP', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  )
}

export async function generateRsaSigningKeys(bits: RsaBits = 2048, scheme: 'RSASSA-PKCS1-v1_5' | 'RSA-PSS' = 'RSASSA-PKCS1-v1_5'): Promise<CryptoKeyPair> {
  return subtle().generateKey(
    { name: scheme, modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  )
}

/** Max plaintext bytes for RSA-OAEP with SHA-256: k - 2*hLen - 2 (190 for 2048-bit). */
export const rsaOaepMaxBytes = (bits: number) => bits / 8 - 2 * 32 - 2

export async function rsaEncrypt(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const bits = (publicKey.algorithm as RsaHashedKeyAlgorithm).modulusLength
  const max = rsaOaepMaxBytes(bits)
  if (data.length > max) throw new Error(`Message too long: ${data.length} bytes, but RSA-${bits} with OAEP can only encrypt ${max} bytes`)
  return new Uint8Array(await subtle().encrypt({ name: 'RSA-OAEP' }, publicKey, bs(data)))
}

export async function rsaDecrypt(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  try {
    return new Uint8Array(await subtle().decrypt({ name: 'RSA-OAEP' }, privateKey, bs(data)))
  } catch {
    throw new Error('Decryption failed: this private key does not match the public key used')
  }
}

const signParams = (key: CryptoKey) =>
  key.algorithm.name === 'RSA-PSS' ? { name: 'RSA-PSS', saltLength: 32 } : { name: 'RSASSA-PKCS1-v1_5' }

export async function rsaSign(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await subtle().sign(signParams(privateKey), privateKey, bs(data)))
}

export async function rsaVerify(publicKey: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
  return subtle().verify(signParams(publicKey), publicKey, bs(signature), bs(data))
}

export async function exportPublicPem(key: CryptoKey): Promise<string> {
  return toPem(await subtle().exportKey('spki', key), 'PUBLIC KEY')
}

export async function exportPrivatePem(key: CryptoKey): Promise<string> {
  return toPem(await subtle().exportKey('pkcs8', key), 'PRIVATE KEY')
}

/** Short fingerprint: first 8 hex chars of SHA-256 over the public key (SPKI). */
export async function keyFingerprint(publicKey: CryptoKey): Promise<string> {
  const spki = new Uint8Array(await subtle().exportKey('spki', publicKey))
  return (await sha256Hex(spki)).slice(0, 8)
}
