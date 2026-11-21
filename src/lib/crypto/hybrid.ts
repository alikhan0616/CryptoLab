// Hybrid encryption: AES-256-GCM session key for the data, RSA-OAEP to wrap that key.
import { randomBytes } from '../encoding'
import { aesDecrypt, aesEncrypt, rsaDecrypt, rsaEncrypt } from './webcrypto'

export interface HybridPackage {
  wrappedKey: Uint8Array // session key encrypted with Bob's RSA public key (256 bytes for RSA-2048)
  iv: Uint8Array // 12-byte AES-GCM nonce
  ciphertext: Uint8Array // the data, encrypted with the session key
}

export async function hybridEncrypt(bobPublic: CryptoKey, data: Uint8Array): Promise<{ pkg: HybridPackage; sessionKey: Uint8Array }> {
  const sessionKey = randomBytes(32) // step 1: fast symmetric session key
  const iv = randomBytes(12)
  const ciphertext = await aesEncrypt('GCM', sessionKey, iv, data) // step 3: encrypt the bulk data
  const wrappedKey = await rsaEncrypt(bobPublic, sessionKey) // step 2: protect the key with RSA
  return { pkg: { wrappedKey, iv, ciphertext }, sessionKey } // step 4: transmit the package
}

export async function hybridDecrypt(bobPrivate: CryptoKey, pkg: HybridPackage): Promise<Uint8Array> {
  const sessionKey = await rsaDecrypt(bobPrivate, pkg.wrappedKey)
  return aesDecrypt('GCM', sessionKey, pkg.iv, pkg.ciphertext)
}
