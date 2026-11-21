import { useLocation } from 'react-router-dom'
import { CATEGORY_LABELS, PAGES, pageIndex } from '../../routes'
import { CategoryChip } from '../ui/CategoryChip'

/** Page title block, read from the page list so it always matches the sidebar. */
export function PageHeader({ subtitle }: { subtitle?: string }) {
  const { pathname } = useLocation()
  const page = PAGES[pageIndex(pathname)]
  if (!page) return null
  return (
    <header className="mb-5 border-b border-line pb-3">
      <div className="mb-1 flex items-center gap-3 font-mono text-[0.8rem] text-muted">
        <span>{page.code}</span>
        {page.category && (
          <span className="flex items-center gap-1.5">
            <CategoryChip category={page.category} /> {CATEGORY_LABELS[page.category]}
          </span>
        )}
        {page.level && <span>Level {page.level} of 10</span>}
      </div>
      <h1 className="text-[1.9rem] leading-tight">{page.title}</h1>
      {subtitle && <p className="mt-1 max-w-[75ch] text-[1rem] text-muted">{subtitle}</p>}
    </header>
  )
}
