import { useEffect, useState } from 'react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, Field, SegmentedControl, TextArea, Verdict } from '../../components/ui/controls'
import { LabBox } from '../../components/ui/LabBox'
import { Actor } from '../../components/viz/Actor'
import { KeyChip } from '../../components/viz/KeyChip'
import { useAsync } from '../../components/useAsync'
import { generateRsaSigningKeys, keyFingerprint, rsaSign, rsaVerify, sha256Hex } from '../../lib/crypto/webcrypto'
import { bytesToBase64, utf8ToBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

interface Pair { pair: CryptoKeyPair; fp: string }
const makePair = async (): Promise<Pair> => { const pair = await generateRsaSigningKeys(2048); return { pair, fp: await keyFingerprint(pair.publicKey) } }

function SignatureDemo() {
  const [alice, setAlice] = useState<Pair | null>(null)
  const [mallory, setMallory] = useState<Pair | null>(null)
  const [message, setMessage] = useState('Final result for Ali: 82 (A-)')
  const [signed, setSigned] = useState<{ message: string; sig: Uint8Array } | null>(null)
  const [received, setReceived] = useState('')
  const [who, setWho] = useState<'alice' | 'mallory'>('alice')

  const sign = async (pair = alice, msg = message) => {
    if (!pair) return
    const sig = await rsaSign(pair.pair.privateKey, utf8ToBytes(msg))
    setSigned({ message: msg, sig }); setReceived(msg)
  }
  useEffect(() => {
    (async () => { const a = await makePair(); setAlice(a); setMallory(await makePair()); await sign(a, message) })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const check = useAsync(async () => {
    if (!signed || !alice || !mallory) return null
    const key = (who === 'alice' ? alice : mallory).pair.publicKey
    return rsaVerify(key, signed.sig, utf8ToBytes(received))
  }, [signed, received, who, alice, mallory])

  const changeOne = () => {
    const i = received.search(/\d/) >= 0 ? received.search(/\d/) : 0
    const ch = received[i] === '9' ? '8' : /\d/.test(received[i]) ? String(+received[i] + 1) : received[i] === 'a' ? 'b' : 'a'
    setReceived(received.slice(0, i) + ch + received.slice(i + 1))
  }

  let reason = ''
  if (check.value === true) reason = "Valid. The message is unchanged and was signed with Alice's private key."
  else if (check.value === false) reason = who === 'mallory'
    ? "Invalid. This signature was not made with the private key that matches Mallory's public key."
    : received !== signed?.message ? 'Invalid. The message was changed after it was signed.' : 'Invalid.'

  return (
    <>
      <Block title="1. Alice signs">
        <div className="flex flex-wrap items-center gap-2 text-[0.85rem]">
          {alice ? <><KeyChip kind="private" label="Alice's private key" /><KeyChip kind="public" label="Alice's public key" fingerprint={alice.fp} /></> : <span className="text-muted">Generating Alice's RSA-2048 key pair...</span>}
        </div>
        <TextArea label="Message" value={message} onChange={setMessage} rows={2} />
        <Button variant="solid" onClick={() => sign()} disabled={!alice}>Sign with Alice's private key</Button>
        {signed && <DataBox label={`Signature (${signed.sig.length} bytes, Base64), RSASSA-PKCS1-v1_5 with SHA-256`}>{bytesToBase64(signed.sig)}</DataBox>}
      </Block>
      {signed && (
        <Block title="2. Bob verifies" right={<Button onClick={changeOne}>Change one character</Button>}>
          <TextArea label="Message Bob received (edit it!)" value={received} onChange={setReceived} rows={2} />
          <Field label="Check with which public key?">
            <SegmentedControl label="Public key" value={who} onChange={setWho} options={[{ value: 'alice', label: "Alice's public key" }, { value: 'mallory', label: "Mallory's public key" }]} />
          </Field>
          {check.value !== undefined && check.value !== null && <Verdict ok={check.value}>{reason}</Verdict>}
          <p className="text-[0.85rem] text-muted">Notice: the message itself was never hidden. Anyone could read it. A signature proves who signed and that nothing changed; it gives no confidentiality.</p>
        </Block>
      )}
    </>
  )
}

// ----- 4-step animation (slide 25) + Mallory branch, all real -----
const MSG = 'Final result for Ali: 82 (A-)'
const FAKE = 'Final result for Ali: 92 (A+)'
const HOW_STEPS: Step[] = [
  { title: '1. Hash', caption: 'Alice hashes her message with SHA-256 to get a short digest.' },
  { title: '2. Sign', caption: <>She signs the digest with her <b>private key</b>. The result is the <b>signature</b>.</> },
  { title: '3. Send', caption: 'Message and signature travel together. Eve can read the message: signing does not hide it.' },
  { title: '4. Verify', caption: <>Bob uses Alice's <b>public key</b> to check the signature against his own hash of the message. It matches: valid.</> },
  { title: 'Mallory edits', caption: 'Now Mallory changes one line of the message on the way, but cannot re-sign it without Alice\'s private key.' },
  { title: 'Verify fails', caption: <>Bob's hash of the edited message no longer matches the signature. <b>Changed content invalidates the signature.</b></> },
]

function HowRender({ s }: { s: number }) {
  const v = useAsync(async () => {
    const kp = await generateRsaSigningKeys(2048)
    const sig = await rsaSign(kp.privateKey, utf8ToBytes(MSG))
    return {
      d1: await sha256Hex(MSG), d2: await sha256Hex(FAKE), sig: bytesToBase64(sig),
      ok: await rsaVerify(kp.publicKey, sig, utf8ToBytes(MSG)), bad: await rsaVerify(kp.publicKey, sig, utf8ToBytes(FAKE)),
    }
  }, [])
  if (!v.value) return <div className="p-6 text-muted">Generating a real key pair...</div>
  const tampered = s >= 4
  const shown = tampered ? FAKE : MSG
  return (
    <div className="flex min-h-[14rem] flex-col gap-3 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex w-[13rem] flex-col items-center gap-1"><Actor who="Alice" size={44} /><KeyChip kind="private" label="Alice's private key" /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 font-mono text-[0.85rem]">
          <div className={`rounded border-2 px-2 py-1 ${tampered ? 'border-bad bg-bad/10' : 'border-ink'}`}>Message: {shown}</div>
          {s >= 0 && <div className="truncate rounded border border-keyless px-2 py-1">SHA-256: {v.value.d1}</div>}
          {s >= 1 && <div className="truncate rounded border-2 border-asym px-2 py-1">Signature: {v.value.sig}</div>}
        </div>
        <div className="flex w-[13rem] flex-col items-center gap-1"><Actor who="Bob" size={44} /><KeyChip kind="public" label="Alice's public key" /></div>
      </div>
      <div className="flex items-center gap-4">
        {s === 2 && <><Actor who="Eve" size={36} /><span className="text-[0.9rem]">Eve reads: "{MSG}" (not hidden)</span></>}
        {s >= 4 && <><Actor who="Mallory" size={36} /><span className="text-[0.9rem] text-bad">changed "82 (A-)" to "92 (A+)"</span></>}
      </div>
      {(s === 3 || s === 5) && (
        <div className="flex flex-col gap-1 font-mono text-[0.85rem]">
          <span className="truncate">Bob's hash of what he received: {s === 3 ? v.value.d1 : v.value.d2}</span>
          <Verdict ok={s === 3 ? v.value.ok : v.value.bad}>{s === 3 ? 'Signature valid' : 'Signature invalid: the content was changed'}</Verdict>
        </div>
      )}
    </div>
  )
}

const ROWS = [
  ['Question it answers', 'Who can read it?', 'Who signed it, and was it changed?'],
  ['Goal', 'Confidentiality', 'Authenticity, integrity, non-repudiation'],
  ['Key used to create', "Recipient's public key", "Sender's private key"],
  ['Key used to check / open', "Recipient's private key", "Sender's public key"],
  ['Output', 'Ciphertext (unreadable)', 'Signature (message stays readable)'],
]

export default function T8Signatures() {
  return (
    <TechniqueLayout
      subtitle="Prove who wrote a message, and that nobody changed it."
      idea={<>A <b>digital signature</b> is made with the sender's <b>private key</b> and checked with their <b>public key</b>. Only the sender could have made it, and any change to the message breaks it. It does <b>not</b> hide the message.</>}
      analogy="a handwritten signature that is impossible to copy and that smudges if anyone edits the page."
      goal="Authenticity, integrity, non-repudiation"
      courseSays={[
        "Hash the message, sign the hash with the sender's private key, and the recipient verifies with the sender's public key.",
        'Provides authenticity, integrity and non-repudiation. Does not provide confidentiality.',
        'Encryption answers "who can read it?"; a signature answers "who signed it, and was it changed?"',
      ]}
      tryIt={() => <SignatureDemo />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} />, note: 'Real RSA-2048 key, real SHA-256 digests, real signature checks.' }}
      extra={
        <section>
          <h2 className="mb-2 text-[1.15rem]">Encryption vs digital signature</h2>
          <table className="w-full border-collapse text-[0.9rem]">
            <thead><tr className="border-b-2 border-ink text-left"><th className="py-1.5 pr-3"></th><th className="py-1.5 pr-3">Encryption</th><th className="py-1.5">Digital signature</th></tr></thead>
            <tbody>{ROWS.map(([h, a, b]) => <tr key={h} className="border-b border-line"><th className="py-1.5 pr-3 text-left">{h}</th><td className="py-1.5 pr-3">{a}</td><td className="py-1.5">{b}</td></tr>)}</tbody>
          </table>
          <p className="mt-2 text-[0.95rem]"><b>Secure systems often use both.</b></p>
        </section>
      }
      lab={
        <LabBox
          part="Part D: sign and verify"
          windows={'openssl dgst -sha256 -sign private_key.pem -out signature.bin message.txt\nopenssl dgst -sha256 -verify public_key.pem -signature signature.bin message.txt\n# now edit message.txt and run the verify command again'}
          linux={'openssl dgst -sha256 -sign private_key.pem -out signature.bin message.txt\nopenssl dgst -sha256 -verify public_key.pem -signature signature.bin message.txt\n# now edit message.txt and run the verify command again'}
          observe={<>the original prints <span className="font-mono">Verified OK</span>. After editing the message, it prints <span className="font-mono">Verification failure</span>.</>}
        />
      }
    />
  )
}
