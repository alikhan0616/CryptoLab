import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StepPlayer, type Step } from '../../components/viz/StepPlayer'
import { Callout } from '../../components/ui/Callout'
import { Button, SegmentedControl, TextField } from '../../components/ui/controls'
import { KeyChip } from '../../components/viz/KeyChip'
import { useAsync } from '../../components/useAsync'
import { aesDecrypt, aesEncrypt, sha256Hex } from '../../lib/crypto/webcrypto'
import { base64ToBytes, bytesToBase64, bytesToUtf8, hexToBytes, randomBytes, textToBase64, textToBinary, textToHex, textToUrl, utf8ToBytes } from '../../lib/encoding'

type Enc = 'base64' | 'hex' | 'binary' | 'url'

const encode = (s: string, e: Enc) => (e === 'base64' ? textToBase64(s) : e === 'hex' ? textToHex(s) : e === 'binary' ? textToBinary(s) : textToUrl(s))

// Decoding needs no key: this is exactly what Eve does.
function decode(s: string, e: Enc): string {
  if (e === 'base64') return bytesToUtf8(base64ToBytes(s))
  if (e === 'hex') return bytesToUtf8(hexToBytes(s))
  if (e === 'binary') return bytesToUtf8(Uint8Array.from(s.split(' ').filter(Boolean), (b) => parseInt(b, 2)))
  return decodeURIComponent(s)
}

const STEPS: Step[] = [
  { title: 'Three lanes', caption: 'The same text goes into three different processes. They all produce something that looks unreadable. Are they the same thing?' },
  { title: 'Encoding', caption: <><b>Encoding</b> just changes the format. There is no key, so anyone can decode it. Eve reads it straight away.</> },
  { title: 'Encryption', caption: <><b>Encryption</b> needs a key. Without the key, Eve's decryption attempt fails. Only key holders can read it.</> },
  { title: 'Hashing', caption: <><b>Hashing</b> has no key and only goes one way. Nobody can reverse it, not even the owner. Eve can only guess inputs and compare.</> },
  { title: 'Summary', caption: 'Encoding is for formatting, encryption is for secrecy, hashing is for checking integrity.' },
]

function Lane({ title, color, active, children }: { title: string; color: string; active: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 rounded border-2 bg-panel p-3 transition-all ${active ? '' : 'opacity-60'}`} style={{ borderColor: active ? color : 'var(--line)' }}>
      <div className="font-serif text-[1.15rem] font-semibold" style={{ color }}>{title}</div>
      {children}
    </div>
  )
}

function EveResult({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={`rounded border px-2.5 py-1.5 text-[0.875rem] ${ok ? 'border-bad bg-bad/10' : 'border-ok bg-ok/10'}`}>
      <span className="font-semibold">{ok ? 'Eve succeeds: ' : 'Eve fails: '}</span>{children}
    </div>
  )
}

export default function F3Encoding() {
  const [text, setText] = useState('Result: 82')
  const [enc, setEnc] = useState<Enc>('base64')
  const [step, setStep] = useState(0)
  const [tried, setTried] = useState([false, false, false])
  const [shake, setShake] = useState(0)
  const [key] = useState(() => randomBytes(16))

  const encoded = encode(text, enc)
  const crypto = useAsync(async () => {
    const iv = randomBytes(12)
    const ct = await aesEncrypt('GCM', key, iv, utf8ToBytes(text))
    // Eve tries with a key she guessed. This really runs, and really fails.
    let eve = ''
    try { await aesDecrypt('GCM', randomBytes(16), iv, ct) } catch (e) { eve = (e as Error).message }
    return { ct: bytesToBase64(ct), eve }
  }, [text])
  const hash = useAsync(() => sha256Hex(text), [text])

  const show = (lane: number) => step >= lane + 1 || tried[lane]
  const tryLane = (lane: number) => {
    setTried((t) => t.map((v, i) => (i === lane ? true : v)))
    if (lane === 2) setShake((n) => n + 1)
  }
  const onStep = (n: number) => {
    setStep(n)
    if (n === 3) setShake((x) => x + 1)
    if (n === 0) setTried([false, false, false])
  }

  const out = 'break-all rounded border border-line bg-paper px-2.5 py-1.5 font-mono text-[0.875rem] leading-snug min-h-[3rem]'

  const scene = (s: number) => (
    <div className="grid grid-cols-3 gap-4 p-4">
      <Lane title="Encoding" color="var(--muted)" active={s === 0 || s === 1 || s === 4}>
        <SegmentedControl label="Encoding" value={enc} onChange={setEnc} options={[
          { value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }, { value: 'binary', label: 'Binary' }, { value: 'url', label: 'URL' },
        ]} />
        <div className="text-[0.875rem] text-muted">No key</div>
        <div className={`${out} max-h-[7rem] overflow-y-auto`}>{encoded}</div>
        <Button onClick={() => tryLane(0)}>Eve: Decode</Button>
        {show(0) && <EveResult ok>{(() => { try { return <>"{decode(encoded, enc)}"</> } catch { return '?' } })()}</EveResult>}
      </Lane>

      <Lane title="Encryption" color="var(--symmetric)" active={s === 0 || s === 2 || s === 4}>
        <div className="text-[0.875rem] text-muted">AES-GCM</div>
        <div><KeyChip kind="shared" label="Needs a key" /></div>
        <div className={out}>{crypto.value?.ct}</div>
        <Button onClick={() => tryLane(1)}>Eve: Decrypt without the key</Button>
        {show(1) && <EveResult ok={false}>{crypto.value?.eve}</EveResult>}
      </Lane>

      <Lane title="Hashing" color="var(--keyless)" active={s === 0 || s === 3 || s === 4}>
        <div className="text-[0.875rem] text-muted">SHA-256</div>
        <div className="text-[0.875rem] text-muted">No key · always 64 hex characters ({hash.value?.length ?? 0} here)</div>
        <div className={out}>{hash.value}</div>
        <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -8, 8, -4, 0] } : {}} transition={{ duration: 0.45 }}>
          <Button className="w-full justify-center" onClick={() => tryLane(2)}>Eve: Reverse</Button>
        </motion.div>
        {show(2) && <EveResult ok={false}>Not possible. You can only guess an input, hash it and compare.</EveResult>}
      </Lane>
    </div>
  )

  const rows = [
    ['Needs a key?', 'No', 'Yes', 'No'],
    ['Can be reversed?', 'Yes, by anyone', 'Yes, only with the key', 'No, one way only'],
    ['Purpose', 'Format data for transport', 'Keep data secret (confidentiality)', 'Check data was not changed (integrity)'],
    ['Example', 'Base64 in email attachments', 'AES protecting a backup', 'SHA-256 of a downloaded file'],
  ]

  return (
    <>
      <PageHeader subtitle="Three things that all turn text into gibberish, but only one of them keeps a secret." />
      <div className="mb-4">
        <TextField label="Input text (goes into all three lanes)" value={text} onChange={setText} mono maxLength={60} width="20rem" />
      </div>
      <StepPlayer steps={STEPS} render={scene} step={step} onStep={onStep} />

      <table className={`mt-6 w-full border-collapse text-[0.92rem] transition-colors ${step === 4 ? 'bg-hl/30' : ''}`}>
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="py-1.5 pr-3 font-semibold"></th>
            <th className="py-1.5 pr-3 font-semibold">Encoding</th>
            <th className="py-1.5 pr-3 font-semibold text-sym">Encryption</th>
            <th className="py-1.5 font-semibold text-keyless">Hashing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([h, ...cells]) => (
            <tr key={h} className="border-b border-line">
              <th className="py-1.5 pr-3 text-left font-semibold">{h}</th>
              {cells.map((c, i) => <td key={i} className="py-1.5 pr-3">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <Callout kind="misconception" title='Myth: "Base64 is encryption"'>
          No. Base64 has no key. Anyone can decode it, as Eve just did.
        </Callout>
        <Callout kind="misconception" title='Myth: "Hashing is another form of encryption"'>
          No. Hashing is one way and is never decrypted. It is used to check integrity, not to hide data.
        </Callout>
      </div>
    </>
  )
}
