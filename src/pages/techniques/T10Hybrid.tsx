import { useEffect, useState, type ReactNode } from 'react'
import { KeyRound, Lock, Package } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, TextArea, Verdict } from '../../components/ui/controls'
import { Callout } from '../../components/ui/Callout'
import { Actor } from '../../components/viz/Actor'
import { KeyChip } from '../../components/viz/KeyChip'
import { Mover } from '../../components/viz/Mover'
import { generateRsaOaepKeys, rsaDecrypt } from '../../lib/crypto/webcrypto'
import { hybridDecrypt, hybridEncrypt, type HybridPackage } from '../../lib/crypto/hybrid'
import { bytesToHex, bytesToUtf8, utf8ToBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

interface Run { pkg: HybridPackage; sessionKey: Uint8Array; back: string; ms: number }

function HybridDemo() {
  const [bob, setBob] = useState<CryptoKeyPair | null>(null)
  const [message, setMessage] = useState('Full exam report for COMP3143: ' + 'All 48 students passed the lab. '.repeat(12))
  const [run, setRun] = useState<Run | null>(null)
  const [busy, setBusy] = useState(false)
  const [eve, setEve] = useState<string | null>(null)

  useEffect(() => { generateRsaOaepKeys(2048).then(setBob) }, [])

  const go = async () => {
    if (!bob) return
    setBusy(true); setEve(null)
    const t0 = performance.now()
    const { pkg, sessionKey } = await hybridEncrypt(bob.publicKey, utf8ToBytes(message))
    const back = bytesToUtf8(await hybridDecrypt(bob.privateKey, pkg))
    setRun({ pkg, sessionKey, back, ms: performance.now() - t0 })
    setBusy(false)
  }
  const eveTries = async () => {
    if (!run) return
    const evePair = await generateRsaOaepKeys(2048)
    try { await rsaDecrypt(evePair.privateKey, run.pkg.wrappedKey); setEve('Unexpected: it worked') } catch (e) { setEve((e as Error).message) }
  }

  const total = run ? run.pkg.wrappedKey.length + run.pkg.iv.length + run.pkg.ciphertext.length : 0
  const seg = (label: string, n: number, color: string) => (
    <div className="flex min-w-[5.5rem] flex-col justify-center overflow-hidden px-2 py-1 text-[0.78rem] text-white" style={{ flexGrow: n, background: color }}>
      <b>{label}</b><span className="font-mono">{n} bytes</span>
    </div>
  )

  return (
    <>
      <div className="flex items-center gap-2 text-[0.85rem]">
        {bob ? <><KeyChip kind="public" label="Bob's public key" /><KeyChip kind="private" label="Bob's private key" /><span className="text-muted">RSA-2048, made on this page</span></> : <span className="text-muted">Generating Bob's RSA-2048 key pair...</span>}
      </div>
      <TextArea label={`Message (${utf8ToBytes(message).length} bytes: far too long for RSA alone, which takes 190)`} value={message} onChange={setMessage} rows={3} />
      <Button variant="solid" onClick={go} disabled={!bob || busy}>{busy ? 'Working...' : 'Encrypt with hybrid and send to Bob'}</Button>

      {run && (
        <>
          <Block title="Alice's side">
            <DataBox label="1. New AES-256 session key (random, used once)">{bytesToHex(run.sessionKey)}</DataBox>
            <DataBox label="2. Session key wrapped with Bob's RSA public key">{bytesToHex(run.pkg.wrappedKey).slice(0, 96)}…</DataBox>
            <DataBox label="3. Message encrypted with AES-GCM (session key)">{bytesToHex(run.pkg.ciphertext).slice(0, 96)}…</DataBox>
          </Block>
          <Block title={`4. The package sent (${total} bytes)`}>
            <div className="flex h-12 w-full gap-px">
              {seg('Wrapped key', run.pkg.wrappedKey.length, 'var(--asymmetric)')}
              {seg('IV', run.pkg.iv.length, 'var(--muted)')}
              {seg('Ciphertext', run.pkg.ciphertext.length, 'var(--symmetric)')}
            </div>
          </Block>
          <Block title="Bob's side">
            <p className="text-[0.88rem]">Bob unwraps the session key with his private key, then decrypts the message with it.</p>
            <DataBox tone="ok">{run.back.slice(0, 160)}{run.back.length > 160 ? '…' : ''}</DataBox>
            <Verdict ok={run.back === message}>Round trip complete in {run.ms.toFixed(1)} ms: Bob has the exact original message.</Verdict>
            <Button onClick={eveTries}>Eve copies the package and tries to unwrap the key</Button>
            {eve && <DataBox tone="bad">{eve}. Without the session key, the ciphertext is useless to her.</DataBox>}
          </Block>
        </>
      )}
    </>
  )
}

// ----- Envelope animation -----
const HOW_STEPS: Step[] = [
  { title: '1. Session key', caption: <>Alice makes a fresh, fast <b>symmetric session key</b> (the teal key).</> },
  { title: '2. Lock the data', caption: <>She locks the big data in a teal box with <b>AES</b>, using the session key. Fast, even for huge files.</> },
  { title: '3. Lock the key', caption: <>She puts the small teal key in a small box and snaps <b>Bob's orange padlock</b> (his RSA public key) on it. RSA only has to protect a few bytes.</> },
  { title: '4. Transmit', caption: 'Both boxes travel to Bob. Eve copies both, but she cannot open the small box, so she never gets the teal key.' },
  { title: 'Bob opens', caption: <>Bob opens the small box with his <b>private key</b>, takes out the teal key, and opens the data box with it.</> },
]

function Box({ big, color, children, label }: { big?: boolean; color: string; children?: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Package size={big ? 52 : 34} strokeWidth={1.5} />
        <span className="absolute -bottom-1 -right-2 rounded-full bg-panel p-0.5" style={{ color }}>{children}</span>
      </div>
      <span className="mt-0.5 whitespace-nowrap text-[0.78rem]">{label}</span>
    </div>
  )
}

function howRender(s: number) {
  const sent = s >= 3
  return (
    <div className="flex min-h-[13rem] flex-col gap-3 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <Actor who="Alice" size={44} />
          {s === 0 && <KeyChip kind="shared" label="Session key" />}
        </div>
        <div className="relative mt-2 h-20 flex-1">
          <div className="absolute left-0 right-0 top-8 border-t-2 border-dashed border-line" />
          <Mover arrived={sent} visible={s >= 1}>
            <div className="flex items-end gap-4 bg-panel px-1">
              {s >= 1 && <Box big color="var(--symmetric)" label="Data (AES)">{s <= 4 && s >= 1 && (s === 4 ? <KeyRound size={18} /> : <Lock size={18} />)}</Box>}
              {s >= 2 && <Box color="var(--asymmetric)" label="Session key (RSA)"><Lock size={16} /></Box>}
            </div>
          </Mover>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Actor who="Bob" size={44} />
          <KeyChip kind="private" label="Private key" />
          {s === 4 && <><KeyChip kind="shared" label="Session key" /><span className="text-[0.85rem] text-ok">✓ data opened</span></>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Actor who="Eve" size={36} />
        {s >= 3 && <span className="text-[0.9rem] text-bad">✗ Has copies of both boxes, but no private key to open the small one, so no session key.</span>}
      </div>
    </div>
  )
}

export default function T10Hybrid() {
  return (
    <TechniqueLayout
      subtitle="Use each tool for what it does best: RSA for the key, AES for the data."
      idea={<><b>Hybrid cryptography</b> combines both families. A fast symmetric key (AES) encrypts the data, and slow public-key crypto (RSA) only encrypts that small key. You get AES's speed and RSA's easy key sharing.</>}
      analogy="send a heavy locked suitcase by courier, and post its small key separately in an envelope only the receiver can open."
      goal="Confidentiality with practical key sharing"
      courseSays={[
        '(1) Generate a fast symmetric session key, (2) protect that key with a public-key mechanism, (3) encrypt the data with a symmetric algorithm, (4) transmit.',
        'Use the expensive public-key operation for a small key and efficient symmetric encryption for the bulk data.',
        'AES and RSA are not competitors; they are combined.',
      ]}
      tryIt={() => <HybridDemo />}
      how={{ steps: HOW_STEPS, render: howRender }}
      extra={
        <>
          <Callout kind="note" title="This is how HTTPS works">Your browser uses a public-key step to agree on a session key with the website, then fast symmetric encryption for everything after. (Modern TLS 1.3 agrees on the key with Diffie-Hellman rather than sending it inside RSA, but the idea is the same.)</Callout>
          <Callout kind="note" title="Assignment tip">This page is the model answer shape for the assignment's "Explain a hybrid cryptographic design" question: name the four steps and say why each tool is used where it is.</Callout>
        </>
      }
    />
  )
}
