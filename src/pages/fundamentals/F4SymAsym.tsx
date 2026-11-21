import { useState, type ReactNode } from 'react'
import { Check, Lock, LockOpen, Package, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StepPlayer, type Step } from '../../components/viz/StepPlayer'
import { Actor } from '../../components/viz/Actor'
import { KeyChip } from '../../components/viz/KeyChip'
import { Mover } from '../../components/viz/Mover'
import { Callout } from '../../components/ui/Callout'
import { Button } from '../../components/ui/controls'
import { aesEncrypt, generateRsaOaepKeys, rsaEncrypt } from '../../lib/crypto/webcrypto'
import { randomBytes } from '../../lib/encoding'

const STEPS: Step[] = [
  { title: 'One shared key', caption: <><b>Symmetric:</b> Alice and Bob each hold a copy of the <b>same</b> key.</> },
  { title: 'Lock and send', caption: 'Alice locks the box with the shared key and sends it.' },
  { title: 'Unlock', caption: <>Bob unlocks it with his copy of the same key. Fast and simple. The catch: <b>how did Bob get the key safely?</b> If Alice sends it in the open, Eve copies it too.</> },
  { title: 'Hand out padlocks', caption: <><b>Asymmetric:</b> Bob hands out open padlocks (his <b>public key</b>) to everyone, even Eve. Only Bob has the matching <b>private key</b>.</> },
  { title: 'Snap it shut', caption: "Alice snaps one of Bob's padlocks shut on her box and sends it. No secret had to be shared first." },
  { title: 'Only Bob opens it', caption: "Eve has a padlock too, but a padlock cannot open anything. Only Bob's private key opens the box." },
  { title: 'Compare', caption: 'Symmetric is fast for bulk data; asymmetric solves key sharing and identity. Real systems combine them (hybrid, T10).' },
]

const teal = 'var(--symmetric)'
const orange = 'var(--asymmetric)'

function Crate({ lock, open, color }: { lock: boolean; open: boolean; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Package size={42} strokeWidth={1.5} />
        {lock && (
          <span className="absolute -bottom-1 -right-2 rounded-full bg-panel p-0.5" style={{ color }}>
            {open ? <LockOpen size={20} /> : <Lock size={20} />}
          </span>
        )}
      </div>
      <div className="mt-0.5 whitespace-nowrap font-mono text-[0.78rem]">{open ? 'Result: 82' : lock ? 'locked' : 'Result: 82'}</div>
    </div>
  )
}

function Scene({ title, color, active, children }: { title: string; color: string; active: boolean; children: ReactNode }) {
  return (
    <div className={`flex-1 rounded border-2 p-3 transition-opacity ${active ? 'opacity-100' : 'opacity-45'}`} style={{ borderColor: active ? color : 'var(--line)' }}>
      <div className="mb-2 font-serif text-[1.1rem] font-semibold" style={{ color }}>{title}</div>
      {children}
    </div>
  )
}

const ROWS = [
  ['Keys', 'One shared secret key', 'A public key and a private key'],
  ['Speed', 'Fast', 'Slower'],
  ['Bulk data', 'Good for large files', 'Not for large data'],
  ['Key distribution', 'Hard: the key must be shared safely', 'Easy: the public key can be shared openly'],
  ['Examples', 'AES; historically DES / 3DES', 'RSA, ECC'],
  ['Common role', 'Encrypting the data itself', 'Key exchange, signatures, identity'],
]

export default function F4SymAsym() {
  const [step, setStep] = useState(0)
  const [race, setRace] = useState<{ aes: number; rsa: number; pieces: number } | 'running' | null>(null)

  async function runRace() {
    setRace('running')
    try { await timeRace() } catch (e) { setRace(null); alert(`Speed test failed: ${(e as Error).message}`) }
  }

  async function timeRace() {
    const data = randomBytes(100 * 1024)
    const keys = await generateRsaOaepKeys(2048) // key generation is not timed
    const t0 = performance.now()
    await aesEncrypt('GCM', randomBytes(32), randomBytes(12), data)
    const t1 = performance.now()
    let pieces = 0
    for (let i = 0; i < data.length; i += 190) { await rsaEncrypt(keys.publicKey, data.subarray(i, i + 190)); pieces++ }
    const t2 = performance.now()
    setRace({ aes: t1 - t0, rsa: t2 - t1, pieces })
  }

  const scene = (s: number) => {
    const symSent = s >= 1
    const asymSent = s >= 4
    return (
      <div className="flex gap-4 p-5">
        <Scene title="Symmetric" color={teal} active={s <= 2 || s === 6}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-center gap-1"><Actor who="Alice" size={46} /><KeyChip kind="shared" label="K" /></div>
            <div className="relative mt-3 h-20 flex-1">
              <div className="absolute left-2 right-2 top-6 border-t-2 border-dashed border-line" />
              <Mover arrived={symSent}><Crate lock={s >= 1} open={s >= 2} color={teal} /></Mover>
            </div>
            <div className="flex flex-col items-center gap-1"><Actor who="Bob" size={46} /><KeyChip kind="shared" label="K" /></div>
          </div>
          <div className={`mt-3 text-[0.85rem] transition-opacity ${s >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <b className="text-bad">Key-sharing problem:</b> if K is sent as plaintext, Eve copies it and the confidentiality problem comes back.
          </div>
        </Scene>

        <Scene title="Asymmetric" color={orange} active={s >= 3}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-center gap-1">
              <Actor who="Alice" size={46} />
              <span className={s >= 3 && !asymSent ? '' : 'invisible'}><KeyChip kind="public" label="Bob's padlock" /></span>
            </div>
            <div className="relative mt-3 h-20 flex-1">
              <div className="absolute left-2 right-2 top-6 border-t-2 border-dashed border-line" />
              <Mover arrived={asymSent} visible={s >= 3}><Crate lock={s >= 4} open={s >= 5} color={orange} /></Mover>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Actor who="Bob" size={46} />
              <KeyChip kind="private" label="Private" />
              {s >= 5 && <span className="flex items-center gap-1 text-[0.8rem] text-ok"><Check size={14} /> opens it</span>}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Actor who="Eve" size={36} />
            <div className="flex flex-col gap-1 text-[0.85rem]">
              <span className={s >= 3 ? '' : 'invisible'}><KeyChip kind="public" label="Bob's padlock" /></span>
              {s >= 5 && <span className="flex items-center gap-1 text-bad"><X size={14} /> A padlock cannot unlock the box</span>}
            </div>
          </div>
        </Scene>
      </div>
    )
  }

  const raceDone = race && race !== 'running' ? race : null
  const maxMs = raceDone ? Math.max(raceDone.aes, raceDone.rsa) : 1

  return (
    <>
      <PageHeader subtitle="Two families of encryption: one shared key, or a public and private pair." />
      <StepPlayer steps={STEPS} render={scene} step={step} onStep={setStep} />

      <div className="mt-6 grid grid-cols-[1.5fr_1fr] gap-6">
        <table className={`w-full border-collapse text-[0.9rem] ${step === 6 ? 'bg-hl/30' : ''}`}>
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-1.5 pr-3"></th>
              <th className="py-1.5 pr-3 text-sym">Symmetric</th>
              <th className="py-1.5 text-asym">Asymmetric</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([h, a, b]) => (
              <tr key={h} className="border-b border-line hover:bg-hl/40">
                <th className="py-1.5 pr-3 text-left font-semibold">{h}</th>
                <td className="py-1.5 pr-3">{a}</td>
                <td className="py-1.5">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border border-line bg-panel p-4">
          <div className="font-serif text-[1.05rem] font-semibold">Speed test: encrypt 100 KB</div>
          <p className="mt-1 text-[0.85rem] text-muted">Real timings in this browser. RSA-2048 can only take 190 bytes at a time.</p>
          <Button variant="solid" className="mt-3" onClick={runRace} disabled={race === 'running'}>
            {race === 'running' ? 'Working...' : raceDone ? 'Run again' : 'Run speed test'}
          </Button>
          {raceDone && (
            <div className="mt-3 flex flex-col gap-2 text-[0.85rem]">
              {[['AES-GCM', raceDone.aes, teal, '1 operation'], ['RSA-OAEP', raceDone.rsa, orange, `${raceDone.pieces} pieces`]].map(([label, ms, color, note]) => (
                <div key={label as string}>
                  <div className="flex justify-between"><span>{label as string} <span className="text-muted">({note as string})</span></span><span className="font-mono">{(ms as number).toFixed(1)} ms</span></div>
                  <div className="mt-0.5 h-3 bg-paper"><div className="h-3" style={{ width: `${Math.max(1, ((ms as number) / maxMs) * 100)}%`, background: color as string }} /></div>
                </div>
              ))}
              <div className="font-semibold">RSA was about {Math.round(raceDone.rsa / Math.max(raceDone.aes, 0.1))}x slower.</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Callout kind="note" title="Pick the technique by security goal">
          Large file secret: AES · integrity fingerprint: SHA-256 · keyed integrity: HMAC · origin + integrity: digital signature · linking an identity to a public key: certificate (PKI) · protecting a symmetric key in transit: public-key mechanism.
        </Callout>
      </div>
    </>
  )
}
