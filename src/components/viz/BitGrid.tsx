/** 16x16 grid of the 256 bits of a hash. With `compare`, bits that differ are highlighted. */
export function BitGrid({ bytes, compare, label, cell = 9 }: { bytes: Uint8Array; compare?: Uint8Array; label: string; cell?: number }) {
  const bits: { on: boolean; diff: boolean }[] = []
  for (let i = 0; i < 256; i++) {
    const byte = bytes[i >> 3] ?? 0
    const on = ((byte >> (7 - (i & 7))) & 1) === 1
    const other = compare ? ((compare[i >> 3] >> (7 - (i & 7))) & 1) === 1 : on
    bits.push({ on, diff: on !== other })
  }
  return (
    <figure className="flex flex-col items-center gap-1">
      <div role="img" aria-label={label} className="grid gap-px border border-line bg-line" style={{ gridTemplateColumns: `repeat(16, ${cell / 18}rem)` }}>
        {bits.map((b, i) => (
          <span key={i} style={{ width: `${cell / 18}rem`, height: `${cell / 18}rem`, background: compare ? (b.diff ? 'var(--bad)' : 'var(--panel)') : b.on ? 'var(--keyless)' : 'var(--panel)' }} />
        ))}
      </div>
      <figcaption className="text-[0.875rem] text-muted">{label}</figcaption>
    </figure>
  )
}
