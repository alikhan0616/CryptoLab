import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, Field, SegmentedControl, TeachingLabel, TextField } from '../../components/ui/controls'
import { LabBox } from '../../components/ui/LabBox'
import { Actor } from '../../components/viz/Actor'
import { KeyChip } from '../../components/viz/KeyChip'
import { useAsync } from '../../components/useAsync'
import { exportPrivatePem, exportPublicPem, generateRsaOaepKeys, rsaDecrypt, rsaEncrypt, rsaOaepMaxBytes, type RsaBits } from '../../lib/crypto/webcrypto'
import { suggestE, toyDecrypt, toyEncrypt, toyKeys, trialFactor } from '../../lib/crypto/rsaToy'
import { bytesToBase64, bytesToUtf8, utf8ToBytes } from '../../lib/encoding'
import { downloadFile } from '../../lib/format'
import type { Step } from '../../components/viz/StepPlayer'

function RsaDemo() {
  const [mode, setMode] = useState<'real' | 'toy'>('real')
  return (
    <>
      <SegmentedControl label="RSA version" value={mode} onChange={setMode} options={[{ value: 'real', label: 'Real RSA (Web Crypto)' }, { value: 'toy', label: 'Toy RSA (small numbers)' }]} />
      {mode === 'real' ? <RealRsa /> : <ToyRsa />}
    </>
  )
}

interface Keys { pair: CryptoKeyPair; bits: RsaBits; ms: number; pub: string; priv: string }

function RealRsa() {
  const [bits, setBits] = useState<RsaBits>(2048)
  const [keys, setKeys] = useState<Keys | null>(null)
  const [busy, setBusy] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [message, setMessage] = useState('Exam results: 82')
  const [runs, setRuns] = useState(0)
  const [eve, setEve] = useState<string | null>(null)

  const generate = async (b: RsaBits) => {
    setBusy(true); setReveal(false); setEve(null)
    const t0 = performance.now()
    const pair = await generateRsaOaepKeys(b)
    const ms = performance.now() - t0
    setKeys({ pair, bits: b, ms, pub: await exportPublicPem(pair.publicKey), priv: await exportPrivatePem(pair.privateKey) })
    setBusy(false)
  }
  useEffect(() => { generate(2048) }, [])

  const max = rsaOaepMaxBytes(keys?.bits ?? bits)
  const size = utf8ToBytes(message).length
  const enc = useAsync(async () => {
    if (!keys) return null
    const m = utf8ToBytes(message)
    const c1 = await rsaEncrypt(keys.pair.publicKey, m)
    const c2 = await rsaEncrypt(keys.pair.publicKey, m) // same message again: different ciphertext
    const back = bytesToUtf8(await rsaDecrypt(keys.pair.privateKey, c1))
    return { c1, c2, back }
  }, [keys, message, runs])

  const eveTries = async () => {
    if (!keys || !enc.value) return
    setEve('Eve is generating her own key pair...')
    const evePair = await generateRsaOaepKeys(keys.bits)
    try { await rsaDecrypt(evePair.privateKey, enc.value.c1); setEve('Unexpected: it worked') } catch (e) { setEve((e as Error).message) }
  }

  return (
    <>
      <Block title="1. Bob generates a key pair">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl label="Key size" value={String(bits)} onChange={(v) => setBits(+v as RsaBits)} options={[{ value: '1024', label: '1024 (demo only)' }, { value: '2048', label: '2048' }, { value: '4096', label: '4096' }]} />
          <Button variant="solid" onClick={() => generate(bits)} disabled={busy}>{busy ? 'Working...' : 'Generate keys'}</Button>
          {keys && !busy && <span className="text-[0.875rem] text-muted">RSA-{keys.bits} made in {(keys.ms / 1000).toFixed(2)} s</span>}
        </div>
        {keys && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center justify-between"><KeyChip kind="public" label="public_key.pem" /><span className="text-[0.875rem] text-muted">may be shared</span></div>
              <pre className="h-28 overflow-auto rounded border border-line bg-paper p-2 font-mono text-[0.875rem] leading-snug">{keys.pub}</pre>
              <Button onClick={() => downloadFile('public_key.pem', keys.pub, 'application/x-pem-file')}><Download size={14} /> Download</Button>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center justify-between"><KeyChip kind="private" label="private_key.pem" /><span className="text-[0.875rem] text-bad">keep secret</span></div>
              <div className="relative">
                <pre className={`h-28 overflow-auto rounded border border-line bg-paper p-2 font-mono text-[0.875rem] leading-snug ${reveal ? '' : 'select-none blur-sm'}`}>{keys.priv}</pre>
                {!reveal && <button onClick={() => setReveal(true)} className="absolute inset-0 m-auto flex h-9 w-28 items-center justify-center gap-1.5 rounded bg-ink text-[0.875rem] text-paper"><Eye size={15} /> Reveal</button>}
              </div>
              <Button onClick={() => downloadFile('private_key.pem', keys.priv, 'application/x-pem-file')}><Download size={14} /> Download</Button>
            </div>
          </div>
        )}
      </Block>

      <Block title="2. Alice encrypts with Bob's public key">
        <TextField label={`Message (${size} of max ${max} bytes for RSA-${keys?.bits ?? bits})`} value={message} onChange={setMessage} />
        {size > max ? (
          <DataBox tone="bad">
            Too long: RSA-OAEP can only encrypt {max} bytes with this key. <b>This is why we use hybrid encryption</b>: RSA protects a small key, AES encrypts the data. See <Link to="/techniques/hybrid" className="underline">T10 Hybrid</Link>.
          </DataBox>
        ) : enc.value && (
          <>
            <DataBox label={`Ciphertext (${enc.value.c1.length} bytes)`}>{bytesToBase64(enc.value.c1).slice(0, 120)}…</DataBox>
            <DataBox label="Same message encrypted again">{bytesToBase64(enc.value.c2).slice(0, 120)}…</DataBox>
            <p className="text-[0.875rem] text-muted">Different every time: OAEP adds random padding, so Eve cannot spot repeated messages. <button className="underline" onClick={() => setRuns((n) => n + 1)}>Encrypt again</button></p>
          </>
        )}
      </Block>

      {size <= max && enc.value && (
        <Block title="3. Who can decrypt?">
          <DataBox label="Bob, with his private key" tone="ok">{enc.value.back}</DataBox>
          <div className="flex items-center gap-3">
            <Button onClick={eveTries}>Eve tries with her own key pair</Button>
          </div>
          {eve && <DataBox tone="bad">{eve}</DataBox>}
        </Block>
      )}
    </>
  )
}

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113]

function ToyRsa() {
  const [p, setP] = useState('61')
  const [q, setQ] = useState('53')
  const [e, setE] = useState('17')
  const [m, setM] = useState('65')
  const [word, setWord] = useState('HELLO')

  let keys: ReturnType<typeof toyKeys> | null = null
  let error = ''
  try { keys = toyKeys(BigInt(p || 0), BigInt(q || 0), BigInt(e || 0)) } catch (err) { error = (err as Error).message }
  let c: bigint | null = null, back: bigint | null = null, mErr = ''
  if (keys) try { c = toyEncrypt(BigInt(m || 0), keys); back = toyDecrypt(c, keys) } catch (err) { mErr = (err as Error).message }

  const suggest = () => { try { setE(String(suggestE((BigInt(p) - 1n) * (BigInt(q) - 1n)))) } catch { /* ignore */ } }
  const t0 = performance.now()
  const factors = keys ? trialFactor(keys.n) : null
  const factorMs = performance.now() - t0

  return (
    <>
      <TeachingLabel />
      <Block title="Make the keys">
        <div className="flex flex-wrap items-end gap-3">
          {[['p', p, setP], ['q', q, setQ]].map(([label, val, set]) => (
            <label key={label as string} className="flex flex-col gap-1 text-[0.875rem] text-muted">
              Prime {label as string}
              <input list="primes" value={val as string} onChange={(ev) => (set as (v: string) => void)(ev.target.value)} className="w-20 rounded border border-line bg-panel px-2 py-1 font-mono text-[0.95rem] text-ink" />
            </label>
          ))}
          <datalist id="primes">{PRIMES.map((x) => <option key={x} value={x} />)}</datalist>
          <TextField label="Public exponent e" value={e} onChange={setE} mono width="7rem" />
          <Button onClick={suggest}>Suggest a valid e</Button>
        </div>
        {error ? <DataBox tone="bad">{error}</DataBox> : keys && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[0.9rem]">
            <span>n = p × q = {keys.n.toString()}</span>
            <span>φ = (p−1)(q−1) = {keys.phi.toString()}</span>
            <span className="text-asym">Public key: (e = {keys.e.toString()}, n = {keys.n.toString()})</span>
            <span className="text-asym">Private key: d = {keys.d.toString()}</span>
          </div>
        )}
        {keys && (
          <details className="text-[0.875rem]">
            <summary className="cursor-pointer text-muted">How d was found (extended Euclidean algorithm, {keys.steps.length} steps)</summary>
            <table className="mt-1 font-mono text-[0.875rem]">
              <tbody>{keys.steps.map((st, i) => <tr key={i}><td className="pr-3">{st.a.toString()} = {st.q.toString()} × {st.b.toString()} + {st.r.toString()}</td></tr>)}</tbody>
            </table>
            <p className="mt-1">Working back gives d = {keys.d.toString()}, because (e × d) mod φ = ({keys.e.toString()} × {keys.d.toString()}) mod {keys.phi.toString()} = {((keys.e * keys.d) % keys.phi).toString()}.</p>
          </details>
        )}
      </Block>
      {keys && (
        <Block title="Encrypt and decrypt a number">
          <TextField label={`Message m (a number below n = ${keys.n})`} value={m} onChange={setM} mono width="10rem" />
          {mErr ? <DataBox tone="bad">{mErr}</DataBox> : c !== null && (
            <div className="flex flex-col gap-1 font-mono text-[0.95rem]">
              <span>Encrypt: c = m<sup>e</sup> mod n = {m}<sup>{keys.e.toString()}</sup> mod {keys.n.toString()} = <b>{c.toString()}</b></span>
              <span>Decrypt: m = c<sup>d</sup> mod n = {c.toString()}<sup>{keys.d.toString()}</sup> mod {keys.n.toString()} = <b className="text-ok">{back?.toString()}</b></span>
            </div>
          )}
          <TextField label="Text mode: encrypt each letter's code separately" value={word} onChange={setWord} mono width="14rem" />
          <div className="flex flex-wrap gap-1.5 font-mono text-[0.875rem]">
            {word.split('').map((ch, i) => {
              const code = BigInt(ch.charCodeAt(0))
              return <span key={i} className="rounded border border-line px-1.5 py-0.5">{ch}→{code < keys!.n ? toyEncrypt(code, keys!).toString() : '?'}</span>
            })}
          </div>
          <p className="text-[0.875rem] text-bad">Warning: equal letters give equal numbers (look at the two L's). Real RSA adds random padding to stop this.</p>
        </Block>
      )}
      {factors && (
        <p className="text-[0.9rem]"><b>Why toy RSA is not secure:</b> n = {keys!.n.toString()} was factored into {factors[0].toString()} × {factors[1].toString()} in {factorMs.toFixed(2)} ms by trial division. From p and q anyone can compute d. A real 2048-bit n has 617 digits, and factoring it is not feasible.</p>
      )}
    </>
  )
}

// ----- Story animation with toy numbers -----
const T = toyKeys(61n, 53n, 17n)
const M = 65n
const C = toyEncrypt(M, T)
const HOW_STEPS: Step[] = [
  { title: 'Bob makes a key pair', caption: <>Bob generates a <b>public key</b> (e = 17, n = 3233) and a <b>private key</b> (d = 2753). The private key never leaves Bob.</> },
  { title: 'Publish the public key', caption: "Bob publishes his public key. Alice gets a copy, and so does Eve. That's fine: it is meant to be public." },
  { title: 'Alice encrypts', caption: <>Alice encrypts m = 65 with Bob's <b>public</b> key: c = 65<sup>17</sup> mod 3233 = <b>2790</b>.</> },
  { title: 'Eve tries', caption: "Eve has the ciphertext and the public key, but encrypting again does not undo it. To find d she would have to factor n, which is infeasible for real key sizes." },
  { title: 'Bob decrypts', caption: <>Bob uses his <b>private</b> key: m = 2790<sup>2753</sup> mod 3233 = <b>65</b>. Message recovered.</> },
]

function howRender(s: number) {
  return (
    <div className="flex min-h-[13rem] flex-col justify-center gap-4 px-8 py-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-center gap-1">
          <Actor who="Alice" size={46} />
          <span className={s >= 1 ? '' : 'invisible'}><KeyChip kind="public" label="Bob's public key" /></span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 pt-3">
          {s >= 2 && <div className="rounded border-2 border-asym px-3 py-1 font-mono text-[1rem]">m = {M.toString()} → c = {C.toString()}</div>}
          {s >= 2 && <span className="text-[0.875rem] text-muted">c = m<sup>e</sup> mod n</span>}
        </div>
        <div className="flex flex-col items-center gap-1">
          <Actor who="Bob" size={46} />
          <KeyChip kind="private" label="d = 2753" />
          {s >= 1 && <KeyChip kind="public" label="e = 17, n = 3233" />}
          {s >= 4 && <span className="font-mono text-[0.95rem] text-ok">decrypts: {toyDecrypt(C, T).toString()} ✓</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Actor who="Eve" size={38} />
        {s >= 1 && <KeyChip kind="public" label="Bob's public key" />}
        {s >= 3 && <span className="text-[0.9rem] text-bad">✗ Has c = {C.toString()} and the public key, but not d</span>}
      </div>
    </div>
  )
}

export default function T7Rsa() {
  return (
    <TechniqueLayout
      subtitle="Two keys: one you share with the world, one you guard."
      idea={<><b>RSA</b> uses a <b>key pair</b>. Anyone can encrypt with the <b>public key</b>, but only the matching <b>private key</b> can decrypt. Its security rests on number theory: multiplying two large primes is easy, but splitting the result back into them (factoring) is not.</>}
      analogy="Bob hands out open padlocks. Anyone can snap one shut, but only Bob's key opens it."
      goal="Confidentiality, key exchange"
      courseSays={[
        'A public/private key pair. The public key can be shared; the private key stays secret.',
        "Encrypt with the recipient's public key, decrypt with the recipient's private key.",
        'Based on number theory. Generally slower than AES, so real systems use hybrids.',
        'Know the key roles, why the private key must stay secret, and how to generate keys with tools. You do not derive the maths by hand.',
      ]}
      tryIt={() => <RsaDemo />}
      how={{ steps: HOW_STEPS, render: howRender, note: 'Uses the toy numbers p = 61, q = 53 (computed for real).' }}
      lab={
        <LabBox
          part="Part C: RSA key pair"
          windows={'openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048\nopenssl pkey -in private_key.pem -pubout -out public_key.pem'}
          linux={'openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048\nopenssl pkey -in private_key.pem -pubout -out public_key.pem'}
          observe={<>two files appear. <span className="font-mono">private_key.pem</span>: keep secret, protect access. <span className="font-mono">public_key.pem</span>: may be distributed. The keys you download above use the same PEM format.</>}
        />
      }
    />
  )
}
