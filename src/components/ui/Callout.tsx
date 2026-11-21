import type { ReactNode } from 'react'
import { AlertTriangle, BookOpen, FlaskConical, Info } from 'lucide-react'

type Kind = 'course' | 'misconception' | 'teaching' | 'note'

const STYLES: Record<Kind, { label: string; color: string; Icon: typeof Info }> = {
  course: { label: 'Course says', color: 'var(--ink)', Icon: BookOpen },
  misconception: { label: 'Common misconception', color: 'var(--bad)', Icon: AlertTriangle },
  teaching: { label: 'Teaching version - not secure', color: 'var(--asymmetric)', Icon: FlaskConical },
  note: { label: 'Note', color: 'var(--muted)', Icon: Info },
}

/** A labelled side note with a coloured left rule. */
export function Callout({ kind, title, children }: { kind: Kind; title?: string; children: ReactNode }) {
  const { label, color, Icon } = STYLES[kind]
  return (
    <aside className="border-l-[3px] bg-panel py-3 pl-4 pr-4" style={{ borderColor: color }}>
      <div className="mb-1 flex items-center gap-1.5 text-[0.875rem] font-semibold uppercase tracking-wide" style={{ color }}>
        <Icon size={15} aria-hidden /> {title ?? label}
      </div>
      <div className="text-[0.95rem] leading-relaxed">{children}</div>
    </aside>
  )
}
