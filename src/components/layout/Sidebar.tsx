import { NavLink } from 'react-router-dom'
import { PAGES, PART_LABELS, type Part } from '../../routes'
import { CategoryChip } from '../ui/CategoryChip'

const PARTS: Exclude<Part, 'home'>[] = ['fundamentals', 'techniques', 'practice']

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded px-2.5 py-[0.2rem] text-[0.82rem] leading-snug ${
      isActive ? 'bg-ink text-paper' : 'text-ink hover:bg-line/60'
    }`

  return (
    <nav aria-label="Sections" className="flex h-full flex-col gap-3 overflow-y-auto px-3 py-3">
      <NavLink to="/" end onClick={onNavigate} className="px-2.5 pb-1">
        <span className="font-serif text-[1.35rem] font-semibold">CryptoLab</span>
        <span className="block text-[0.78rem] text-muted">COMP3143 · Week 7 · Basic Cryptography</span>
      </NavLink>
      {PARTS.map((part) => (
        <div key={part}>
          <div className="mb-1 px-2.5 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">{PART_LABELS[part]}</div>
          <ul className="flex flex-col gap-0.5">
            {PAGES.filter((p) => p.part === part).map((p) => (
              <li key={p.path}>
                <NavLink to={p.path} onClick={onNavigate} className={linkClass}>
                  <span className="w-7 shrink-0 font-mono text-[0.78rem] opacity-75">{p.code}</span>
                  <span className="flex-1 truncate">{p.short ?? p.title}</span>
                  {p.category && <CategoryChip category={p.category} />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
