import { useState, type ReactNode } from 'react'
import { Dices } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, Field, SegmentedControl, TextField, Toggle } from '../../components/ui/controls'
import { Callout } from '../../components/ui/Callout'
import { desBlock, desDecrypt, desEncrypt, desKeyHexLength, type DesAlgo, type DesMode } from '../../lib/crypto/des'
import { bytesToBase64, bytesToHex, hexToBytes, randomBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

const rnd = (n: number) => bytesToHex(randomBytes(n))
const DEFAULT_3DES = '0123456789abcdef23456789abcdef01456789abcdef0123'

function attempt<T>(f: () => T): { value?: T; error?: string } {
  try { return { value: f() } } catch (e) { return { error: (e as Error).message } }
}

function DesDemo() {
  const [algo, setAlgo] = useState<DesAlgo>('DES')
  const [mode, setMode] = useState<DesMode>('CBC')
  const [key, setKey] = useState('133457799bbcdff1')
  const [iv, setIv] = useState('0001020304050607')
  const [plain, setPlain] = useState('Exam results: 82')
  const [fmt, setFmt] = useState<'hex' | 'base64'>('hex')
  const [wrongKey, setWrongKey] = useState(false)

  const switchAlgo = (a: DesAlgo) => { setAlgo(a); setKey(a === 'DES' ? '133457799bbcdff1' : DEFAULT_3DES) }
  const enc = attempt(() => desEncrypt(algo, mode, key, iv, plain))
  // Change the FIRST hex digit: the last bit of each key byte is a parity bit that DES ignores,
  // so changing the last digit (e.g. f1 -> f0) can leave the key effectively the same.
  const decKey = wrongKey ? (key[0] === '8' ? '0' : '8') + key.slice(1) : key
  const dec = enc.value ? attempt(() => desDecrypt(algo, mode, decKey, iv, enc.value!)) : null
  const shown = enc.value ? (fmt === 'hex' ? enc.value : bytesToBase64(hexToBytes(enc.value))) : ''

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Algorithm"><SegmentedControl label="Algorithm" value={algo} onChange={switchAlgo} options={[{ value: 'DES', label: 'DES' }, { value: '3DES', label: '3DES' }]} /></Field>
        <Field label="Mode"><SegmentedControl label="Mode" value={mode} onChange={setMode} options={[{ value: 'CBC', label: 'CBC' }, { value: 'ECB', label: 'ECB' }]} /></Field>
        <span className="rounded border border-bad px-2 py-0.5 text-[0.82rem] font-semibold text-bad">
          {algo === 'DES' ? '56-bit key: broken by brute force' : 'Retired by NIST for new encryption'}
        </span>
      </div>
      <TextField label="Plaintext" value={plain} onChange={setPlain} />
      <div className="flex items-end gap-2">
        <div className="flex-1"><TextField label={`Key in hex (${desKeyHexLength(algo) / 2} bytes${algo === '3DES' ? ' = K1 | K2 | K3' : ''})`} value={key} onChange={setKey} mono /></div>
        <Button onClick={() => setKey(rnd(desKeyHexLength(algo) / 2))}><Dices size={15} /> Random</Button>
      </div>
      {mode === 'CBC' ? (
        <div className="flex items-end gap-2">
          <div className="flex-1"><TextField label="IV in hex (8 bytes, random for every message)" value={iv} onChange={setIv} mono /></div>
          <Button onClick={() => setIv(rnd(8))}><Dices size={15} /> New IV</Button>
        </div>
      ) : (
        <p className="text-[0.85rem] text-asym">ECB encrypts each 8-byte block on its own, so identical blocks give identical ciphertext. Teaching only.</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] text-muted">Ciphertext</span>
        <SegmentedControl label="Output format" value={fmt} onChange={setFmt} options={[{ value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} />
      </div>
      <DataBox tone={enc.error ? 'bad' : undefined}>{enc.error ?? shown}</DataBox>

      <Block title="Decrypt" right={<Toggle label="Use a wrong key" checked={wrongKey} onChange={setWrongKey} />}>
        {wrongKey && <p className="font-mono text-[0.8rem] text-muted break-all">Decrypting with {decKey}</p>}
        {dec && <DataBox tone={dec.error ? 'bad' : 'ok'}>{dec.error ?? dec.value}</DataBox>}
      </Block>
    </>
  )
}

// ----- How it works: Feistel rounds (illustrative) + real 3DES E-D-E chain -----
const KEY = '133457799bbcdff1'
const BLOCK = '0123456789abcdef'
const K1 = '0123456789abcdef', K2 = '23456789abcdef01', K3 = '456789abcdef0123'
const e1 = desBlock(K1, BLOCK)
const d2 = desBlock(K2, e1, true)
const e3 = desBlock(K3, d2)

// Made-up but stable values for the illustration of one round.
const FAKE_F = 'a1c3e57b'
const xor32 = (a: string, b: string) => (parseInt(a, 16) ^ parseInt(b, 16)).toString(16).padStart(8, '0')

const HOW_STEPS: Step[] = [
  { title: 'Split the block', caption: <>DES works on 64-bit blocks. Each block is split into a <b>left</b> half and a <b>right</b> half of 32 bits.</> },
  { title: 'Round function', caption: <>The right half is mixed with this round's <b>round key</b> (made from the main key) by a function F.</> },
  { title: 'XOR into the left', caption: "F's output is combined (XOR) with the left half." },
  { title: 'Swap', caption: 'The two halves swap places. That is one round.' },
  { title: '16 rounds', caption: <>Repeat <b>16 rounds</b>, each with its own round key. To decrypt, run the same steps with the round keys in reverse order.</> },
  { title: 'Real DES output', caption: <>The real result for this block and key. The key is 64 bits, but only <b>56</b> of them count: too few today.</> },
  { title: '3DES: E-D-E', caption: <>3DES runs DES three times: <b>Encrypt</b> with K1, <b>Decrypt</b> with K2, <b>Encrypt</b> with K3. These are the real values.</> },
  { title: 'Backwards compatible', caption: 'If K1 = K2 = K3, the decrypt undoes the first encrypt, and 3DES collapses to plain DES. That kept it compatible with old systems.' },
]

function Half({ label, value, hl, tone = 'var(--symmetric)' }: { label: string; value: string; hl?: boolean; tone?: string }) {
  return (
    <div className={`flex flex-col items-center rounded border-2 px-3 py-1.5 ${hl ? 'bg-hl/60' : ''}`} style={{ borderColor: tone }}>
      <span className="text-[0.78rem] text-muted">{label}</span>
      <span className="font-mono text-[1rem]">{value}</span>
    </div>
  )
}

function Chain({ items }: { items: [string, string, string][] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map(([label, value, tone], i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted">→</span>}
          <Half label={label} value={value} tone={tone} />
        </div>
      ))}
    </div>
  )
}

function howRender(s: number): ReactNode {
  const L = BLOCK.slice(0, 8), R = BLOCK.slice(8)
  const newL = xor32(L, FAKE_F)
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-4 px-6 py-5">
      {s <= 3 && (
        <>
          <div className="font-mono text-[0.9rem] text-muted">Block {BLOCK} · Round 1 of 16</div>
          <div className="flex items-center gap-6">
            <Half label="Left" value={s === 3 ? R : s >= 2 ? newL : L} hl={s === 2} />
            <Half label="Right" value={s === 3 ? newL : R} hl={s === 1} />
          </div>
          {s >= 1 && s <= 2 && (
            <div className="flex items-center gap-3 font-mono text-[0.9rem]">
              <span className="rounded border border-asym px-2 py-0.5">round key K1</span>
              <span>F(Right, K1) = {FAKE_F}</span>
              {s === 2 && <span>· Left ⊕ F = {newL}</span>}
            </div>
          )}
        </>
      )}
      {s === 4 && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">{Array.from({ length: 16 }, (_, i) => <span key={i} className="flex h-8 w-8 items-center justify-center rounded border-2 border-sym font-mono text-[0.8rem]">{i + 1}</span>)}</div>
          <span className="text-[0.85rem] text-muted">split → mix → swap, 16 times</span>
        </div>
      )}
      {s === 5 && <Chain items={[['Block', BLOCK, 'var(--ink)'], [`DES, key ${KEY}`, desBlock(KEY, BLOCK).toUpperCase(), 'var(--symmetric)']]} />}
      {s === 6 && <Chain items={[['Block', BLOCK, 'var(--ink)'], ['Encrypt K1', e1, 'var(--symmetric)'], ['Decrypt K2', d2, 'var(--asymmetric)'], ['Encrypt K3', e3, 'var(--symmetric)']]} />}
      {s === 7 && (
        <div className="flex flex-col items-center gap-2">
          <Chain items={[['Block', BLOCK, 'var(--ink)'], ['E K1', desBlock(K1, BLOCK), 'var(--symmetric)'], ['D K1', desBlock(K1, desBlock(K1, BLOCK), true), 'var(--asymmetric)'], ['E K1', desBlock(K1, desBlock(K1, desBlock(K1, BLOCK), true)), 'var(--symmetric)']]} />
          <span className="text-[0.9rem]">= plain DES with K1: <span className="font-mono">{desBlock(K1, BLOCK)}</span> ✓</span>
        </div>
      )}
    </div>
  )
}

const TIMELINE = [
  ['1977', 'DES becomes the US standard.'],
  ['1998', 'The EFF "Deep Crack" machine finds a DES key in 56 hours.'],
  ['1999+', '3DES used as a stopgap.'],
  ['2001', 'AES published as the new standard.'],
  ['After 2023', 'NIST retires 3DES for new encryption.'],
]

export default function T5Des() {
  return (
    <TechniqueLayout
      subtitle="The historical block ciphers that AES replaced."
      idea={<><b>DES</b> encrypts 64-bit blocks with a 56-bit effective key through 16 rounds of a <b>Feistel network</b>: split the block in half, mix one half with a round key, swap, repeat. <b>3DES</b> runs DES three times (Encrypt-Decrypt-Encrypt with keys K1, K2, K3) to make the key effectively longer.</>}
      analogy="a lock that was strong in 1977, but today's tools can pick it, so we fitted three of them, and later replaced the door (AES)."
      goal="Confidentiality (historical)"
      courseSays={['DES and 3DES are historical symmetric ciphers.', 'AES is the modern replacement for DES.']}
      tryIt={() => <DesDemo />}
      how={{ steps: HOW_STEPS, render: howRender, note: 'Steps 1 to 5 are a simplified illustration (the round values are made up). The DES output and the 3DES chain values are real.' }}
      extra={
        <div className="grid grid-cols-2 gap-6">
          <section>
            <h2 className="mb-2 text-[1.15rem]">Key space</h2>
            {[['DES', 56], ['3DES (effective)', 112], ['AES-128', 128]].map(([n, bits]) => (
              <div key={n} className="mb-1.5 text-[0.9rem]">
                <div className="flex justify-between"><span>{n}</span><span className="font-mono">2<sup>{bits}</sup> keys</span></div>
                <div className="h-3 bg-line"><div className="h-3 bg-sym" style={{ width: `${((bits as number) / 128) * 100}%` }} /></div>
              </div>
            ))}
            <p className="mt-1 text-[0.85rem] text-muted">Bar length is the number of key bits (a log scale). Each extra bit doubles the number of keys: AES-128 has 2<sup>72</sup> times more keys than DES.</p>
          </section>
          <section>
            <h2 className="mb-2 text-[1.15rem]">Timeline</h2>
            <ol className="flex flex-col gap-1 border-l-2 border-line pl-4 text-[0.9rem]">
              {TIMELINE.map(([y, t]) => <li key={y}><b className="font-mono">{y}</b> {t}</li>)}
            </ol>
          </section>
          <div className="col-span-2"><Callout kind="note">Use AES for anything new. DES and 3DES appear here so you can recognise them in older systems.</Callout></div>
        </div>
      }
    />
  )
}
