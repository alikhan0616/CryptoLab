import { useState } from 'react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, Field, SegmentedControl, TextArea, Toggle } from '../../components/ui/controls'
import { bruteForce, caesar, caesarEncrypt, mod } from '../../lib/crypto/caesar'
import type { Step } from '../../components/viz/StepPlayer'

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LONG_SAMPLE = caesarEncrypt('The exam results for this course will be published on the student portal next week. Students should check their marks and report any problems to the teacher.', 7)

type Mode = 'encrypt' | 'decrypt' | 'brute'

function CaesarDemo() {
  const [mode, setMode] = useState<Mode>('encrypt')
  const [text, setText] = useState('HELLO')
  const [keyText, setKeyText] = useState('3')
  const [keepOther, setKeepOther] = useState(true)
  const [keepCase, setKeepCase] = useState(true)

  const raw = parseInt(keyText, 10)
  const k = mod(Number.isNaN(raw) ? 0 : raw, 26)
  const out = caesar(text, mode === 'decrypt' ? -k : k, { keepNonLetters: keepOther, keepCase })
  const used = new Set(text.toUpperCase().split(''))
  const brute = mode === 'brute' ? bruteForce(text) : null

  const preset = (t: string, key: number, m: Mode = 'encrypt') => { setText(t); setKeyText(String(key)); setMode(m) }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.8rem] text-muted">Presets:</span>
        <Button onClick={() => preset('HELLO', 3)}>HELLO +3</Button>
        <Button onClick={() => preset('CYBER', 2)}>CYBER +2</Button>
        <Button onClick={() => preset('Hello, World!', 13)}>ROT13</Button>
        <Button onClick={() => preset(LONG_SAMPLE, 0, 'brute')}>Long secret message</Button>
      </div>
      <SegmentedControl label="Mode" value={mode} onChange={setMode} options={[
        { value: 'encrypt', label: 'Encrypt' }, { value: 'decrypt', label: 'Decrypt' }, { value: 'brute', label: 'Brute force' },
      ]} />
      <TextArea label={mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'} value={text} onChange={setText} mono rows={2} />

      {mode !== 'brute' ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <Field label={`Key (shift): ${k}`}>
              <input type="range" min={0} max={25} value={k} onChange={(e) => setKeyText(e.target.value)} className="w-56 accent-[var(--symmetric)]" aria-label="Key slider" />
            </Field>
            <label className="flex flex-col gap-1 text-[0.8rem] text-muted">
              Any number
              <input value={keyText} onChange={(e) => setKeyText(e.target.value)} className="w-20 rounded border border-line bg-panel px-2 py-1 font-mono text-[0.95rem] text-ink" aria-label="Key number" />
            </label>
            {raw !== k && !Number.isNaN(raw) && <span className="pb-1.5 text-[0.85rem] text-muted">{raw} wraps round to {k} (mod 26)</span>}
          </div>
          <div className="flex flex-wrap gap-5">
            <Toggle label="Keep spaces and punctuation" checked={keepOther} onChange={setKeepOther} />
            <Toggle label="Keep upper/lower case" checked={keepCase} onChange={setKeepCase} />
          </div>
          <DataBox label={mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}>{out || ' '}</DataBox>

          <Block title="Alphabet strip">
            <div>
              <div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-px font-mono text-[0.85rem]">
                {A.split('').map((c, i) => {
                  const shifted = A[mod(i + (mode === 'decrypt' ? -k : k), 26)]
                  const hl = used.has(c)
                  return (
                    <div key={c} className={`flex flex-col items-center rounded-sm py-0.5 ${hl ? 'bg-hl' : ''}`}>
                      <span>{c}</span><span className="text-[0.78rem] text-muted">↓</span><span className="font-semibold text-sym">{shifted}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-[0.85rem] text-muted">Top row: {mode === 'decrypt' ? 'ciphertext' : 'plain'} letters. Bottom row: what each becomes. Letters in your text are highlighted.</p>
          </Block>
        </>
      ) : (
        <Block title="Try all 25 shifts">
          <p className="text-[0.9rem]">Each row is a real decryption. The score measures how far the letter counts are from normal English (lower = more English-like). The best row is highlighted.</p>
          <div className="max-h-[22rem] overflow-y-auto border border-line">
            <table className="w-full text-[0.85rem]">
              <thead className="sticky top-0 bg-paper">
                <tr className="text-left"><th className="px-2 py-1">Key</th><th className="px-2 py-1">Decryption</th><th className="px-2 py-1 text-right">Score</th></tr>
              </thead>
              <tbody>
                {brute!.rows.map((r) => (
                  <tr key={r.key} className={`border-t border-line ${r.key === brute!.bestKey ? 'bg-ok/15 font-semibold' : ''}`}>
                    <td className="px-2 py-0.5 font-mono">{r.key}</td>
                    <td className="max-w-0 truncate px-2 py-0.5 font-mono">{r.text}</td>
                    <td className="px-2 py-0.5 text-right font-mono">{Number.isFinite(r.score) ? r.score.toFixed(0) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[0.9rem]">Best guess: key <b>{brute!.bestKey}</b>. Only 25 keys means a computer (or a patient student) tries them all in seconds. Very short texts can fool the score; longer ones cannot.</p>
        </Block>
      )}
    </>
  )
}

// Step-by-step: HELLO + 3, letter by letter, then one wrap-round example.
const WORD = 'HELLO'
const KEY = 3
const HOW_STEPS: Step[] = [
  { title: 'The rule', caption: <>Number the letters A = 0 ... Z = 25. To encrypt: <b>C = (P + k) mod 26</b>. Here the key k = 3.</> },
  ...WORD.split('').map((c, i) => {
    const p = A.indexOf(c), r = (p + KEY) % 26
    return { title: `Letter ${i + 1}: ${c}`, caption: <><b>{c}</b> is at position {p}. Add the key: {p} + 3 = {p + 3}. Position {r} is <b>{A[r]}</b>.</> }
  }),
  { title: 'Wrap round', caption: <>Near the end of the alphabet we wrap round: <b>X</b> = 23, 23 + 3 = 26, and 26 mod 26 = 0, which is <b>A</b>.</> },
]

function howRender(s: number) {
  const wrap = s === HOW_STEPS.length - 1
  const idx = s - 1
  const letters = wrap ? ['X'] : WORD.split('')
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6">
      <div className="flex gap-2">
        {letters.map((c, i) => {
          const active = wrap || i === idx
          const done = wrap || i <= idx
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`flex h-12 w-12 items-center justify-center rounded border-2 font-mono text-[1.4rem] ${active ? 'border-ink bg-hl' : 'border-line'}`}>{c}</span>
              <span className="font-mono text-[0.8rem] text-muted">{A.indexOf(c)}</span>
              <span className="text-muted">↓ +3</span>
              <span className={`flex h-12 w-12 items-center justify-center rounded border-2 font-mono text-[1.4rem] ${done ? 'border-sym text-sym' : 'border-dashed border-line text-transparent'}`}>
                {A[(A.indexOf(c) + KEY) % 26]}
              </span>
              <span className="font-mono text-[0.8rem] text-muted">{done ? (A.indexOf(c) + KEY) % 26 : ''}</span>
            </div>
          )
        })}
      </div>
      <div className="rounded border border-line bg-paper px-4 py-2 font-mono text-[1.05rem]">
        {s === 0 ? 'C = (P + k) mod 26' : wrap ? 'X: (23 + 3) mod 26 = 0 = A' : `${WORD[idx]}: (${A.indexOf(WORD[idx])} + 3) mod 26 = ${(A.indexOf(WORD[idx]) + 3) % 26} = ${A[(A.indexOf(WORD[idx]) + 3) % 26]}`}
      </div>
    </div>
  )
}

export default function T1Caesar() {
  return (
    <TechniqueLayout
      subtitle="The oldest trick in the book: shift every letter along the alphabet."
      idea={<>Replace each letter with the letter a fixed number of places further along the alphabet. The number of places is the <b>key</b>. To decrypt, shift back by the same amount, so it is <b>symmetric</b>: one shared key.</>}
      analogy="two friends agree to 'move every letter 3 along' before passing notes in class."
      goal="Confidentiality (historically)"
      courseSays={[
        'Shift each letter by a fixed amount. HELLO with shift +3 = KHOOR.',
        'The shift amount is the key.',
        'Not secure today: the key space is tiny and language patterns are obvious.',
        'Class activity: CYBER with shift +2 = EADGT.',
      ]}
      tryIt={() => <CaesarDemo />}
      how={{ steps: HOW_STEPS, render: howRender }}
      extra={
        <section className="border border-line bg-panel p-4">
          <h2 className="text-[1.15rem]">Class activity</h2>
          <ol className="mt-2 list-decimal pl-5 text-[0.95rem] leading-relaxed">
            <li>In your group, encrypt <b>CYBER</b> with shift +2 (answer: <span className="font-mono">EADGT</span>).</li>
            <li>Write a short message of your own, encrypt it, and swap it with another group.</li>
            <li>Decrypt theirs. If they did not tell you the key, try the Brute force mode above.</li>
            <li>Discuss: why does Caesar fail against a determined attacker? (Only 25 keys, and letter patterns survive.)</li>
          </ol>
        </section>
      }
    />
  )
}
