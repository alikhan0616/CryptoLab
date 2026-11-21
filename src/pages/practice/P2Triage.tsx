import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/controls'

const QUESTIONS = [
  {
    q: 'A file hash no longer matches the trusted value. Which security property is in doubt?',
    options: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'],
    answer: 1,
    why: 'The hash changed because the data changed: integrity is in doubt.',
    link: '/techniques/sha256', demo: 'SHA-256 avalanche demo',
  },
  {
    q: 'A signature check fails after one line of the document is edited. Why?',
    options: ["The signer's private key expired", 'Changed content invalidates the signature', 'The public key was leaked', 'Signatures only work on short messages'],
    answer: 1,
    why: "The signature covers the document's hash. Edit one line and the hash no longer matches.",
    link: '/techniques/signatures', demo: 'signature verify demo',
  },
  {
    q: 'Two users choose the same password but should not have identical stored values. What should the system add?',
    options: ['Encryption with AES', 'A longer hash output', 'A unique salt', 'Base64 encoding'],
    answer: 2,
    why: 'A unique random salt per user makes identical passwords produce different stored values.',
    link: '/techniques/salting', demo: 'salting user database',
  },
  {
    q: 'A company wants a check value that only parties with a shared secret can recompute. Which concept fits?',
    options: ['Plain SHA-256 hash', 'HMAC', 'Digital signature', 'Caesar cipher'],
    answer: 1,
    why: "HMAC mixes a shared secret key into the hash, so only key holders can make or check the tag.",
    link: '/techniques/hmac', demo: "Mallory's tampering attack",
  },
]

export default function P2Triage() {
  const [picked, setPicked] = useState<(number | null)[]>(QUESTIONS.map(() => null))
  const [shown, setShown] = useState<boolean[]>(QUESTIONS.map(() => false))
  const reveal = (i: number) => setShown((s) => s.map((v, j) => (j === i ? true : v)))
  const reset = () => { setPicked(QUESTIONS.map(() => null)); setShown(QUESTIONS.map(() => false)) }

  return (
    <>
      <PageHeader subtitle="Read the evidence, decide what it tells you. Pick an answer, then reveal." />
      <div className="mb-3 flex gap-3">
        <Button variant="solid" onClick={() => setShown(QUESTIONS.map(() => true))}>Reveal all</Button>
        <Button onClick={reset}><RotateCcw size={14} /> Reset</Button>
      </div>
      <ol className="grid grid-cols-2 gap-4">
        {QUESTIONS.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 border border-line bg-panel p-4">
            <div className="font-mono text-[0.8rem] text-muted">Evidence {i + 1}</div>
            <p className="text-[1rem] font-medium leading-snug">{item.q}</p>
            <div className="flex flex-col gap-1.5">
              {item.options.map((o, j) => {
                const isRight = j === item.answer
                const chosen = picked[i] === j
                const style = shown[i] && isRight ? 'border-ok bg-ok/10' : shown[i] && chosen ? 'border-bad bg-bad/10' : chosen ? 'border-ink bg-hl/40' : 'border-line hover:border-ink'
                return (
                  <button key={j} onClick={() => setPicked((p) => p.map((v, k) => (k === i ? j : v)))}
                    className={`flex items-center justify-between rounded border-2 px-3 py-1.5 text-left text-[0.92rem] ${style}`}>
                    {o}
                    {shown[i] && isRight && <Check size={17} className="text-ok" />}
                    {shown[i] && chosen && !isRight && <X size={17} className="text-bad" />}
                  </button>
                )
              })}
            </div>
            {shown[i] ? (
              <p className="text-[0.9rem]"><b>{item.options[item.answer]}.</b> {item.why} <Link to={item.link} className="underline">Try the {item.demo}</Link></p>
            ) : (
              <Button className="self-start" onClick={() => reveal(i)}>Reveal</Button>
            )}
          </li>
        ))}
      </ol>
    </>
  )
}
