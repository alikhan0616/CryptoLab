import { useState } from 'react'
import { Dices, KeyRound } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, Field, SegmentedControl, TextArea, TextField, Toggle } from '../../components/ui/controls'
import { LabBox } from '../../components/ui/LabBox'
import { useAsync } from '../../components/useAsync'
import { aesDecrypt, aesEncrypt, ivLength, pbkdf2Sha256 } from '../../lib/crypto/webcrypto'
import { bytesToBase64, bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

type Bits = 128 | 192 | 256
type Mode = 'GCM' | 'CBC'

function AesDemo() {
  const [plain, setPlain] = useState('Exam results for COMP3143 are ready. Check the portal.')
  const [bits, setBits] = useState<Bits>(128)
  const [mode, setMode] = useState<Mode>('GCM')
  const [keyHex, setKeyHex] = useState(() => bytesToHex(randomBytes(16)))
  const [ivHex, setIvHex] = useState(() => bytesToHex(randomBytes(12)))
  const [password, setPassword] = useState('correct horse battery staple')
  const [deriving, setDeriving] = useState(false)
  const [fmt, setFmt] = useState<'base64' | 'hex'>('base64')
  const [wrongKey, setWrongKey] = useState(false)
  const [tampered, setTampered] = useState(false)

  const changeBits = (b: Bits) => { setBits(b); setKeyHex(bytesToHex(randomBytes(b / 8))) }
  const changeMode = (m: Mode) => { setMode(m); setIvHex(bytesToHex(randomBytes(ivLength(m)))) }
  const derive = async () => {
    setDeriving(true)
    const salt = randomBytes(16)
    setKeyHex(bytesToHex(await pbkdf2Sha256(password, salt, 100_000, bits / 8)))
    setDeriving(false)
  }

  const r = useAsync(async () => {
    const key = hexToBytes(keyHex), iv = hexToBytes(ivHex)
    if (key.length !== bits / 8) throw new Error(`An AES-${bits} key must be ${bits / 8} bytes (${bits / 4} hex characters); this one is ${key.length} bytes`)
    if (iv.length !== ivLength(mode)) throw new Error(`The ${mode === 'GCM' ? 'nonce' : 'IV'} must be ${ivLength(mode)} bytes`)
    const ct = await aesEncrypt(mode, key, iv, utf8ToBytes(plain))
    const received = ct.slice()
    if (tampered) received[0] ^= 0x01
    const decKey = wrongKey ? key.map((b, i) => (i === 0 ? b ^ 0xff : b)) : key
    let back: { ok: boolean; text: string }
    try {
      const out = await aesDecrypt(mode, decKey, iv, received)
      back = { ok: !tampered && !wrongKey, text: new TextDecoder().decode(out) }
    } catch (e) { back = { ok: false, text: (e as Error).message } }
    return { ct, back }
  }, [plain, bits, mode, keyHex, ivHex, tampered, wrongKey])

  // PKCS#7 padding as CBC applies it, for the block view.
  const p = utf8ToBytes(plain)
  const padLen = 16 - (p.length % 16)
  const padded = new Uint8Array(p.length + padLen); padded.set(p); padded.fill(padLen, p.length)

  return (
    <>
      <TextArea label="Plaintext" value={plain} onChange={setPlain} rows={2} />
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Key size"><SegmentedControl label="Key size" value={String(bits)} onChange={(v) => changeBits(+v as Bits)} options={[{ value: '128', label: '128-bit' }, { value: '192', label: '192' }, { value: '256', label: '256' }]} /></Field>
        <Field label="Mode"><SegmentedControl label="Mode" value={mode} onChange={changeMode} options={[{ value: 'GCM', label: 'GCM (recommended)' }, { value: 'CBC', label: 'CBC' }]} /></Field>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1"><TextField label={`Key (hex, ${bits / 8} bytes)`} value={keyHex} onChange={setKeyHex} mono /></div>
        <Button onClick={() => setKeyHex(bytesToHex(randomBytes(bits / 8)))}><Dices size={15} /> Random</Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1"><TextField label="...or derive the key from a password (PBKDF2, 100,000 rounds, random salt)" value={password} onChange={setPassword} /></div>
        <Button onClick={derive} disabled={deriving}><KeyRound size={15} /> {deriving ? 'Working...' : 'Derive key'}</Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1"><TextField label={mode === 'GCM' ? 'Nonce (12 bytes, never reuse with the same key)' : 'IV (16 bytes, random for every message)'} value={ivHex} onChange={setIvHex} mono /></div>
        <Button onClick={() => setIvHex(bytesToHex(randomBytes(ivLength(mode))))}><Dices size={15} /> New</Button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] text-muted">Ciphertext {r.value && `(${r.value.ct.length} bytes${mode === 'GCM' ? ', including a 16-byte authentication tag' : ''})`}</span>
        <SegmentedControl label="Output format" value={fmt} onChange={setFmt} options={[{ value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]} />
      </div>
      <DataBox tone={r.error ? 'bad' : undefined}>{r.error ?? (r.value ? (fmt === 'hex' ? bytesToHex(r.value.ct) : bytesToBase64(r.value.ct)) : '...')}</DataBox>

      <Block title="Decrypt">
        <div className="flex flex-wrap gap-5">
          <Toggle label="Use a wrong key" checked={wrongKey} onChange={setWrongKey} />
          <Toggle label="Flip one ciphertext byte" checked={tampered} onChange={setTampered} />
        </div>
        {r.value && <DataBox tone={r.value.back.ok ? 'ok' : 'bad'}>{r.value.back.text}</DataBox>}
        {r.value && (tampered || wrongKey) && (
          <p className="text-[0.88rem]">
            {mode === 'GCM'
              ? 'GCM checks an authentication tag, so it refuses to return anything when the key is wrong or the data was changed.'
              : 'CBC has no built-in integrity check. It either fails on the padding or returns garbled text without warning. That is why GCM is recommended.'}
          </p>
        )}
      </Block>

      {mode === 'CBC' && (
        <Block title="Blocks (CBC splits the message into 16-byte blocks)">
          <div className="flex flex-col gap-1">
            {Array.from({ length: padded.length / 16 }, (_, b) => (
              <div key={b} className="flex items-center gap-1">
                <span className="w-16 text-[0.78rem] text-muted">Block {b + 1}</span>
                {Array.from(padded.slice(b * 16, b * 16 + 16)).map((x, i) => {
                  const pad = b * 16 + i >= p.length
                  return <span key={i} className={`w-[1.6rem] rounded-sm text-center font-mono text-[0.78rem] ${pad ? 'bg-hl font-semibold' : 'bg-paper'}`}>{x.toString(16).padStart(2, '0')}</span>
                })}
              </div>
            ))}
          </div>
          <p className="text-[0.85rem] text-muted">Highlighted: <b>padding</b> (PKCS#7). {padLen} bytes, each with the value {padLen}, fill the last block.</p>
        </Block>
      )}
    </>
  )
}

// ----- How it works inside: illustrative 4x4 state -----
const START = Array.from(utf8ToBytes('Exam results: 82')) // exactly 16 bytes
const roundKey = (r: number) => START.map((_, i) => (i * 29 + r * 53 + 7) & 0xff)
const at = (s: number[], row: number, col: number) => s[col * 4 + row] // AES fills the grid column by column
const addKey = (s: number[], r: number) => s.map((b, i) => b ^ roundKey(r)[i])
const subBytes = (s: number[]) => s.map((b) => (b * 7 + 0x63) & 0xff) // stand-in for the S-box lookup table
const shiftRows = (s: number[]) => { const o = s.slice(); for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) o[col * 4 + row] = at(s, row, (col + row) % 4); return o }
const mixColumns = (s: number[]) => { const o = s.slice(); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = at(s, r, c) ^ at(s, (r + 1) % 4, c) ^ ((at(s, (r + 2) % 4, c) << 1) & 0xff); return o }

const S0 = START, S1 = addKey(S0, 0), S2 = subBytes(S1), S3 = shiftRows(S2), S4 = mixColumns(S3), S5 = addKey(S4, 1)
const STATES = [S0, S1, S2, S3, S4, S5]

const HOW_STEPS: Step[] = [
  { title: 'The state', caption: <>AES works on a 16-byte block arranged as a <b>4x4 grid</b> of bytes, filled column by column. Here: "Exam results: 82".</> },
  { title: 'AddRoundKey', caption: <><b>AddRoundKey:</b> combine every byte with the first round key (XOR).</> },
  { title: 'SubBytes', caption: <><b>SubBytes:</b> swap every byte for another one using a fixed lookup table (the S-box).</> },
  { title: 'ShiftRows', caption: <><b>ShiftRows:</b> slide row 1 left by 0, row 2 by 1, row 3 by 2, row 4 by 3.</> },
  { title: 'MixColumns', caption: <><b>MixColumns:</b> mix the four bytes in each column together, so each byte affects the others.</> },
  { title: 'AddRoundKey', caption: <>Combine with the next round key. That completes <b>round 1</b>.</> },
  { title: 'Repeat', caption: <>Repeat the four steps: <b>10 rounds</b> for a 128-bit key, <b>12</b> for 192, <b>14</b> for 256. The last round skips MixColumns.</> },
  { title: 'Real result', caption: 'With the official FIPS-197 test key and block, the browser\'s real AES gives exactly the published answer.' },
]

function Grid({ s, hlRow, changed }: { s: number[]; hlRow?: boolean; changed?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {[0, 1, 2, 3].map((row) => [0, 1, 2, 3].map((col) => (
        <span key={`${row}${col}`} className={`flex h-10 w-12 items-center justify-center rounded border-2 font-mono text-[0.95rem] transition-colors ${changed ? 'border-sym bg-hl/60' : 'border-sym/40'} ${hlRow && row > 0 ? 'bg-sym/10' : ''}`}>
          {at(s, row, col).toString(16).padStart(2, '0')}
        </span>
      )))}
    </div>
  )
}

function HowRender({ s }: { s: number }) {
  const fips = useAsync(async () => bytesToHex((await aesEncrypt('CBC', hexToBytes('000102030405060708090a0b0c0d0e0f'), new Uint8Array(16), hexToBytes('00112233445566778899aabbccddeeff'))).slice(0, 16)), [])
  if (s === 6) return (
    <div className="flex min-h-[13rem] items-center justify-center p-5">
      <table className="text-[0.95rem]">
        <thead><tr className="border-b-2 border-ink"><th className="px-4 py-1 text-left">Key size</th><th className="px-4 py-1">Rounds</th></tr></thead>
        <tbody>{[[128, 10], [192, 12], [256, 14]].map(([k, r]) => <tr key={k} className="border-b border-line"><td className="px-4 py-1">AES-{k}</td><td className="px-4 py-1 text-center font-mono">{r}</td></tr>)}</tbody>
      </table>
    </div>
  )
  if (s === 7) return (
    <div className="flex min-h-[13rem] flex-col items-center justify-center gap-2 p-5 font-mono text-[0.95rem]">
      <div><span className="font-sans text-muted">Key </span>000102030405060708090a0b0c0d0e0f</div>
      <div><span className="font-sans text-muted">Block </span>00112233445566778899aabbccddeeff</div>
      <div className="rounded border-2 border-sym px-3 py-1"><span className="font-sans text-muted">Output </span>{fips.value} {fips.value === '69c4e0d86a7b0430d8cdb78070b4c55a' && <b className="font-sans text-ok">✓ matches FIPS-197</b>}</div>
    </div>
  )
  return (
    <div className="flex min-h-[13rem] items-center justify-center gap-6 p-5">
      {s > 0 && <><Grid s={STATES[s - 1]} /><span className="text-[1.5rem] text-muted">→</span></>}
      <Grid s={STATES[s]} changed={s > 0 && s !== 3} hlRow={s === 3} />
      {(s === 1 || s === 5) && (
        <div className="flex flex-col items-center gap-1 text-[0.8rem] text-muted">
          <span>round key {s === 1 ? 0 : 1}</span>
          <Grid s={roundKey(s === 1 ? 0 : 1)} />
        </div>
      )}
    </div>
  )
}

const FERNET = `from cryptography.fernet import Fernet

key = Fernet.generate_key()          # random secret key
f = Fernet(key)
token = f.encrypt(b"Exam results: 82")
print(token)                         # ciphertext (a Fernet token)
print(f.decrypt(token))              # b'Exam results: 82'`

export default function T6Aes() {
  return (
    <TechniqueLayout
      subtitle="The modern standard for encrypting data with one shared key."
      idea={<><b>AES</b> is a symmetric block cipher: it scrambles data in 128-bit blocks using a key of 128, 192 or 256 bits. The same key decrypts. A <b>mode</b> such as GCM says how to handle messages longer than one block, and GCM also detects any change to the ciphertext.</>}
      analogy="a high-security safe: everyone knows how the safe is built, but only people with the key can open it."
      goal="Confidentiality (GCM adds integrity)"
      courseSays={[
        'Symmetric block cipher, 128-bit block size, key sizes 128, 192 or 256 bits.',
        'Widely deployed, efficient for bulk encryption, the modern replacement for DES.',
        'A longer key is only one part of secure implementation.',
        'Students do not need to reproduce every internal round; the focus is choosing and using an AES tool correctly.',
      ]}
      tryIt={() => <AesDemo />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} />, note: 'Simplified illustration: ShiftRows is exact, but the other byte values are made up to show the idea. The last step is the real AES result.' }}
      lab={
        <LabBox
          part="Part B: symmetric encryption"
          windows={'python symmetric_demo.py'}
          linux={'python3 symmetric_demo.py'}
          observe="the script prints a ciphertext token, then the original message after decryption. Without the key, the token cannot be decrypted."
        >
          <p className="mb-2 text-[0.9rem]">A typical <span className="font-mono">symmetric_demo.py</span> uses Python's <b>Fernet</b>, which is AES-128 in CBC mode plus an HMAC-SHA256 tag (so changes are detected, like GCM):</p>
          <pre className="overflow-x-auto rounded bg-paper px-3 py-2 font-mono text-[0.82rem] leading-relaxed">{FERNET}</pre>
        </LabBox>
      }
    />
  )
}
