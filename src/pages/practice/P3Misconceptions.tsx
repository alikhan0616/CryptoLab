import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/controls'

const MYTHS = [
  { myth: 'Hashing is another form of encryption.', fix: 'Hashing is one way and is never decrypted.', link: '/fundamentals/encoding' },
  { myth: 'The public key must be secret.', fix: 'Public keys are meant to be shared; the private key needs protection.', link: '/techniques/rsa' },
  { myth: 'A digital signature hides the message.', fix: 'Its job is authenticity and integrity, not confidentiality.', link: '/techniques/signatures' },
  { myth: 'AES and RSA are direct competitors.', fix: 'They solve different problems and are usually combined.', link: '/techniques/hybrid' },
  { myth: 'RSA is best for huge files.', fix: 'Symmetric encryption is the bulk-data choice.', link: '/fundamentals/sym-vs-asym' },
  { myth: 'A custom secret algorithm is safer.', fix: 'Peer-reviewed, standard algorithms with secret keys are preferred.', link: '/fundamentals/pipeline' },
  { myth: 'Base64 encoding is encryption.', fix: 'Anyone can decode it; there is no key.', link: '/fundamentals/encoding' },
]

function FlipCard({ myth, fix, link, flipped, onFlip }: { myth: string; fix: string; link: string; flipped: boolean; onFlip: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onClick={onFlip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onFlip() } }}
      className="group h-[12rem] w-full cursor-pointer text-left [perspective:900px]"
    >
      <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
        <div className="absolute inset-0 flex flex-col justify-between rounded border-2 border-line bg-panel p-4 [backface-visibility:hidden] group-hover:border-ink">
          <span className="text-[0.875rem] font-semibold uppercase tracking-wide text-bad">Myth</span>
          <span className="font-serif text-[1.2rem] leading-snug">"{myth}"</span>
          <span className="text-[0.875rem] text-muted">Click to check</span>
        </div>
        <div className="absolute inset-0 flex flex-col justify-between rounded border-2 border-ok bg-panel p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div>
            <span className="font-serif text-[1.5rem] font-semibold text-bad">No.</span>
            <span className="ml-2 text-[0.875rem] leading-snug text-muted">"{myth}"</span>
          </div>
          <span className="text-[1.02rem] leading-snug">{fix}</span>
          <Link to={link} onClick={(e) => e.stopPropagation()} className="self-start text-[0.875rem] underline">See it on the demo page</Link>
        </div>
      </div>
    </div>
  )
}

export default function P3Misconceptions() {
  const [flipped, setFlipped] = useState<boolean[]>(MYTHS.map(() => false))
  const allOpen = flipped.every(Boolean)
  return (
    <>
      <PageHeader subtitle="Seven things people often get wrong. Vote first, then flip the card." />
      <div className="mb-4 flex gap-3">
        <Button variant="solid" onClick={() => setFlipped(MYTHS.map(() => !allOpen))}>{allOpen ? 'Hide all' : 'Flip all'}</Button>
        <Button onClick={() => setFlipped(MYTHS.map(() => false))}><RotateCcw size={14} /> Reset</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {MYTHS.map((m, i) => (
          <FlipCard key={i} {...m} flipped={flipped[i]} onFlip={() => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)))} />
        ))}
      </div>
    </>
  )
}
