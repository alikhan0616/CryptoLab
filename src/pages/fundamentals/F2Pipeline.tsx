import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StepPlayer, type Step } from '../../components/viz/StepPlayer'
import { KeyChip } from '../../components/viz/KeyChip'
import { Callout } from '../../components/ui/Callout'
import { SegmentedControl, TextField, Toggle } from '../../components/ui/controls'
import { useAsync } from '../../components/useAsync'
import { caesarDecrypt, caesarEncrypt, mod } from '../../lib/crypto/caesar'
import { aesDecrypt, aesEncrypt, sha256 } from '../../lib/crypto/webcrypto'
import { bytesToBase64, bytesToUtf8, randomBytes, utf8ToBytes } from '../../lib/encoding'

type Algo = 'caesar' | 'aes'

const STEPS: Step[] = [
  { title: 'Plaintext', caption: <><b>Plaintext</b> is the original, readable message.</> },
  { title: 'Algorithm', caption: <>The <b>algorithm</b> (or cipher) is the recipe for scrambling. It is public: everyone may know how it works.</> },
  { title: 'Key', caption: <>The <b>key</b> is the secret value that controls the algorithm. Same algorithm, different key, different result.</> },
  { title: 'Encrypt', caption: <>Encrypt = algorithm + key applied to the plaintext. The output is <b>ciphertext</b>: scrambled and unreadable.</> },
  { title: 'Decrypt', caption: <>Decrypt with the <b>same key</b> and the original plaintext comes back. Try the wrong key to see what happens.</> },
  { title: 'Key space', caption: <>The <b>key space</b> is the set of all possible keys. The bigger it is, the longer it takes to try them all.</> },
  { title: 'Cryptanalysis', caption: <><b>Cryptanalysis</b> is breaking a cipher without being given the key. Eve tries every key and looks for readable text.</> },
]

function Box({ term, active, children, tone }: { term: string; active: boolean; children: ReactNode; tone?: 'ok' | 'bad' }) {
  return (
    <motion.div
      initial={false}
      animate={{ scale: active ? 1.03 : 1 }}
      className={`flex min-h-[5.5rem] min-w-0 flex-1 flex-col rounded border-2 p-2.5 transition-colors ${active ? 'border-ink bg-hl/50' : 'border-line bg-panel'}`}
    >
      <div className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">{term}</div>
      <div className={`mt-1 font-mono text-[0.9rem] leading-snug [overflow-wrap:anywhere] ${tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : ''}`}>{children}</div>
    </motion.div>
  )
}

const Arrow = () => <ArrowRight size={20} className="mt-11 shrink-0 text-muted" aria-hidden />

export default function F2Pipeline() {
  const [algo, setAlgo] = useState<Algo>('caesar')
  const [plaintext, setPlaintext] = useState('HELLO')
  const [caesarKey, setCaesarKey] = useState('3')
  const [aesKeyText, setAesKeyText] = useState('my secret key')
  const [wrongKey, setWrongKey] = useState(false)

  const k = mod(parseInt(caesarKey, 10) || 0, 26)
  const caesarCt = caesarEncrypt(plaintext, k)
  const caesarBack = caesarDecrypt(caesarCt, wrongKey ? k + 1 : k)

  // AES-128-GCM. The key is the first 16 bytes of SHA-256(key text), so any typed text works as a key.
  const aes = useAsync(async () => {
    const key = (await sha256(aesKeyText)).slice(0, 16)
    const iv = randomBytes(12)
    const ct = await aesEncrypt('GCM', key, iv, utf8ToBytes(plaintext))
    const decKey = wrongKey ? (await sha256(aesKeyText + '!')).slice(0, 16) : key
    try {
      return { ct: bytesToBase64(ct), back: bytesToUtf8(await aesDecrypt('GCM', decKey, iv, ct)), failed: false }
    } catch (e) {
      return { ct: bytesToBase64(ct), back: (e as Error).message, failed: true }
    }
  }, [plaintext, aesKeyText, wrongKey])

  const ct = algo === 'caesar' ? caesarCt : aes.value?.ct ?? '...'
  const back = algo === 'caesar' ? caesarBack : aes.value?.back ?? '...'
  const backFailed = algo === 'aes' && !!aes.value?.failed
  const backTone = wrongKey ? 'bad' : 'ok'
  const keyLabel = algo === 'caesar' ? `Key: ${k}` : `Key: "${aesKeyText}"`
  const wrongLabel = algo === 'caesar' ? `Key: ${mod(k + 1, 26)}` : `Key: "${aesKeyText}!"`

  const scene = (s: number) => (
    <div className="px-5 pb-5 pt-4">
      <div className="flex items-start gap-2">
        <Box term="Plaintext" active={s === 0}>{plaintext || ' '}</Box>
        <Arrow />
        <div className="flex min-w-0 flex-[1.25] flex-col gap-1.5">
          <motion.div initial={false} animate={{ opacity: s >= 2 ? 1 : 0.3 }} className={`self-center rounded-full ${s === 2 ? 'ring-4 ring-hl' : ''}`}>
            <KeyChip kind="shared" label={keyLabel} />
          </motion.div>
          <Box term="Encrypt" active={s === 1 || s === 3}>
            <span className="font-sans text-[0.85rem]">
              <span className="text-muted">Algorithm: </span>
              {algo === 'caesar' ? 'Caesar, shift letters forward' : 'AES-128-GCM'}
            </span>
          </Box>
        </div>
        <Arrow />
        <Box term="Ciphertext" active={s === 3}>{s >= 3 ? ct : '?'}</Box>
        <Arrow />
        <div className="flex min-w-0 flex-[1.25] flex-col gap-1.5">
          <motion.div initial={false} animate={{ opacity: s >= 4 ? 1 : 0.3 }} className="self-center">
            <KeyChip kind="shared" label={wrongKey ? `Wrong! ${wrongLabel}` : keyLabel} />
          </motion.div>
          <Box term="Decrypt" active={s === 4}>
            <span className="font-sans text-[0.85rem]"><span className="text-muted">Same algorithm, run </span>backwards</span>
          </Box>
        </div>
        <Arrow />
        <Box term="Plaintext again" active={s === 4} tone={s >= 4 ? backTone : undefined}>{s >= 4 ? (backFailed ? <span className="font-sans text-[0.85rem]">{back}</span> : back) : '?'}</Box>
      </div>

      {/* Key space and cryptanalysis strip */}
      <motion.div initial={false} animate={{ opacity: s >= 5 ? 1 : 0.25 }} className="mt-5 border-t border-line pt-3">
        {algo === 'caesar' ? (
          <>
            <div className="mb-2 text-[0.85rem]"><b>Key space:</b> 25 useful shifts (shift 0 and 26 change nothing).{s >= 6 && <> <b>Cryptanalysis:</b> Eve decrypts with all 25 and spots the readable one.</>}</div>
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((key) => {
                const hit = s >= 6 && key === k
                return (
                  <div key={key} className={`rounded border px-1 py-0.5 text-center ${hit ? 'border-ok bg-ok/10' : 'border-line bg-paper'}`}>
                    <div className="font-mono text-[0.78rem] text-muted">{key}</div>
                    <div className={`truncate font-mono text-[0.78rem] ${hit ? 'font-semibold text-ok' : ''}`}>{s >= 6 ? caesarDecrypt(caesarCt, key) : ''}</div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-[0.95rem]">
            <b>Key space:</b> AES-128 has 2<sup>128</sup> keys, about 340 followed by 36 zeros.
            {s >= 6 && <> <b>Cryptanalysis:</b> even at a trillion guesses per second, trying them all takes far longer than the age of the universe. Eve cannot just try every key.</>}
          </div>
        )}
      </motion.div>
    </div>
  )

  return (
    <>
      <PageHeader subtitle="The path every message takes, with the key terms labelled on it. Running example: Caesar, shift 3." />
      <div className="mb-4 flex flex-wrap items-end gap-5">
        <TextField label="Plaintext" value={plaintext} onChange={setPlaintext} mono maxLength={40} width="13rem" />
        <div className="flex flex-col gap-1 text-[0.8rem] text-muted">
          Algorithm
          <SegmentedControl label="Algorithm" value={algo} onChange={setAlgo} options={[{ value: 'caesar', label: 'Caesar' }, { value: 'aes', label: 'AES-GCM' }]} />
        </div>
        {algo === 'caesar'
          ? <TextField label="Key (shift)" value={caesarKey} onChange={setCaesarKey} mono width="6rem" />
          : <TextField label="Key (any text)" value={aesKeyText} onChange={setAesKeyText} mono width="12rem" />}
        <Toggle label="Try the wrong key" checked={wrongKey} onChange={setWrongKey} />
      </div>
      <StepPlayer steps={STEPS} render={scene} />
      <div className="mt-6 grid grid-cols-2 gap-5">
        <Callout kind="course">
          HELLO with shift +3 becomes KHOOR. Caesar is not secure today: the key space is tiny and language patterns are obvious.
        </Callout>
        <Callout kind="note" title="The key, not the algorithm">
          Security must depend on keeping the <b>key</b> secret, not the algorithm. AES is fully public and reviewed, yet without the key Eve still cannot read the message. Distrust any "unbreakable because it is secret" claim.
        </Callout>
      </div>
    </>
  )
}
