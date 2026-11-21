import { useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { Button, Field, SegmentedControl, TextField } from '../../components/ui/controls'
import { Callout } from '../../components/ui/Callout'
import { useAsync } from '../../components/useAsync'
import { pbkdf2Sha256, sha256 } from '../../lib/crypto/webcrypto'
import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from '../../lib/encoding'
import type { Step } from '../../components/viz/StepPlayer'

type Mode = 'none' | 'sha' | 'pbkdf2'
type SaltSource = 'random' | 'custom'
interface User { name: string; password: string; salt: Uint8Array }

const concat = (a: Uint8Array, b: Uint8Array) => { const out = new Uint8Array(a.length + b.length); out.set(a); out.set(b, a.length); return out }

async function storedValue(mode: Mode, password: string, salt: Uint8Array, iterations: number) {
  if (mode === 'none') return sha256(password)
  if (mode === 'sha') return sha256(concat(salt, utf8ToBytes(password)))
  return pbkdf2Sha256(password, salt, iterations)
}

function SaltingDemo() {
  const [saltLen, setSaltLen] = useState(16)
  const [users, setUsers] = useState<User[]>(() => [
    { name: 'Ali', password: 'SAMEPASS', salt: randomBytes(16) },
    { name: 'Sara', password: 'SAMEPASS', salt: randomBytes(16) },
  ])
  const [mode, setMode] = useState<Mode>('none')
  const [source, setSource] = useState<SaltSource>('random')
  const [custom, setCustom] = useState('cryptolab')
  const [iterations, setIterations] = useState(1000)
  const [newName, setNewName] = useState('Omar')
  const [newPass, setNewPass] = useState('SAMEPASS')

  const saltFor = (u: User) => (source === 'custom' ? utf8ToBytes(custom) : u.salt)

  const rows = useAsync(async () => {
    const t0 = performance.now()
    const values = []
    for (const u of users) values.push(bytesToHex(await storedValue(mode, u.password, saltFor(u), iterations)))
    return { values, msPerHash: (performance.now() - t0) / Math.max(1, users.length) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, mode, source, custom, iterations])

  const regenerate = (len = saltLen) => setUsers((us) => us.map((u) => ({ ...u, salt: randomBytes(len) })))
  const addUser = () => {
    if (!newName.trim()) return
    setUsers((us) => [...us, { name: newName.trim(), password: newPass, salt: randomBytes(saltLen) }])
    setNewName('')
  }

  const values = rows.value?.values ?? []
  const firstWith = (v: string) => values.indexOf(v)

  return (
    <>
      <Field label="How the system stores passwords">
        <SegmentedControl label="Storage mode" value={mode} onChange={setMode} options={[
          { value: 'none', label: 'No salt + SHA-256' }, { value: 'sha', label: 'Salt + SHA-256' }, { value: 'pbkdf2', label: 'Salt + PBKDF2' },
        ]} />
      </Field>

      {mode !== 'none' && (
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Salt">
            <SegmentedControl label="Salt source" value={source} onChange={setSource} options={[{ value: 'random', label: 'Random per user' }, { value: 'custom', label: 'Custom (same for all)' }]} />
          </Field>
          {source === 'random' ? (
            <>
              <Field label="Salt length">
                <SegmentedControl label="Salt length" value={String(saltLen)} onChange={(v) => { setSaltLen(+v); regenerate(+v) }}
                  options={[{ value: '8', label: '8 bytes' }, { value: '16', label: '16' }, { value: '32', label: '32' }]} />
              </Field>
              <Button onClick={() => regenerate()}><RefreshCw size={14} /> New salts</Button>
            </>
          ) : (
            <TextField label="Custom salt text" value={custom} onChange={setCustom} mono width="11rem" />
          )}
          {mode === 'pbkdf2' && (
            <Field label="PBKDF2 iterations">
              <SegmentedControl label="Iterations" value={String(iterations)} onChange={(v) => setIterations(+v)} options={[
                { value: '1', label: '1' }, { value: '1000', label: '1,000' }, { value: '100000', label: '100,000' }, { value: '600000', label: '600,000' },
              ]} />
            </Field>
          )}
        </div>
      )}

      <Block title="User database (what an attacker steals)" right={rows.loading ? <span className="text-[0.875rem] text-muted">working...</span> : mode === 'pbkdf2' ? <span className="font-mono text-[0.875rem] text-muted">{rows.value?.msPerHash.toFixed(1)} ms per hash</span> : null}>
        <div className="overflow-x-auto">
          <table className="w-full text-[0.875rem]">
            <thead><tr className="border-b-2 border-ink text-left"><th className="py-1 pr-2">User</th><th className="py-1 pr-2">Salt</th><th className="py-1">Stored value</th></tr></thead>
            <tbody>
              {users.map((u, i) => {
                const v = values[i]
                const dup = v !== undefined && values.filter((x) => x === v).length > 1
                return (
                  <tr key={i} className={`border-b border-line align-top ${dup ? 'bg-bad/10' : ''}`}>
                    <td className="py-1 pr-2">{u.name}<div className="font-mono text-[0.875rem] text-muted">{u.password}</div></td>
                    <td className="py-1 pr-2 font-mono text-[0.875rem] break-all">{mode === 'none' ? <span className="text-muted">(none)</span> : bytesToHex(saltFor(u)).slice(0, 16) + (bytesToHex(saltFor(u)).length > 16 ? '…' : '')}</td>
                    <td className={`py-1 font-mono text-[0.875rem] break-all ${dup ? 'text-bad' : ''}`}>
                      {v ? v.slice(0, 32) + '…' : '...'}
                      {dup && firstWith(v) !== i && <div className="font-sans text-[0.875rem]">Same as {users[firstWith(v)].name}!</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <TextField label="New user" value={newName} onChange={setNewName} width="8rem" />
          <TextField label="Password" value={newPass} onChange={setNewPass} mono width="10rem" />
          <Button onClick={addUser}>Add user</Button>
        </div>
        <Lesson mode={mode} source={source} anyDup={values.some((v, i) => values.indexOf(v) !== i)} />
      </Block>
    </>
  )
}

function Lesson({ mode, source, anyDup }: { mode: Mode; source: SaltSource; anyDup: boolean }) {
  let text: ReactNode
  if (mode === 'none') text = <>Without a salt, the same password always gives the same stored value. An attacker who cracks one cracks them all, and can look values up in a precomputed table of common passwords.</>
  else if (source === 'custom' && anyDup) text = <>One salt shared by everyone is not enough: identical passwords still match each other. <b>Each user needs their own random salt.</b></>
  else if (mode === 'sha') text = <>With a unique random salt, identical passwords give different stored values. But SHA-256 is very fast, so guessing is still cheap. Use a password KDF.</>
  else text = <>PBKDF2 repeats the hashing many times on purpose. A normal login waits a fraction of a second; an attacker trying millions of guesses waits millions of times longer.</>
  return <p className={`text-[0.9rem] ${anyDup ? 'text-bad' : ''}`}>{text}</p>
}

// ----- How it works: sign-up then login, with real values -----
const SALT = hexToBytes('a3f19c07d24e8b51')
const HOW_STEPS: Step[] = [
  { title: 'Sign-up: password', caption: 'Ali signs up with the password SAMEPASS.' },
  { title: 'Sign-up: salt', caption: <>The system makes a fresh random <b>salt</b> just for Ali.</> },
  { title: 'Sign-up: combine and hash', caption: 'Salt and password are combined and run through the hashing (KDF) step.' },
  { title: 'Sign-up: store', caption: <>The database stores the <b>salt</b> and the <b>result</b>. It never stores the password itself.</> },
  { title: 'Login: type password', caption: 'Later, Ali types a password to log in.' },
  { title: 'Login: look up salt', caption: "The system looks up Ali's salt and recomputes the result with the typed password." },
  { title: 'Login: compare', caption: 'If the new result equals the stored one, the password was right. Login succeeds.' },
]

function HowRender({ s }: { s: number }) {
  const h = useAsync(async () => bytesToHex(await sha256(concat(SALT, utf8ToBytes('SAMEPASS')))), [])
  const login = s >= 4
  const box = (on: boolean, label: string, value: ReactNode, tone = 'var(--keyless)') => (
    <div className={`flex min-w-0 flex-1 flex-col rounded border-2 p-2.5 transition-opacity ${on ? 'opacity-100' : 'opacity-30'}`} style={{ borderColor: on ? tone : 'var(--line)' }}>
      <span className="text-[0.875rem] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="mt-1 break-all font-mono text-[0.875rem]">{value}</span>
    </div>
  )
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="font-serif text-[1.05rem] font-semibold">{login ? 'Login' : 'Sign-up'}</div>
      <div className="flex items-stretch gap-2">
        {box(login ? s >= 4 : s >= 0, login ? 'Typed password' : 'Password', 'SAMEPASS', 'var(--ink)')}
        <span className="self-center text-muted">+</span>
        {box(login ? s >= 5 : s >= 1, login ? 'Stored salt (looked up)' : 'Random salt', bytesToHex(SALT))}
        <span className="self-center text-muted">→</span>
        {box(login ? s >= 5 : s >= 2, 'SHA-256(salt + password)', h.value?.slice(0, 24) + '…')}
        <span className="self-center text-muted">→</span>
        {login
          ? box(s >= 6, 'Compare with stored', <span className="text-ok">match ✓ login OK</span>, 'var(--ok)')
          : box(s >= 3, 'Database row', <>Ali | {bytesToHex(SALT).slice(0, 8)}… | {h.value?.slice(0, 8)}…</>, 'var(--ink)')}
      </div>
    </div>
  )
}

export default function T3Salting() {
  return (
    <TechniqueLayout
      subtitle="Why two users with the same password should never have the same stored value."
      idea={<>Systems should not store passwords, only a hash of them. A <b>salt</b> is random data added to each password before hashing, so identical passwords produce different stored values, and precomputed tables of common-password hashes become useless.</>}
      analogy="two people buy the same padlock, but each gets a different random code engraved on it, so one master list cannot open both."
      goal="Protecting stored passwords"
      courseSays={[
        'A salt is random data combined with a password before a password-hashing or KDF (key-derivation function) step.',
        'It stops identical passwords from producing identical stored values and makes precomputed attacks less useful.',
        'Plain SHA-256 alone is not best practice for passwords; use a dedicated password KDF.',
      ]}
      tryIt={() => <SaltingDemo />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} />, note: 'Real values: salt + SHA-256 for one user. Real systems use a slow KDF instead of plain SHA-256.' }}
      extra={<Callout kind="note">Real systems also use <b>bcrypt</b>, <b>scrypt</b> or <b>Argon2</b>. This page uses PBKDF2 because the browser has it built in.</Callout>}
    />
  )
}
