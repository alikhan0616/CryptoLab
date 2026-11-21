// The step-by-step animation player. The page owns the scene; the player owns
// the current step, the controls and the big caption under the scene.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { isTyping, useStepHandler } from '../layout/Presenter'

export interface Step { title: string; caption: ReactNode }

export function StepPlayer({ steps, render, step: controlled, onStep, autoMs = 2600 }: {
  steps: Step[]
  render: (step: number) => ReactNode
  step?: number
  onStep?: (n: number) => void
  autoMs?: number
}) {
  const [own, setOwn] = useState(0)
  const step = controlled ?? own
  const setStep = (n: number) => { const c = Math.max(0, Math.min(steps.length - 1, n)); setOwn(c); onStep?.(c) }
  const [playing, setPlaying] = useState(false)
  const last = steps.length - 1

  // Arrow keys / clicker step through the animation before changing page.
  useStepHandler({
    next: () => { if (step >= last) return false; setStep(step + 1); return true },
    prev: () => { if (step <= 0) return false; setStep(step - 1); return true },
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'r' || e.key === 'R') { setPlaying(false); setStep(0) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!playing) return
    if (step >= last) { setPlaying(false); return }
    const t = setTimeout(() => setStep(step + 1), autoMs)
    return () => clearTimeout(t)
  })

  // When stepping and the scene does not fit on screen, scroll it to the top so
  // nothing hides behind the pinned caption.
  const box = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const firstStep = useRef(true)
  const lastStepAt = useRef(0)
  const ensureVisible = () => {
    const main = document.getElementById('main')
    if (!box.current || !sceneRef.current || !barRef.current || !main) return
    const scene = sceneRef.current.getBoundingClientRect()
    const visibleBottom = main.getBoundingClientRect().bottom - barRef.current.offsetHeight
    const mainTop = main.getBoundingClientRect().top
    if (scene.bottom > visibleBottom + 1 || scene.top < mainTop - 1) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      main.scrollBy({ top: box.current.getBoundingClientRect().top - mainTop - 8, behavior: reduce ? 'auto' : 'smooth' })
    }
  }
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return }
    lastStepAt.current = Date.now()
    ensureVisible()
  }, [step])
  // Some scenes fill in a moment later (real crypto results arrive asynchronously) and grow.
  // Re-check shortly after a step change, but never yank the page while someone reads elsewhere.
  useEffect(() => {
    const el = sceneRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { if (Date.now() - lastStepAt.current < 2000) ensureVisible() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cur = steps[step]
  return (
    <section ref={box} className="border border-line bg-panel">
      <div ref={sceneRef} className="relative">{render(step)}</div>
      {/* Caption + controls stay pinned to the bottom of the screen so the presenter never loses them. */}
      <div ref={barRef} className="sticky bottom-0 z-10 bg-panel shadow-[0_-1px_0_var(--line)]">
      <div className="px-5 py-2.5">
        <div className="mb-1 font-mono text-[0.875rem] text-muted">
          Step {step + 1} of {steps.length} · {cur.title}
        </div>
        <div className="min-h-[2.6em] text-[1.1rem] leading-snug" aria-live="polite">{cur.caption}</div>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-line px-3 py-1.5">
        <button className="btn-icon" onClick={() => { setPlaying(false); setStep(0) }} aria-label="Back to start (R)" title="Back to start (R)"><RotateCcw size={17} /></button>
        <button className="btn-icon" onClick={() => setStep(step - 1)} disabled={step === 0} aria-label="Previous step" title="Previous step (Left)"><ChevronLeft size={20} /></button>
        <button className="btn-icon" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} title="Play / pause (Space)">
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="btn-icon" onClick={() => setStep(step + 1)} disabled={step === last} aria-label="Next step" title="Next step (Right)"><ChevronRight size={20} /></button>
        <button className="btn-icon" onClick={() => setStep(last)} disabled={step === last} aria-label="Go to last step" title="Last step"><SkipForward size={17} /></button>
        <div className="ml-3 flex flex-1 flex-wrap items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              className={`h-2.5 rounded-full transition-all ${i === step ? 'w-6 bg-ink' : i < step ? 'w-2.5 bg-ink/50' : 'w-2.5 bg-line'}`}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
