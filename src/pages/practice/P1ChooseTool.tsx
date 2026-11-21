import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/controls'
import { Callout } from '../../components/ui/Callout'

type Bucket = 'aes' | 'pk' | 'hash' | 'sig'

const BUCKETS: { id: Bucket; label: string; color: string; link: string }[] = [
  { id: 'aes', label: 'AES', color: 'var(--symmetric)', link: '/techniques/aes' },
  { id: 'pk', label: 'Public-key mechanism', color: 'var(--asymmetric)', link: '/techniques/rsa' },
  { id: 'hash', label: 'Hash', color: 'var(--keyless)', link: '/techniques/sha256' },
  { id: 'sig', label: 'Digital signature', color: 'var(--asymmetric)', link: '/techniques/signatures' },
]

const CARDS: { id: string; text: string; answer: Bucket; why: string }[] = [
  { id: 'backup', text: 'Protecting a 10 GB backup stored on a laptop', answer: 'aes', why: 'Bulk encryption: AES is fast for large data.' },
  { id: 'update', text: 'Verifying that a software update truly came from the vendor', answer: 'sig', why: "Origin check: only the vendor's private key can make a signature that their public key verifies." },
  { id: 'iso', text: 'Checking whether a downloaded ISO file was altered', answer: 'hash', why: 'File-change check: compare the SHA-256 of your copy with the trusted published hash.' },
  { id: 'session', text: 'Protecting a short session key sent to a remote recipient', answer: 'pk', why: "Protecting a session key: lock it with the recipient's public key (the hybrid pattern)." },
]

export default function P1ChooseTool() {
  const [placed, setPlaced] = useState<Record<string, Bucket | undefined>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)

  const place = (card: string, bucket: Bucket | undefined) => { setPlaced((p) => ({ ...p, [card]: bucket })); setSelected(null) }
  const onDrop = (bucket: Bucket | undefined) => (e: DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) place(id, bucket) }
  const reset = () => { setPlaced({}); setSelected(null); setNotes({}); setRevealed(false) }
  const score = CARDS.filter((c) => placed[c.id] === c.answer).length

  const card = (c: (typeof CARDS)[number]) => {
    const where = placed[c.id]
    const right = where === c.answer
    return (
      <div
        key={c.id}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
        onClick={() => {
          // With another card selected, clicking a card that is already in a bucket places the selected card there too.
          if (selected && selected !== c.id && where) place(selected, where)
          else setSelected(selected === c.id ? null : c.id)
        }}
        className={`cursor-grab rounded border-2 bg-panel p-2.5 text-[0.92rem] transition-colors ${selected === c.id ? 'border-ink bg-hl/50' : revealed && where ? (right ? 'border-ok' : 'border-bad') : 'border-line hover:border-ink'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span>{c.text}</span>
          {revealed && where && (right ? <Check size={18} className="shrink-0 text-ok" /> : <X size={18} className="shrink-0 text-bad" />)}
        </div>
        <input
          value={notes[c.id] ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
          placeholder="Justify your choice in one sentence (optional)"
          className="mt-1.5 w-full rounded border border-line bg-paper px-2 py-1 text-[0.875rem] focus:border-ink focus:outline-none"
        />
        {revealed && !right && <div className="mt-1 text-[0.875rem]"><b>Answer:</b> {BUCKETS.find((b) => b.id === c.answer)!.label}. {c.why}</div>}
      </div>
    )
  }

  const unplaced = CARDS.filter((c) => !placed[c.id])

  return (
    <>
      <PageHeader subtitle="Four real situations. Drag each card into the right tool, or click a card and then click a bucket." />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button variant="solid" onClick={() => setRevealed(true)}>Reveal answers</Button>
        <Button onClick={reset}><RotateCcw size={14} /> Reset</Button>
        {revealed && <span className="text-[1rem]"><b>{score}</b> of 4 correct</span>}
        {selected && <span className="text-[0.88rem] text-muted">Now click a bucket to place the selected card.</span>}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop(undefined)}
        onClick={() => selected && place(selected, undefined)}
        className="mb-4 min-h-[4rem] rounded border border-dashed border-line p-2"
      >
        <div className="mb-1.5 text-[0.875rem] text-muted">Scenarios to sort ({unplaced.length} left)</div>
        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>{unplaced.map(card)}</div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {BUCKETS.map((b) => (
          <div
            key={b.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop(b.id)}
            onClick={() => selected && place(selected, b.id)}
            className={`flex min-h-[13rem] flex-col gap-2 rounded border-2 bg-paper p-2.5 ${selected ? 'cursor-pointer hover:bg-hl/30' : ''}`}
            style={{ borderColor: b.color }}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-[1.1rem] font-semibold" style={{ color: b.color }}>{b.label}</span>
              {revealed && <Link to={b.link} onClick={(e) => e.stopPropagation()} className="text-[0.875rem] underline">see demo</Link>}
            </div>
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>{CARDS.filter((c) => placed[c.id] === b.id).map(card)}</div>
          </div>
        ))}
      </div>

      {revealed && (
        <div className="mt-5">
          <Callout kind="note" title="Answers">
            <ul className="flex flex-col gap-0.5">
              {CARDS.map((c) => <li key={c.id}><b>{BUCKETS.find((b) => b.id === c.answer)!.label}:</b> {c.why}</li>)}
            </ul>
          </Callout>
        </div>
      )}
    </>
  )
}
