// Small form controls shared by every demo.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function SegmentedControl<T extends string>({ label, options, value, onChange }: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded border border-line bg-panel p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[3px] px-3 py-1 text-[0.85rem] ${value === o.value ? 'bg-ink text-paper' : 'text-ink hover:bg-line/50'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[0.9rem]">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? 'border-ink bg-ink' : 'border-line bg-line'}`}
      >
        <span className={`absolute top-0.5 h-[1rem] w-[1rem] rounded-full bg-panel shadow transition-all ${checked ? 'left-[1.22rem]' : 'left-0.5'}`} />
      </button>
      {label}
    </label>
  )
}

export function TextField({ label, value, onChange, mono, maxLength, width }: {
  label: string
  value: string
  onChange: (v: string) => void
  mono?: boolean
  maxLength?: number
  width?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-[0.8rem] text-muted" style={{ width }}>
      {label}
      <input
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded border border-line bg-panel px-2.5 py-1.5 text-[0.95rem] text-ink focus:border-ink focus:outline-none ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}

export function Button({ variant = 'outline', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' }) {
  const base = 'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[0.85rem] disabled:opacity-40 disabled:cursor-not-allowed'
  const look = variant === 'solid' ? 'bg-ink text-paper hover:bg-ink/85' : 'border border-line bg-panel text-ink hover:border-ink'
  return <button {...rest} className={`${base} ${look} ${className}`} />
}

/** Monospace output box for keys, hex and ciphertext. Breaks long strings anywhere. */
export function DataBox({ label, children, tone }: { label?: string; children: ReactNode; tone?: 'ok' | 'bad' }) {
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'bad' ? 'var(--bad)' : 'var(--line)'
  return (
    <div>
      {label && <div className="mb-1 text-[0.8rem] text-muted">{label}</div>}
      <div className="rounded border bg-panel px-2.5 py-1.5 font-mono text-[0.85rem] leading-relaxed [overflow-wrap:anywhere]" style={{ borderColor: color }}>
        {children}
      </div>
    </div>
  )
}

export function TextArea({ label, value, onChange, rows = 2, mono }: { label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-[0.8rem] text-muted">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`resize-y rounded border border-line bg-panel px-2.5 py-1.5 text-[0.95rem] text-ink focus:border-ink focus:outline-none ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}

/** Labelled group used to put a SegmentedControl or other control under a small caption. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-[0.8rem] text-muted">
      {label}
      <div className="text-ink">{children}</div>
    </div>
  )
}

/** Pass / fail result line. */
export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={`rounded border-2 px-3 py-2 text-[0.95rem] ${ok ? 'border-ok bg-ok/10' : 'border-bad bg-bad/10'}`}>
      <b className={ok ? 'text-ok' : 'text-bad'}>{ok ? '✓ ' : '✗ '}</b>{children}
    </div>
  )
}

/** Small "Teaching version - not secure" label. */
export function TeachingLabel() {
  return (
    <span className="inline-flex items-center self-start rounded border border-asym px-2 py-0.5 text-[0.78rem] font-semibold uppercase tracking-wide text-asym">
      Teaching version - not secure
    </span>
  )
}
