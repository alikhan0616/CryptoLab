// Screen-based scaling. The layout is designed at 1440x810 (base text 18px).
// On bigger screens everything grows in proportion: k = how many times bigger the window is,
// limited by BOTH width and height so ultrawide or short windows never overflow. Never below 1,
// so the 1366x768 projector layout is unchanged.
const BASE_W = 1440
const BASE_H = 810

export function screenScale(w: number, h: number) {
  return Math.max(1, Math.min(w / BASE_W, h / BASE_H))
}

export function startScreenScaling() {
  const apply = () => {
    const k = screenScale(window.innerWidth, window.innerHeight)
    document.documentElement.style.setProperty('--k', k.toFixed(4))
  }
  apply()
  window.addEventListener('resize', apply)
}
