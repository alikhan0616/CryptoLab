import type { Category } from '../../routes'

const COLORS: Record<Exclude<Category, 'hybrid'>, string> = {
  symmetric: 'var(--symmetric)',
  asymmetric: 'var(--asymmetric)',
  keyless: 'var(--keyless)',
}

/** Small square colour chip for a technique category. Hybrid is split teal/orange. */
export function CategoryChip({ category, size = 10 }: { category: Category; size?: number }) {
  const background = category === 'hybrid'
    ? 'linear-gradient(90deg, var(--symmetric) 50%, var(--asymmetric) 50%)'
    : COLORS[category]
  return <span aria-hidden className="inline-block shrink-0 rounded-[2px]" style={{ width: `${size / 18}rem`, height: `${size / 18}rem`, background }} />
}

export const categoryColor = (c: Category) => (c === 'hybrid' ? 'var(--symmetric)' : COLORS[c])
