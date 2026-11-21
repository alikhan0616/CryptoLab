// Known-answer tests from PLAN.md Section 10.
import { describe, expect, it } from 'vitest'
import { caesarDecrypt, caesarEncrypt, bruteForce } from '../src/lib/crypto/caesar'
import { sha256Hex, hmacSha256, aesEncrypt, aesDecrypt, generateRsaOaepKeys, rsaEncrypt, rsaDecrypt, rsaOaepMaxBytes, generateRsaSigningKeys, rsaSign, rsaVerify, pbkdf2Sha256 } from '../src/lib/crypto/webcrypto'
import { desDecrypt, desEncrypt, desEncryptBlockHex } from '../src/lib/crypto/des'
import { toyKeys, toyEncrypt, toyDecrypt, trialFactor } from '../src/lib/crypto/rsaToy'
import { hybridEncrypt, hybridDecrypt } from '../src/lib/crypto/hybrid'
import { checkChain, SCENARIOS } from '../src/lib/crypto/pki'
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8, bytesToBase64, base64ToBytes, randomBytes } from '../src/lib/encoding'

describe('Caesar', () => {
  it('HELLO +3 = KHOOR', () => expect(caesarEncrypt('HELLO', 3)).toBe('KHOOR'))
  it('CYBER +2 = EADGT', () => expect(caesarEncrypt('CYBER', 2)).toBe('EADGT'))
  it('wraps round and handles negative/large keys', () => {
    expect(caesarEncrypt('XYZ', 3)).toBe('ABC')
    expect(caesarEncrypt('HELLO', 29)).toBe('KHOOR')
    expect(caesarDecrypt('KHOOR', 3)).toBe('HELLO')
    expect(caesarEncrypt('Hi, there!', -1)).toBe('Gh, sgdqd!')
  })
  it('brute force finds the key of an English sentence', () => {
    const c = caesarEncrypt('The exam results will be published on the student portal next week', 7)
    expect(bruteForce(c).bestKey).toBe(7)
  })
})

describe('Encoding', () => {
  it('randomBytes works above the 64 KB getRandomValues limit', () => {
    const b = randomBytes(200 * 1024)
    expect(b.length).toBe(200 * 1024)
    expect(b.subarray(150 * 1024).some((x) => x !== 0)).toBe(true)
  })
  it('round-trips hex and base64', () => {
    const b = utf8ToBytes('Cyber Security')
    expect(bytesToUtf8(hexToBytes(bytesToHex(b)))).toBe('Cyber Security')
    expect(bytesToUtf8(base64ToBytes(bytesToBase64(b)))).toBe('Cyber Security')
  })
})

describe('SHA-256 and HMAC', () => {
  it('SHA-256("abc")', async () =>
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'))
  it('SHA-256("")', async () =>
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'))
  it('HMAC RFC 4231 test 2', async () =>
    expect(bytesToHex(await hmacSha256('Jefe', 'what do ya want for nothing?'))).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'))
  it('PBKDF2 gives different output for different salts', async () => {
    const a = await pbkdf2Sha256('SAMEPASS', utf8ToBytes('salt-one'), 1000)
    const b = await pbkdf2Sha256('SAMEPASS', utf8ToBytes('salt-two'), 1000)
    expect(bytesToHex(a)).not.toBe(bytesToHex(b))
  })
})

describe('AES (Web Crypto)', () => {
  const key = hexToBytes('000102030405060708090a0b0c0d0e0f')
  it('round-trips GCM, CBC, CTR', async () => {
    for (const mode of ['GCM', 'CBC', 'CTR'] as const) {
      const iv = new Uint8Array(mode === 'GCM' ? 12 : 16)
      const c = await aesEncrypt(mode, key, iv, utf8ToBytes('Result: 82'))
      expect(bytesToUtf8(await aesDecrypt(mode, key, iv, c))).toBe('Result: 82')
    }
  })
  it('FIPS-197 AES-128 single block (CBC with zero IV = one raw block)', async () => {
    const c = await aesEncrypt('CBC', key, new Uint8Array(16), hexToBytes('00112233445566778899aabbccddeeff'))
    expect(bytesToHex(c.slice(0, 16))).toBe('69c4e0d86a7b0430d8cdb78070b4c55a')
  })
  it('GCM rejects a flipped byte', async () => {
    const iv = new Uint8Array(12)
    const c = await aesEncrypt('GCM', key, iv, utf8ToBytes('Pay Rs 1,000'))
    c[0] ^= 1
    await expect(aesDecrypt('GCM', key, iv, c)).rejects.toThrow(/changed/)
  })
})

describe('DES / 3DES', () => {
  it('known answer', () =>
    expect(desEncryptBlockHex('133457799BBCDFF1', '0123456789ABCDEF').toUpperCase()).toBe('85E813540F0AB405'))
  it('round-trips DES and 3DES in ECB and CBC', () => {
    const iv = '0001020304050607'
    for (const [algo, key] of [['DES', '133457799BBCDFF1'], ['3DES', '0123456789abcdef23456789abcdef01456789abcdef0123']] as const)
      for (const mode of ['ECB', 'CBC'] as const) {
        const c = desEncrypt(algo, mode, key, iv, 'Week 7 cryptography')
        expect(desDecrypt(algo, mode, key, iv, c)).toBe('Week 7 cryptography')
      }
  })
})

describe('Toy RSA', () => {
  it('p 61, q 53, e 17, m 65', () => {
    const k = toyKeys(61n, 53n, 17n)
    expect([k.n, k.phi, k.d]).toEqual([3233n, 3120n, 2753n])
    const c = toyEncrypt(65n, k)
    expect(c).toBe(2790n)
    expect(toyDecrypt(c, k)).toBe(65n)
    expect(trialFactor(3233n)).toEqual([53n, 61n])
  })
})

describe('RSA (Web Crypto)', () => {
  it('OAEP-2048 limit is 190 bytes and round-trips', async () => {
    expect(rsaOaepMaxBytes(2048)).toBe(190)
    const kp = await generateRsaOaepKeys(2048)
    const c = await rsaEncrypt(kp.publicKey, utf8ToBytes('hello'))
    expect(bytesToUtf8(await rsaDecrypt(kp.privateKey, c))).toBe('hello')
    await expect(rsaEncrypt(kp.publicKey, new Uint8Array(191))).rejects.toThrow(/too long/)
  })
  it('signature verifies, fails after an edit', async () => {
    const kp = await generateRsaSigningKeys(2048)
    const sig = await rsaSign(kp.privateKey, utf8ToBytes('Result: 82'))
    expect(sig.length).toBe(256)
    expect(await rsaVerify(kp.publicKey, sig, utf8ToBytes('Result: 82'))).toBe(true)
    expect(await rsaVerify(kp.publicKey, sig, utf8ToBytes('Result: 92'))).toBe(false)
  })
  it('hybrid round trip', async () => {
    const kp = await generateRsaOaepKeys(2048)
    const { pkg } = await hybridEncrypt(kp.publicKey, utf8ToBytes('A long exam report...'))
    expect(pkg.wrappedKey.length).toBe(256)
    expect(bytesToUtf8(await hybridDecrypt(kp.privateKey, pkg))).toBe('A long exam report...')
  })
})

describe('PKI (simulated)', () => {
  it('only the valid scenario passes every check', () => {
    for (const s of SCENARIOS) {
      for (const day of ['2026-11-21', '2031-03-05']) {
        const allPass = checkChain(s.id, day).every((c) => c.pass)
        expect(allPass).toBe(s.id === 'valid')
      }
    }
  })
})

describe('3DES = DES-E(K3, DES-D(K2, DES-E(K1, block)))', () => {
  it('matches crypto-js TripleDES on one block', async () => {
    const { desBlock } = await import('../src/lib/crypto/des')
    const CryptoJS = (await import('crypto-js')).default
    const k1 = '0123456789abcdef', k2 = '23456789abcdef01', k3 = '456789abcdef0123', block = '0123456789abcdef'
    const ede = desBlock(k3, desBlock(k2, desBlock(k1, block), true))
    const ref = CryptoJS.TripleDES.encrypt(CryptoJS.enc.Hex.parse(block), CryptoJS.enc.Hex.parse(k1 + k2 + k3), { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }).ciphertext.toString()
    expect(ede).toBe(ref)
    // K1 = K2 = K3 collapses to single DES
    expect(desBlock(k1, desBlock(k1, desBlock(k1, block), true))).toBe(desBlock(k1, block))
  })
})
