// Screen-based scaling. The layout is designed at 1440x810 (base text 16px).
// On bigger screens everything grows, but only by part of the extra size (GROWTH), so large
// monitors get more room rather than giant text. The raw ratio uses BOTH width and height so
// ultrawide or short windows never overflow. Never below 1, so small screens keep the base size.
const BASE_W = 1440
const BASE_H = 810
const GROWTH = 0.55 // 0 = never grow, 1 = grow fully in proportion to the screen

export function screenScale(w: number, h: number) {
  const raw = Math.max(1, Math.min(w / BASE_W, h / BASE_H))
  return 1 + GROWTH * (raw - 1)
}

export function startScreenScaling() {
  const apply = () => {
    const k = screenScale(window.innerWidth, window.innerHeight)
    document.documentElement.style.setProperty('--k', k.toFixed(4))
  }
  apply()
  window.addEventListener('resize', apply)
}
