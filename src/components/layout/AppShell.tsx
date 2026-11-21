import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Menu, Presentation, X } from 'lucide-react'
import { PAGES, pageIndex } from '../../routes'
import { isTyping, usePresenter } from './Presenter'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const { presenter, togglePresenter, stepHandler } = usePresenter()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const index = Math.max(0, pageIndex(location.pathname))
  const prevPage = PAGES[index - 1]
  const nextPage = PAGES[index + 1]
  // Read the current index from a ref so fast key presses never use a stale page.
  const indexRef = useRef(index)
  indexRef.current = index
  const goPage = (delta: number) => {
    const target = PAGES[indexRef.current + delta]
    if (target) { indexRef.current += delta; navigate(target.path) }
  }

  // Scroll to top on every page change.
  useEffect(() => { document.getElementById('main')?.scrollTo(0, 0) }, [location.pathname])

  // Keyboard and clicker control (clickers send Page Up / Page Down).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
      const forward = e.key === 'ArrowRight' || e.key === 'PageDown'
      const back = e.key === 'ArrowLeft' || e.key === 'PageUp'
      if (forward || back) {
        e.preventDefault()
        const h = stepHandler.current
        const moved = !e.shiftKey && h ? (forward ? h.next() : h.prev()) : false
        if (!moved) goPage(forward ? 1 : -1)
      } else if (e.key === 'p' || e.key === 'P') {
        togglePresenter()
      } else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const showSidebar = !presenter || menuOpen

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && (
        <aside
          className={`w-[16rem] shrink-0 border-r border-line bg-paper ${presenter ? 'fixed inset-y-0 left-0 z-30 shadow-lg' : ''}`}
        >
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-paper px-4">
          {presenter && (
            <button className="btn-icon" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <div className="min-w-0 flex-1 truncate text-[0.85rem] text-muted">
            {PAGES[index].code && <span className="mr-2 font-mono">{PAGES[index].code}</span>}
            {PAGES[index].title}
          </div>
          <button className="btn-icon" onClick={() => goPage(-1)} disabled={!prevPage} aria-label="Previous page" title="Previous page (Shift + Left)">
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono text-[0.8rem] tabular-nums text-muted" aria-label="Page number">
            {index + 1} / {PAGES.length}
          </span>
          <button className="btn-icon" onClick={() => goPage(1)} disabled={!nextPage} aria-label="Next page" title="Next page (Shift + Right)">
            <ChevronRight size={20} />
          </button>
          <button
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[0.8rem] ${presenter ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
            onClick={togglePresenter}
            aria-pressed={presenter}
            title="Presenter mode (P)"
          >
            <Presentation size={16} /> Presenter
          </button>
        </header>
        <main id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[66.67rem] px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
