import { useState } from 'react'
import { AlertTriangle, Check, Lock, X } from 'lucide-react'
import { Block, TechniqueLayout } from '../../components/layout/TechniqueLayout'
import { SegmentedControl } from '../../components/ui/controls'
import { Callout } from '../../components/ui/Callout'
import { buildChain, checkChain, SCENARIOS, TRUST_STORE, type Cert, type Scenario } from '../../lib/crypto/pki'
import type { Step } from '../../components/viz/StepPlayer'

function CertCard({ c, title, bad }: { c: Cert; title: string; bad?: boolean }) {
  const field = (k: string, v: string) => (
    <div className="flex min-w-0 flex-col">
      <span className="text-[0.78rem] text-muted">{k}</span>
      <span className="font-mono text-[0.82rem] [overflow-wrap:anywhere]">{v}</span>
    </div>
  )
  return (
    <div className={`rounded border-2 bg-panel px-3 py-2 ${bad ? 'border-bad' : 'border-asym/60'}`}>
      <div className="mb-1 text-[0.88rem] font-semibold">{title}</div>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,1.5fr)] gap-x-4 gap-y-1">
        {field('Subject', c.subject)}
        {field('Issuer', c.issuer)}
        {field('Valid', `${c.validFrom} to ${c.validTo}`)}
        {field('Public key', c.keyFp + '…')}
        {field('Serial', c.serial)}
        {field('Signature', `by ${c.signedBy}${c.intact ? '' : ' (no longer matches!)'}`)}
      </div>
    </div>
  )
}

function Result({ scenario }: { scenario: Scenario }) {
  const checks = checkChain(scenario)
  const ok = checks.every((c) => c.pass)
  const firstFail = checks.find((c) => !c.pass)
  return ok ? (
    <div className="flex items-center gap-2 rounded border-2 border-ok bg-ok/10 px-3 py-2 text-[0.95rem]"><Lock size={18} className="text-ok" /> <b>Connection secure.</b> The padlock appears.</div>
  ) : (
    <div className="rounded border-2 border-bad bg-bad/10 px-3 py-2 text-[0.95rem]">
      <div className="flex items-center gap-2 font-semibold text-bad"><AlertTriangle size={18} /> Warning: this site's identity could not be checked</div>
      <div className="mt-1 text-[0.88rem]">{firstFail?.why} Attackers might be trying to read or change what you send. Do not enter passwords here.</div>
    </div>
  )
}

function PkiDemo({ scenario, setScenario }: { scenario: Scenario; setScenario: (s: Scenario) => void }) {
  const { site, intermediate, root, visitedDomain } = buildChain(scenario)
  const checks = checkChain(scenario)
  return (
    <>
      <p className="rounded border border-line bg-paper px-3 py-1.5 text-[0.85rem]">Simulated: simplified certificates. Real certificates use the X.509 format and real signatures.</p>
      <SegmentedControl label="Scenario" value={scenario} onChange={setScenario} options={SCENARIOS.map((s) => ({ value: s.id, label: s.label }))} />
      <div className="text-[0.88rem]">You visit <span className="font-mono font-semibold">https://{visitedDomain}</span>. The site sends this chain:</div>
      <div className="flex flex-col gap-1">
        <CertCard c={site} title="Website certificate" bad={!checks[0].pass || !checks[1].pass || !checks[2].pass} />
        <span className="pl-4 text-[0.78rem] text-muted">↑ signed by</span>
        <CertCard c={intermediate} title="Intermediate CA" bad={!checks[3].pass} />
        <span className="pl-4 text-[0.78rem] text-muted">↑ signed by</span>
        <CertCard c={root} title="Root CA" bad={!checks[4].pass} />
      </div>
      <Block title="What the browser checks">
        <ul className="flex flex-col gap-1 text-[0.88rem]">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2">
              {c.pass ? <Check size={17} className="mt-0.5 shrink-0 text-ok" /> : <X size={17} className="mt-0.5 shrink-0 text-bad" />}
              <span><b>{c.label}</b> <span className="text-muted">{c.why}</span></span>
            </li>
          ))}
        </ul>
        <Result scenario={scenario} />
        <p className="text-[0.8rem] text-muted">Trust store of this browser: {TRUST_STORE.join(', ')}</p>
      </Block>
    </>
  )
}

const HOW_STEPS: Step[] = [
  { title: 'The problem', caption: <>Mallory publishes her own public key labelled "Bob". Alice encrypts to it, and Mallory reads everything. We need a trusted way to know <b>whose key is whose</b>.</> },
  { title: 'The CA vouches', caption: <>A <b>Certificate Authority</b> checks who Bob is, then signs a certificate saying "this public key belongs to Bob".</> },
  { title: 'Check the name', caption: 'The browser checks that the certificate is for the site you actually visited.' },
  { title: 'Check the dates', caption: 'It checks that today is between the "valid from" and "valid to" dates.' },
  { title: 'Check the signatures', caption: "It checks the website certificate's signature with the intermediate CA's public key, and the intermediate's with the root's." },
  { title: 'Check the trust store', caption: 'Finally, the root CA must be one the browser already trusts (its built-in trust store).' },
  { title: 'Result', caption: 'All checks pass: the padlock appears. Any failure: a warning. Change the scenario above to see each failure.' },
]

function HowRender({ s, scenario }: { s: number; scenario: Scenario }) {
  const checks = checkChain(scenario)
  if (s <= 1) return (
    <div className="flex min-h-[12rem] items-center justify-center gap-8 px-6 py-5 text-[0.95rem]">
      {s === 0 ? (
        <>
          <div className="flex flex-col items-center"><span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink font-serif text-[1.3rem] font-semibold">A</span>Alice</div>
          <span className="text-muted">encrypts to →</span>
          <div className="rounded border-2 border-bad px-3 py-2 text-center">Public key labelled <b>"Bob"</b><div className="text-[0.85rem] text-bad">really Mallory's</div></div>
          <span className="text-muted">→</span>
          <div className="flex flex-col items-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-bad font-serif text-[1.3rem] font-semibold text-white">M</span>Mallory reads it</div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center"><span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-asym font-serif font-semibold text-asym">CA</span>Certificate Authority</div>
          <span className="text-muted">signs →</span>
          <div className="rounded border-2 border-asym px-3 py-2 font-mono text-[0.85rem]">Subject: bob.example.edu<br />Public key: a41f9c2e…<br />Signed: CA ✓</div>
        </>
      )}
    </div>
  )
  const shown = s === 6 ? 5 : s - 1 // checks revealed so far (step 2 reveals check 1 ...)
  return (
    <div className="flex min-h-[12rem] flex-col gap-1.5 px-6 py-5">
      <div className="text-[0.85rem] text-muted">Scenario: <b className="text-ink">{SCENARIOS.find((x) => x.id === scenario)?.label}</b></div>
      {[[0], [1], [2, 3], [4]].map((idx, row) => (
        <div key={row} className={`flex flex-col gap-0.5 transition-opacity ${row < shown ? '' : 'opacity-20'}`}>
          {idx.map((i) => (
            <div key={i} className="flex items-center gap-2 text-[0.95rem]">
              {row < shown ? (checks[i].pass ? <Check size={18} className="text-ok" /> : <X size={18} className="text-bad" />) : <span className="w-[1rem]" />}
              {checks[i].label}
            </div>
          ))}
        </div>
      ))}
      {s === 6 && <div className="mt-2"><Result scenario={scenario} /></div>}
    </div>
  )
}

export default function T9Pki() {
  const [scenario, setScenario] = useState<Scenario>('valid')
  return (
    <TechniqueLayout
      subtitle="How your browser knows a public key really belongs to the website."
      idea={<>A public key alone does not say who owns it. A <b>certificate</b> links an identity (like a website name) to a public key, and a trusted <b>Certificate Authority (CA)</b> signs it. Your browser checks this chain of signatures up to a root CA it already trusts.</>}
      analogy="a passport: the government (CA) vouches that this photo (public key) belongs to this name, and border staff (browsers) trust the government."
      goal="Linking an identity to a public key"
      courseSays={[
        'A certificate links an identity to a public key and is vouched for by a trust system of Certificate Authorities (CAs).',
        "The CA issues and signs the certificate. A certificate holds the identity, the public key and the issuer's information.",
        'The browser validates the trust chain and the certificate details.',
        'This is the foundation of HTTPS/TLS trust (Week 2).',
      ]}
      tryIt={() => <PkiDemo scenario={scenario} setScenario={setScenario} />}
      how={{ steps: HOW_STEPS, render: (s) => <HowRender s={s} scenario={scenario} />, note: 'The check steps follow the scenario chosen in Try it.' }}
      extra={<Callout kind="note" title="Try it on a real site">Open any HTTPS website, click the padlock (or the icon left of the address), and choose to view the certificate. You will see the subject, the issuer, the validity dates and the chain up to a root CA.</Callout>}
    />
  )
}
