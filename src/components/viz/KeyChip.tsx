import { KeyRound, LockOpen } from 'lucide-react'

type Kind = 'shared' | 'public' | 'private'

/** A key drawn as a chip: shared = teal, public = orange outline + open padlock, private = solid orange + key. */
export function KeyChip({ kind, label, fingerprint }: { kind: Kind; label?: string; fingerprint?: string }) {
  const color = kind === 'shared' ? 'var(--symmetric)' : 'var(--asymmetric)'
  const solid = kind !== 'public'
  const Icon = kind === 'public' ? LockOpen : KeyRound
  const text = label ?? (kind === 'shared' ? 'Shared key' : kind === 'public' ? 'Public key' : 'Private key')
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-2.5 py-0.5 text-[0.8rem] font-medium"
      style={{ borderColor: color, background: solid ? color : 'var(--panel)', color: solid ? '#fff' : color }}
    >
      <Icon size={14} aria-hidden /> {text}
      {fingerprint && <span className="font-mono opacity-85">{fingerprint}</span>}
    </span>
  )
}
