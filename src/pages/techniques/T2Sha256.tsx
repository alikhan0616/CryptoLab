import { useState } from 'react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, DataBox, SegmentedControl, TextArea, TextField } from '../../components/ui/controls'
import { BitGrid } from '../../components/viz/BitGrid'
import { LabBox } from '../../components/ui/LabBox'
import { useAsync } from '../../components/useAsync'
import { sha256, sha256Hex } from '../../lib/crypto/webcrypto'
import { bitDiff, bytesToHex, utf8ToBytes } from '../../lib/encoding'
import { downloadFile, formatBytes, OUT_FORMATS, type OutFormat } from '../../lib/format'
import type { Step } from '../../components/viz/StepPlayer'

function Sha256Demo() {
  const [text, setText] = useState('Cyber Security')
  const [fmt, setFmt] = useState<OutFormat>('hex')
  const [a, setA] = useState('Cyber Security')
  const [b, setB] = useState('Cyber security')
  const [reverse, setReverse] = useState(false)

  const digest = useAsync(() => sha256(text), [text])
  const ha = useAsync(() => sha256(a), [a])
  const hb = useAsync(() => sha256(b), [b])
  const inBytes = utf8ToBytes(text).length
  const changed = ha.value && hb.value ? bitDiff(ha.value, hb.value) : 0

  const changeOne = () => {
    if (!b.length) return
    const i = Math.floor(Math.random() * b.length)
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    let c = letters[Math.floor(Math.random() * 26)]
    if (c === b[i]) c = c === 'a' ? 'b' : 'a'
    setB(b.slice(0, i) + c + b.slice(i + 1))
  }

  return (
    <>
      <Block title="Hash any text">
        <TextArea label="Input" value={text} onChange={setText} rows={2} />
        <div className="flex items-center justify-between gap-3">
          <SegmentedControl label="Output format" value={fmt} onChange={setFmt} options={OUT_FORMATS} />
          <Button onClick={() => setReverse(true)}>Reverse this hash</Button>
        </div>
        <DataBox label="SHA-256 digest">{digest.value ? formatBytes(digest.value, fmt) : '...'}</DataBox>
        {reverse && <p className="text-[0.9rem] text-bad">Not possible. A hash is one way. The only attack is to guess inputs, hash each one and compare. That is why weak passwords are dangerous (next page: salting).</p>}
        <div className="flex flex-col gap-1 text-[0.875rem]">
          <div className="flex items-center gap-2"><span className="w-24 text-muted">Input</span><div className="h-2.5 bg-keyless/40" style={{ width: `${Math.min(100, 4 + inBytes)}%` }} /><span className="font-mono">{inBytes} bytes</span></div>
          <div className="flex items-center gap-2"><span className="w-24 text-muted">Output</span><div className="h-2.5 bg-keyless" style={{ width: '36%' }} /><span className="font-mono">32 bytes, always</span></div>
        </div>
      </Block>

      <Block title="Avalanche effect">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Input A" value={a} onChange={setA} mono />
          <TextField label="Input B" value={b} onChange={setB} mono />
        </div>
        <div className="flex flex-wrap items-start justify-around gap-3">
          {ha.value && <BitGrid bytes={ha.value} label="Hash A (256 bits)" cell={8} />}
          {hb.value && <BitGrid bytes={hb.value} label="Hash B (256 bits)" cell={8} />}
          {ha.value && hb.value && <BitGrid bytes={ha.value} compare={hb.value} label="Bits that differ" cell={8} />}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[1.05rem]"><b>{changed}</b> of 256 bits changed (<b>{Math.round((changed / 256) * 100)}%</b>)</p>
          <Button onClick={changeOne}>Change one character in B</Button>
        </div>
        <p className="text-[0.875rem] text-muted">A tiny change to the input flips about half of the output bits. You cannot tell from two hashes how similar the inputs were.</p>
      </Block>
    </>
  )
}

// ----- How it works inside (simplified illustration, real padding and real digest) -----
const MSG = 'abc'
const HOW_STEPS: Step[] = [
  { title: 'Message to bytes', caption: <>The message is turned into bytes. "abc" is 3 bytes: 61 62 63 (hex).</> },
  { title: 'Padding', caption: <>The bytes are <b>padded</b> to fill a fixed 64-byte (512-bit) block: a single 1 bit (0x80), zeros, then the message length in bits at the end.</> },
  { title: 'Mixing rounds', caption: <>Eight working values (a to h) are scrambled together with the block, round after round. Each round mixes in a bit more of the message.</> },
  { title: '64 rounds', caption: <>After <b>64 rounds</b> every output bit depends on every input bit. That is where the avalanche effect comes from.</> },
  { title: 'Digest', caption: <>The final values form the <b>digest</b>: always 256 bits, written as 64 hex characters, whatever the input length.</> },
]

const PAD = (() => {
  const m = utf8ToBytes(MSG)
  const block = new Uint8Array(64)
  block.set(m)
  block[m.length] = 0x80
  block[63] = m.length * 8 // length in bits fits in one byte here
  return { block, len: m.length }
})()

function Rounds({ round }: { round: number }) {
  // Illustrative values only: we do not compute real SHA-256 round states (PLAN 1A).
  const words = useAsync(() => sha256Hex(`illustration-${round}`), [round])
  const names = 'abcdefgh'.split('')
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-mono text-[0.875rem] text-muted">Round {round} of 64</div>
      <div className="grid grid-cols-8 gap-1.5">
        {names.map((n, i) => (
          <div key={n} className="flex flex-col items-center rounded border border-keyless/50 bg-paper px-1.5 py-1">
            <span className="text-[0.875rem] text-muted">{n}</span>
            <span className="font-mono text-[0.875rem]">{words.value?.slice(i * 8, i * 8 + 8) ?? '........'}</span>
          </div>
        ))}
      </div>
      <div className="h-2 w-80 bg-line"><div className="h-2 bg-keyless" style={{ width: `${(round / 64) * 100}%`, transition: 'width 500ms ease-out' }} /></div>
    </div>
  )
}

function HowRender({ s }: { s: number }) {
  const digest = useAsync(() => sha256Hex(MSG), [])
  return (
    <div className="flex min-h-[13rem] flex-col items-center justify-center gap-3 px-6 py-5">
      {s === 0 && (
        <div className="flex items-center gap-4 font-mono text-[1.3rem]">
          <span>"abc"</span><span className="text-muted">→</span>
          {Array.from(utf8ToBytes(MSG)).map((x, i) => <span key={i} className="rounded border-2 border-keyless px-2 py-1">{x.toString(16)}</span>)}
        </div>
      )}
      {s === 1 && (
        <div className="grid grid-cols-16 gap-1 font-mono text-[0.875rem]" style={{ gridTemplateColumns: 'repeat(16, 2.1rem)' }}>
          {Array.from(PAD.block).map((x, i) => {
            const kind = i < PAD.len ? 'msg' : i === PAD.len ? 'one' : i >= 56 ? 'len' : 'zero'
            const style = kind === 'msg' ? 'border-keyless bg-keyless/15' : kind === 'one' ? 'border-ink bg-hl' : kind === 'len' ? 'border-asym bg-asym/10' : 'border-line'
            return <span key={i} className={`rounded border py-0.5 text-center ${style}`}>{x.toString(16).padStart(2, '0')}</span>
          })}
          <div className="col-span-16 mt-2 flex gap-4 font-sans text-[0.875rem]" style={{ gridColumn: '1 / -1' }}>
            <span><span className="mr-1 inline-block h-3 w-3 border border-keyless bg-keyless/15" /> message</span>
            <span><span className="mr-1 inline-block h-3 w-3 border border-ink bg-hl" /> the 1 bit (0x80)</span>
            <span><span className="mr-1 inline-block h-3 w-3 border border-line" /> zeros</span>
            <span><span className="mr-1 inline-block h-3 w-3 border border-asym bg-asym/10" /> length = 24 bits (0x18)</span>
          </div>
        </div>
      )}
      {s === 2 && <Rounds round={1} />}
      {s === 3 && <Rounds round={64} />}
      {s === 4 && (
        <div className="flex flex-col items-center gap-2">
          <div className="break-all rounded border-2 border-keyless px-4 py-2 text-center font-mono text-[1.05rem]">{digest.value}</div>
          <div className="text-[0.9rem] text-muted">Real SHA-256("abc"): 64 hex characters = 256 bits</div>
        </div>
      )}
    </div>
  )
}

const ORIGINAL = 'Exam results will be published on Friday.\n'
const MODIFIED = 'Exam results will be published on Friday!\n'

function LabMirror() {
  const h1 = useAsync(() => sha256(ORIGINAL), [])
  const h2 = useAsync(() => sha256(MODIFIED), [])
  return (
    <div className="flex flex-col gap-2 text-[0.9rem]">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => downloadFile('message.txt', ORIGINAL, 'text/plain')}>Download message.txt</Button>
        <Button onClick={() => downloadFile('message_modified.txt', MODIFIED, 'text/plain')}>Download message_modified.txt</Button>
      </div>
      <p className="text-muted">The two files differ by one character ("." vs "!"). Their SHA-256 hashes, computed here:</p>
      <div className="font-mono text-[0.875rem] break-all"><b>message.txt</b> {h1.value && bytesToHex(h1.value).toUpperCase()}</div>
      <div className="font-mono text-[0.875rem] break-all"><b>message_modified.txt</b> {h2.value && bytesToHex(h2.value).toUpperCase()}</div>
    </div>
  )
}

export default function T2Sha256() {
  return (
    <TechniqueLayout
      subtitle="A digital fingerprint: any data in, a fixed 64-character digest out."
      idea={<>A <b>hash function</b> turns any input into a short, fixed-size <b>digest</b>. The same input always gives the same digest, but you cannot run it backwards. There is no key.</>}
      analogy="a fingerprint identifies a person, but you cannot rebuild the person from the fingerprint."
      goal="Integrity"
      courseSays={[
        'One way, fixed-size 256-bit output (64 hex characters).',
        'Same input gives the same digest. A small change gives a very different digest (the avalanche effect).',
        'Not designed to be decrypted. Used for integrity checking.',
        'A plain hash alone does not prove who created the data. Trust in the published hash matters.',
      ]}
      tryIt={() => <Sha256Demo />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} />, note: 'Simplified illustration. The padding and the final digest are real; the round values in the middle are not real SHA-256 values. You do not need to memorise this.' }}
      lab={
        <LabBox
          part="Part A: SHA-256 integrity"
          windows={'Get-FileHash .\\message.txt -Algorithm SHA256\nGet-FileHash .\\message_modified.txt -Algorithm SHA256'}
          linux={'sha256sum message.txt\nsha256sum message_modified.txt'}
          observe="changing a single character gives a completely different hash, so any change to the file is detected."
        >
          <LabMirror />
        </LabBox>
      }
    />
  )
}
