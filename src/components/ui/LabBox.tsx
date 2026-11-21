import { useState, type ReactNode } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

/** "In the lab" box: Lab 7 commands with PowerShell / Linux tabs, a copy button and what to observe. */
export function LabBox({ part, windows, linux, observe, children }: {
  part: string
  windows: string
  linux: string
  observe: ReactNode
  children?: ReactNode
}) {
  const [tab, setTab] = useState<'windows' | 'linux'>('windows')
  const [copied, setCopied] = useState(false)
  const code = tab === 'windows' ? windows : linux
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }
  return (
    <section className="border border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Terminal size={17} aria-hidden />
        <h2 className="text-[1.15rem]">In the lab</h2>
        <span className="text-[0.85rem] text-muted">Lab 7, {part}</span>
      </div>
      <div className="flex items-center gap-1 px-4 pt-3">
        {(['windows', 'linux'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t border border-b-0 px-3 py-1 text-[0.82rem] ${tab === t ? 'border-line bg-ink text-paper' : 'border-transparent text-muted hover:text-ink'}`}>
            {t === 'windows' ? 'Windows PowerShell' : 'Linux / macOS'}
          </button>
        ))}
        <button onClick={copy} className="ml-auto inline-flex items-center gap-1 text-[0.82rem] text-muted hover:text-ink">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mx-4 overflow-x-auto rounded bg-ink px-4 py-3 font-mono text-[0.85rem] leading-relaxed text-paper">{code}</pre>
      <div className="px-4 py-3 text-[0.95rem]"><b>What to observe:</b> {observe}</div>
      {children && <div className="border-t border-line px-4 py-3">{children}</div>}
    </section>
  )
}
