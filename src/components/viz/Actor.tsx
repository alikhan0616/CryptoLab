// The cast (PLAN.md Section 4): flat circles with an initial.
export type Who = 'Alice' | 'Bob' | 'Eve' | 'Mallory' | 'CA'

const LOOK: Record<Who, { border: string; bg: string; fg: string; dashed?: boolean; role: string }> = {
  Alice: { border: 'var(--ink)', bg: 'var(--panel)', fg: 'var(--ink)', role: 'Sender' },
  Bob: { border: 'var(--ink)', bg: 'var(--panel)', fg: 'var(--ink)', role: 'Receiver' },
  Eve: { border: 'var(--bad)', bg: 'var(--panel)', fg: 'var(--bad)', dashed: true, role: 'Eavesdropper' },
  Mallory: { border: 'var(--bad)', bg: 'var(--bad)', fg: '#fff', role: 'Attacker' },
  CA: { border: 'var(--asymmetric)', bg: 'var(--panel)', fg: 'var(--asymmetric)', role: 'Certificate Authority' },
}

export function Actor({ who, note, size = 56 }: { who: Who; note?: string; size?: number }) {
  const l = LOOK[who]
  return (
    <div className="flex w-[7.5rem] flex-col items-center text-center">
      <div
        className="flex items-center justify-center rounded-full font-serif font-semibold"
        style={{ width: `${size / 18}rem`, height: `${size / 18}rem`, border: `2px ${l.dashed ? 'dashed' : 'solid'} ${l.border}`, background: l.bg, color: l.fg, fontSize: `${(size * 0.42) / 18}rem` }}
        aria-hidden
      >
        {who === 'CA' ? 'CA' : who[0]}
      </div>
      <div className="mt-1 text-[0.95rem] font-semibold leading-tight">{who}</div>
      <div className="text-[0.78rem] leading-tight text-muted">{note ?? l.role}</div>
    </div>
  )
}
