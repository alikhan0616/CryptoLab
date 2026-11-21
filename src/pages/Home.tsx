import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PAGES } from '../routes'
import { CategoryChip } from '../components/ui/CategoryChip'

// The course roadmap from the slides, as one horizontal line.
const ROADMAP = [
  { label: 'Fundamentals', to: '/fundamentals/why', pages: ['F1', 'F2', 'F3', 'F4'], color: 'var(--ink)' },
  { label: 'Symmetric', to: '/techniques/caesar', pages: ['T1', 'T5', 'T6'], color: 'var(--symmetric)' },
  { label: 'Asymmetric', to: '/techniques/rsa', pages: ['T7'], color: 'var(--asymmetric)' },
  { label: 'Hash / HMAC', to: '/techniques/sha256', pages: ['T2', 'T3', 'T4'], color: 'var(--keyless)' },
  { label: 'Signatures / PKI', to: '/techniques/signatures', pages: ['T8', 'T9', 'T10'], color: 'var(--asymmetric)' },
  { label: 'Practical', to: '/practice/choose-tool', pages: ['P1', 'P2', 'P3'], color: 'var(--ink)' },
]

const byCode = (code: string) => PAGES.find((p) => p.code === code)!

const KEYS = [
  ['Right / Page Down', 'next step, then next page'],
  ['Left / Page Up', 'previous step'],
  ['Shift + arrows', 'jump a whole page'],
  ['Space', 'play / pause an animation'],
  ['R', 'restart the animation'],
  ['P', 'presenter mode (bigger text)'],
  ['F', 'fullscreen'],
]

export default function Home() {
  return (
    <div>
      <p className="font-mono text-[0.8rem] text-muted">COMP3143 · Week 7 · Basic Cryptography · Easttom, Chapter 8</p>
      <h1 className="mt-1 text-[2.8rem] leading-tight">CryptoLab</h1>
      <p className="mt-2 max-w-[56ch] text-[1.15rem] leading-relaxed text-muted">
        See how cryptography works, step by step. Every key, hash and ciphertext on these pages is computed for real, right here in the browser.
      </p>
      <Link to="/fundamentals/why" className="mt-5 inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-paper hover:bg-ink/85">
        Start presenting <ArrowRight size={18} />
      </Link>

      <h2 className="mt-10 text-[1.35rem]">Roadmap</h2>
      <ol className="relative mt-4 grid grid-cols-6 gap-2">
        <div aria-hidden className="absolute left-[8%] right-[8%] top-[0.61rem] h-[2px] bg-line" />
        {ROADMAP.map((stop, i) => (
          <li key={stop.label} className="relative flex flex-col items-center text-center">
            <Link to={stop.to} className="group flex flex-col items-center">
              <span
                className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-paper font-mono text-[0.78rem] group-hover:bg-ink group-hover:text-paper"
                style={{ borderColor: stop.color }}
              >
                {i + 1}
              </span>
              <span className="mt-2 text-[0.95rem] font-semibold group-hover:underline">{stop.label}</span>
            </Link>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {stop.pages.map((code) => {
                const p = byCode(code)
                return (
                  <li key={code}>
                    <Link to={p.path} className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted hover:text-ink hover:underline">
                      {p.category && <CategoryChip category={p.category} size={8} />}
                      {p.short ?? p.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid grid-cols-[1.2fr_1fr] gap-10 border-t border-line pt-6">
        <div>
          <h2 className="text-[1.15rem]">Colour code</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-[0.95rem]">
            <li className="flex items-center gap-2"><CategoryChip category="symmetric" size={12} /> <b>Symmetric:</b> one shared key (Caesar, HMAC, DES, AES)</li>
            <li className="flex items-center gap-2"><CategoryChip category="asymmetric" size={12} /> <b>Asymmetric:</b> public and private keys (RSA, signatures, PKI)</li>
            <li className="flex items-center gap-2"><CategoryChip category="keyless" size={12} /> <b>Keyless:</b> no key at all (hashing, salting)</li>
            <li className="flex items-center gap-2"><CategoryChip category="hybrid" size={12} /> <b>Hybrid:</b> both together</li>
          </ul>
        </div>
        <div>
          <h2 className="text-[1.15rem]">Keyboard and clicker</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.9rem]">
            {KEYS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-[0.85rem]">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
