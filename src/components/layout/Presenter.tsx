// Presenter mode + step navigation shared by the whole app.
// A page with an animation registers a step handler; arrow keys / Page Up / Page Down
// call it first and only change page when the animation is at its first/last step.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface StepHandler {
  next: () => boolean // returns true if it moved a step, false if already at the end
  prev: () => boolean
}

interface PresenterCtx {
  presenter: boolean
  togglePresenter: () => void
  registerSteps: (h: StepHandler | null) => void
  stepHandler: React.RefObject<StepHandler | null>
}

const Ctx = createContext<PresenterCtx | null>(null)

const load = () => {
  try { return localStorage.getItem('cryptolab.presenter') === '1' } catch { return false }
}

export function PresenterProvider({ children }: { children: ReactNode }) {
  const [presenter, setPresenter] = useState(load)
  const stepHandler = useRef<StepHandler | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('presenter', presenter)
    try { localStorage.setItem('cryptolab.presenter', presenter ? '1' : '0') } catch { /* ignore */ }
  }, [presenter])

  const togglePresenter = useCallback(() => setPresenter((p) => !p), [])
  const registerSteps = useCallback((h: StepHandler | null) => { stepHandler.current = h }, [])

  return <Ctx.Provider value={{ presenter, togglePresenter, registerSteps, stepHandler }}>{children}</Ctx.Provider>
}

export function usePresenter() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePresenter must be used inside PresenterProvider')
  return c
}

/** Let a page's animation take over arrow keys while it is mounted. */
export function useStepHandler(handler: StepHandler) {
  const { registerSteps } = usePresenter()
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    registerSteps({ next: () => ref.current.next(), prev: () => ref.current.prev() })
    return () => registerSteps(null)
  }, [registerSteps])
}

/** True when the key press happened inside a text box, so shortcuts must be ignored. */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}
