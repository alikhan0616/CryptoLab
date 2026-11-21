import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Lock, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StepPlayer, type Step } from '../../components/viz/StepPlayer'
import { Actor } from '../../components/viz/Actor'
import { KeyChip } from '../../components/viz/KeyChip'
import { Mover } from '../../components/viz/Mover'
import { Callout } from '../../components/ui/Callout'
import { TextField, Toggle } from '../../components/ui/controls'
import { useAsync } from '../../components/useAsync'
import { aesDecrypt, aesEncrypt } from '../../lib/crypto/webcrypto'
import { bytesToBase64, bytesToUtf8, randomBytes, utf8ToBytes } from '../../lib/encoding'

const STEPS: Step[] = [
  { title: 'The setup', caption: <>Alice, in the teacher's office, must send an exam result to Bob's student portal. The network in between is <b>untrusted</b>.</> },
  { title: 'Send', caption: 'Alice sends the result as plain, readable text.' },
  { title: 'Eve copies it', caption: <>Eve taps the line and copies the packet. She can read every word.</> },
  { title: 'Which property?', caption: 'Which security property do we need here? Pick one in the card.' },
  { title: 'Encrypt', caption: <>Turn encryption on. The packet becomes scrambled <b>ciphertext</b>. Eve's copy is useless; Bob decrypts it with the shared key.</> },
  { title: 'What Eve still sees', caption: <>Encryption hides the <b>meaning</b> of a message, not its <b>existence</b>. Eve still sees that a packet was sent, and how big it was.</> },
]

const OPTIONS = ['Confidentiality', 'Integrity', 'Availability'] as const

export default function F1Why() {
  const [message, setMessage] = useState('Result: 82')
  const [step, setStep] = useState(0)
  const [encrypted, setEncrypted] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [key] = useState(() => randomBytes(16))

  // Real AES-128-GCM with a key Alice and Bob share.
  const enc = useAsync(async () => {
    const iv = randomBytes(12)
    const ct = await aesEncrypt('GCM', key, iv, utf8ToBytes(message))
    const back = bytesToUtf8(await aesDecrypt('GCM', key, iv, ct))
    return { b64: bytesToBase64(ct), size: ct.length, back }
  }, [message])

  const onStep = (n: number) => {
    setStep(n)
    if (n >= 4) setEncrypted(true)
    if (n < 4) setEncrypted(false)
  }

  const sent = step >= 1
  const packetText = encrypted ? enc.value?.b64 ?? '...' : message

  const scene = (s: number) => (
    <div className="px-6 pb-4 pt-6">
      {/* Top row: Alice --- channel --- Bob */}
      <div className="flex items-start gap-4">
        <Actor who="Alice" note="Teacher's office" />
        <div className="relative mt-6 h-[4.5rem] flex-1">
          <div className="absolute left-0 right-0 top-[1.4rem] border-t-2 border-dashed border-line" />
          <div className="absolute -top-5 left-0 right-0 text-center text-[0.875rem] text-muted">Untrusted network</div>
          <Mover arrived={sent} className="w-[16rem]">
            <div className={`rounded border-2 bg-panel px-2.5 py-1.5 font-mono text-[0.875rem] leading-snug [overflow-wrap:anywhere] ${encrypted ? 'border-sym' : 'border-ink'}`}>
              {encrypted && <Lock size={13} className="mr-1 inline text-sym" aria-label="Encrypted" />}
              {packetText}
            </div>
          </Mover>
        </div>
        <div className="flex flex-col items-center">
          <Actor who="Bob" note="Student portal" />
        </div>
      </div>

      {/* Bottom row: Eve's notebook, Bob's decryption, question card */}
      <div className="mt-4 grid grid-cols-[1.45fr_1fr_1fr] items-start gap-5">
        <div className="flex items-start gap-3">
          <Actor who="Eve" size={46} />
          <motion.div
            className="min-h-[5.5rem] flex-1 rounded border border-dashed border-bad bg-paper p-2.5"
            initial={false}
            animate={{ opacity: s >= 2 ? 1 : 0.25 }}
          >
            <div className="text-[0.875rem] font-semibold text-bad">Eve's notebook</div>
            {s >= 2 ? (
              <>
                <div className="mt-1 font-mono text-[0.875rem] [overflow-wrap:anywhere]">{packetText}</div>
                <div className="mt-1 text-[0.875rem]">
                  {encrypted
                    ? s >= 5
                      ? <>Unreadable. But she knows a <b>{enc.value?.size}-byte</b> packet went from Alice to Bob.</>
                      : 'Unreadable without the key.'
                    : <b className="text-bad">Fully readable!</b>}
                </div>
              </>
            ) : <div className="mt-1 text-[0.875rem] text-muted">(empty)</div>}
          </motion.div>
        </div>

        <div className={`rounded border p-2.5 transition-opacity ${encrypted && s >= 1 ? 'border-sym opacity-100' : 'border-line opacity-0'}`}>
          <div className="mb-1.5 flex items-center gap-2 text-[0.875rem]"><span className="font-semibold">Bob decrypts with</span> <KeyChip kind="shared" /></div>
          <div className="font-mono text-[0.9rem] text-ok">{enc.value?.back}</div>
        </div>

        <div className={`rounded border border-line bg-paper p-2.5 transition-opacity ${s >= 3 ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <div className="text-[0.875rem] font-semibold">Which security property do we need?</div>
          <div className="mt-2 flex flex-col gap-1">
            {OPTIONS.map((o) => {
              const right = o === 'Confidentiality'
              const show = picked !== null
              return (
                <button
                  key={o}
                  onClick={() => setPicked(o)}
                  className={`flex items-center justify-between rounded border px-2.5 py-1 text-left text-[0.875rem] ${
                    show && right ? 'border-ok bg-ok/10' : show && picked === o ? 'border-bad bg-bad/10' : 'border-line bg-panel hover:border-ink'
                  }`}
                >
                  {o}
                  {show && right && <Check size={16} className="text-ok" />}
                  {show && picked === o && !right && <X size={16} className="text-bad" />}
                </button>
              )
            })}
          </div>
          {picked && <div className="mt-1.5 text-[0.875rem]">Confidentiality: only the right people can read it.</div>}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <PageHeader subtitle="Why do we need cryptography at all? Follow one exam result across an untrusted network." />
      <div className="mb-4 flex flex-wrap items-end gap-6">
        <TextField label="Message Alice sends" value={message} onChange={setMessage} mono maxLength={40} width="16rem" />
        <Toggle label="Encryption (real AES-GCM)" checked={encrypted} onChange={setEncrypted} />
      </div>
      <StepPlayer steps={STEPS} render={scene} step={step} onStep={onStep} />
      <div className="mt-6 grid grid-cols-2 gap-5">
        <Callout kind="course">
          You must send exam results over an untrusted network that an attacker can copy. The property needed is <b>confidentiality</b>.
        </Callout>
        <Callout kind="note" title="Key message">
          Encryption hides the meaning of a message, not the fact that it was sent.
        </Callout>
      </div>
    </>
  )
}
