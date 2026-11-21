// Every technique page: Idea (left) + Try it (right), then "How it works inside"
// (one StepPlayer), then optional extra sections and the "In the lab" box.
import { useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { Callout } from '../ui/Callout'
import { StepPlayer, type Step } from '../viz/StepPlayer'

export interface HowItWorks {
  steps: Step[]
  render: (step: number) => ReactNode
  note?: ReactNode // e.g. "Illustration: simplified, not the real round values"
}

export function TechniqueLayout({ subtitle, idea, analogy, courseSays, goal, tryIt, how, extra, lab }: {
  subtitle: string
  idea: ReactNode
  analogy?: ReactNode
  courseSays: ReactNode[]
  goal?: string
  tryIt: () => ReactNode // a render function so "Reset demo" can remount it with fresh state
  how?: HowItWorks
  extra?: ReactNode
  lab?: ReactNode
}) {
  const [resetKey, setResetKey] = useState(0)
  return (
    <>
      <PageHeader subtitle={subtitle} />
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] items-start gap-6">
        <section aria-label="Idea" className="flex flex-col gap-4">
          <h2 className="text-[1.3rem]">Idea</h2>
          <div className="text-[1rem] leading-relaxed">{idea}</div>
          {analogy && <p className="text-[0.95rem] leading-relaxed text-muted"><b className="text-ink">Everyday analogy:</b> {analogy}</p>}
          {goal && <p className="text-[0.9rem]"><span className="text-muted">Security goal:</span> <b>{goal}</b></p>}
          <Callout kind="course">
            <ul className="flex list-disc flex-col gap-1 pl-4">
              {courseSays.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </Callout>
        </section>
        <div aria-label="Try it" className="flex min-w-0 flex-col gap-3 border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.3rem]">Try it</h2>
            <button className="inline-flex items-center gap-1.5 text-[0.82rem] text-muted hover:text-ink" onClick={() => setResetKey((k) => k + 1)}>
              <RotateCcw size={14} /> Reset demo
            </button>
          </div>
          <div key={resetKey} className="flex min-w-0 flex-col gap-4">{tryIt()}</div>
        </div>
      </div>

      {how && (
        <div className="mt-8">
          <h2 className="mb-1 text-[1.3rem]">How it works inside</h2>
          {how.note && <p className="mb-2 text-[0.88rem] text-muted">{how.note}</p>}
          <StepPlayer steps={how.steps} render={how.render} />
        </div>
      )}
      {extra && <div className="mt-8 flex flex-col gap-6">{extra}</div>}
      {lab && <div className="mt-8">{lab}</div>}
    </>
  )
}

/** A titled block inside the Try it panel. */
export function Block({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-sans text-[0.95rem] font-semibold">{title}</h3>
        {right}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}
