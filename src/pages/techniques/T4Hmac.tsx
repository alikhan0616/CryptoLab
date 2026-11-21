import { useState, type ReactNode } from 'react'
import { Dices } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, SegmentedControl, TextField, Toggle, Verdict } from '../../components/ui/controls'
import { Actor } from '../../components/viz/Actor'
import { useAsync } from '../../components/useAsync'
import { hmacSha256, sha256 } from '../../lib/crypto/webcrypto'
import { bytesToHex, randomBytes, utf8ToBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

const hex = async (p: Promise<Uint8Array>) => bytesToHex(await p)
const safeHmac = (k: string, m: string) => (k ? hex(hmacSha256(k, m)) : Promise.resolve(''))

function HmacDemo() {
  const [message, setMessage] = useState('Pay Rs 1,000 to Bob')
  const [key, setKey] = useState('shared-secret-42')
  const tag = useAsync(() => safeHmac(key, message), [key, message])

  const [rKey, setRKey] = useState('shared-secret-42')
  const [rMsg, setRMsg] = useState('Pay Rs 1,000 to Bob')
  const [rTag, setRTag] = useState<string | null>(null)
  const receivedTag = rTag ?? tag.value ?? ''
  const check = useAsync(() => safeHmac(rKey, rMsg), [rKey, rMsg])
  const ok = !!check.value && check.value === receivedTag.trim().toLowerCase()

  return (
    <>
      <Block title="Alice makes a tag">
        <TextField label="Message" value={message} onChange={setMessage} />
        <div className="flex items-end gap-2">
          <div className="flex-1"><TextField label="Secret key (shared only by Alice and Bob)" value={key} onChange={setKey} mono /></div>
          <Button onClick={() => setKey(bytesToHex(randomBytes(16)))}><Dices size={15} /> Random key</Button>
        </div>
        <DataBox label="HMAC-SHA256 tag">{key ? tag.value : <span className="text-bad">The key cannot be empty</span>}</DataBox>
      </Block>

      <Block title="Bob checks it" right={<Button onClick={() => { setRMsg(message); setRKey(key); setRTag(null) }}>Copy what Alice sent</Button>}>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Received message" value={rMsg} onChange={setRMsg} />
          <TextField label="Bob's key" value={rKey} onChange={setRKey} mono />
        </div>
        <TextField label="Received tag" value={receivedTag} onChange={setRTag} mono />
        <Verdict ok={ok}>{ok ? 'Tag matches: the message is unchanged and came from someone with the key.' : 'Tag does not match: the message was changed, or the key is different.'}</Verdict>
      </Block>
      <MalloryAttack />
    </>
  )
}

function MalloryAttack() {
  const [mode, setMode] = useState<'hash' | 'hmac'>('hash')
  const [knowsKey, setKnowsKey] = useState(false)
  const original = 'Pay Rs 1,000 to Bob'
  const fake = 'Pay Rs 9,000 to Mallory'
  const key = 'shared-secret-42'
  const r = useAsync(async () => {
    const make = (m: string, k: string) => (mode === 'hash' ? hex(sha256(m)) : hex(hmacSha256(k, m)))
    const sent = await make(original, key)
    const forged = await make(fake, knowsKey ? key : 'mallory-guess') // Mallory recomputes the check value
    const bobExpects = await make(fake, key)
    return { sent, forged, pass: forged === bobExpects }
  }, [mode, knowsKey])

  const col = (who: ReactNode, msg: string, check: string | undefined, label: string) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      {who}
      <div className="w-full rounded border border-line bg-paper p-2 text-[0.85rem]">
        <div>{msg}</div>
        <div className="mt-1 break-all font-mono text-[0.78rem] text-muted">{label}: {check?.slice(0, 16)}…</div>
      </div>
    </div>
  )
  return (
    <Block title="Mallory's tampering attack">
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl label="Check value" value={mode} onChange={setMode} options={[{ value: 'hash', label: 'A: plain SHA-256' }, { value: 'hmac', label: 'B: HMAC' }]} />
        {mode === 'hmac' && <Toggle label="Mallory knows the key" checked={knowsKey} onChange={setKnowsKey} />}
      </div>
      <div className="flex items-start gap-2">
        {col(<Actor who="Alice" size={40} />, original, r.value?.sent, mode === 'hash' ? 'hash' : 'tag')}
        <span className="mt-12 text-muted">→</span>
        {col(<Actor who="Mallory" size={40} note="Changes it" />, fake, r.value?.forged, mode === 'hash' ? 'new hash' : 'forged tag')}
        <span className="mt-12 text-muted">→</span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <Actor who="Bob" size={40} />
          {r.value && <Verdict ok={!r.value.pass}>{r.value.pass ? 'Check passes. Bob is fooled!' : 'Check fails. Bob rejects it.'}</Verdict>}
        </div>
      </div>
      <p className="text-[0.9rem]">
        {mode === 'hash'
          ? 'Anyone can compute SHA-256, so Mallory simply recomputes the hash for her fake message. A plain hash cannot stop an attacker who can replace both.'
          : knowsKey ? "With the key, Mallory can make valid tags too. The key's secrecy is the whole point." : 'Without the key, Mallory cannot make a valid tag, so the change is caught.'}
      </p>
    </Block>
  )
}

// ----- How it works: the real two-stage construction -----
const K = 'shared-secret-42'
const M = 'Pay Rs 1,000 to Bob'
const HOW_STEPS: Step[] = [
  { title: 'Inputs', caption: 'HMAC takes a secret key and a message.' },
  { title: 'Key XOR ipad', caption: <>The key is padded to 64 bytes and mixed (XOR) with the constant <b>ipad</b> (0x36 repeated).</> },
  { title: 'Inner hash', caption: <>That mixed key is joined to the message and hashed with SHA-256: the <b>inner hash</b>.</> },
  { title: 'Key XOR opad', caption: <>The key is used <b>again</b>, this time mixed with a different constant, <b>opad</b> (0x5c repeated).</> },
  { title: 'Outer hash = tag', caption: <>The second mixed key is joined to the inner hash and hashed again: the <b>outer hash</b> is the tag.</> },
  { title: 'Same as built-in', caption: "The result is exactly what the browser's built-in HMAC gives. Without the key, nobody can produce it." },
]

function HowRender({ s }: { s: number }) {
  const v = useAsync(async () => {
    const key = new Uint8Array(64); key.set(utf8ToBytes(K))
    const ipad = key.map((b) => b ^ 0x36), opad = key.map((b) => b ^ 0x5c)
    const join = (a: Uint8Array, b: Uint8Array) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o }
    const inner = await sha256(join(ipad, utf8ToBytes(M)))
    const outer = await sha256(join(opad, inner))
    const builtin = await hmacSha256(K, M)
    return { ipad: bytesToHex(ipad.slice(0, 24)) + '… (64 bytes)', opad: bytesToHex(opad.slice(0, 24)) + '… (64 bytes)', inner: bytesToHex(inner), outer: bytesToHex(outer), builtin: bytesToHex(builtin) }
  }, [])
  const row = (on: boolean, label: string, value: ReactNode, tone = 'var(--symmetric)') => (
    <div className={`grid grid-cols-[11rem_1fr] items-center gap-3 rounded border-2 px-3 py-1.5 transition-opacity ${on ? '' : 'opacity-25'}`} style={{ borderColor: on ? tone : 'var(--line)' }}>
      <span className="text-[0.85rem] font-semibold">{label}</span>
      <span className="min-w-0 font-mono text-[0.85rem] [overflow-wrap:anywhere]">{value}</span>
    </div>
  )
  if (!v.value) return <div className="p-5">...</div>
  return (
    <div className="flex flex-col gap-1.5 p-5">
      {row(true, 'Key + message', <>K = "{K}" · m = "{M}"</>, 'var(--ink)')}
      {row(s >= 1, 'K ⊕ ipad (0x36)', v.value.ipad)}
      {row(s >= 2, 'Inner hash', <>SHA-256(K⊕ipad ‖ m) = {v.value.inner}</>, 'var(--keyless)')}
      {row(s >= 3, 'K ⊕ opad (0x5c)', v.value.opad)}
      {row(s >= 4, 'Outer hash = tag', <>SHA-256(K⊕opad ‖ inner) = <b>{v.value.outer}</b></>, 'var(--keyless)')}
      {row(s >= 5, 'Built-in HMAC', <>{v.value.builtin} {v.value.builtin === v.value.outer ? <b className="text-ok">✓ identical</b> : <b className="text-bad">✗</b>}</>, 'var(--ok)')}
    </div>
  )
}

const COMPARE = [
  ['Who can create it?', 'Anyone', 'Only holders of the shared key', "Only the sender (with their private key)"],
  ['Who can check it?', 'Anyone', 'Only holders of the shared key', "Anyone with the sender's public key"],
  ['What it proves', 'Data matches the published hash', 'Data unchanged and from a key holder', 'Data unchanged and from that sender (non-repudiation)'],
]

export default function T4Hmac() {
  return (
    <TechniqueLayout
      subtitle="A hash with a secret key mixed in, so only key holders can make or check it."
      idea={<>An <b>HMAC</b> combines a secret key with hashing. The result, a <b>tag</b>, can only be created and checked by someone who knows the key. If an attacker changes the message, they cannot make a matching tag.</>}
      analogy="a wax seal stamped with a ring that only you and your friend own."
      goal="Keyed integrity and authentication"
      courseSays={[
        'A plain hash detects change, but an attacker who can replace both the message and the hash can just recompute the hash.',
        'HMAC combines a secret key with hashing to give keyed integrity and authentication.',
        'The key is shared only by trusted parties.',
      ]}
      tryIt={() => <HmacDemo />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} />, note: 'HMAC = H((K ⊕ opad) ‖ H((K ⊕ ipad) ‖ message)). Every value below is computed for real.' }}
      extra={
        <section>
          <h2 className="mb-2 text-[1.15rem]">Plain hash vs HMAC vs digital signature</h2>
          <table className="w-full border-collapse text-[0.9rem]">
            <thead><tr className="border-b-2 border-ink text-left"><th className="py-1.5 pr-3"></th><th className="py-1.5 pr-3 text-keyless">Plain hash</th><th className="py-1.5 pr-3 text-sym">HMAC</th><th className="py-1.5 text-asym">Digital signature</th></tr></thead>
            <tbody>{COMPARE.map(([h, ...c]) => <tr key={h} className="border-b border-line"><th className="py-1.5 pr-3 text-left">{h}</th>{c.map((x, i) => <td key={i} className="py-1.5 pr-3">{x}</td>)}</tr>)}</tbody>
          </table>
        </section>
      }
    />
  )
}
