// Simplified certificate chain check (simulated, per PLAN.md Section 1A).
// Real certificates use the X.509 format and real signatures; here each certificate
// records who signed it and whether its signed fields are still intact.

export interface Cert {
  subject: string
  issuer: string
  validFrom: string // YYYY-MM-DD
  validTo: string
  serial: string
  keyFp: string // fingerprint of the public key inside the certificate
  signedBy: string // the CA whose key actually produced the signature
  intact: boolean // false if someone edited a field after signing
}

export type Scenario = 'valid' | 'expired' | 'wrong-domain' | 'self-signed' | 'unknown-ca' | 'tampered'

export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: 'valid', label: 'Valid' },
  { id: 'expired', label: 'Expired' },
  { id: 'wrong-domain', label: 'Wrong domain' },
  { id: 'self-signed', label: 'Self-signed' },
  { id: 'unknown-ca', label: 'Unknown CA' },
  { id: 'tampered', label: 'Tampered' },
]

export const ROOT = 'CryptoLab Root CA'
export const INTERMEDIATE = 'CryptoLab Intermediate CA'
export const SITE = 'portal.example.edu'
export const TRUST_STORE = [ROOT]

const todayIso = () => new Date().toISOString().slice(0, 10)
/** Shift an ISO date by a number of days. */
const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10)

/** Dates are relative to `today`, so the "Valid" scenario stays valid whenever the app is shown. */
export function buildChain(s: Scenario, today = todayIso()): { site: Cert; intermediate: Cert; root: Cert; visitedDomain: string } {
  const root: Cert = { subject: ROOT, issuer: ROOT, validFrom: addDays(today, -1500), validTo: addDays(today, 2000), serial: '01', keyFp: '3c9e07b1', signedBy: ROOT, intact: true }
  const intermediate: Cert = { subject: INTERMEDIATE, issuer: ROOT, validFrom: addDays(today, -700), validTo: addDays(today, 1100), serial: '1A', keyFp: '8d42f6a0', signedBy: ROOT, intact: true }
  const site: Cert = { subject: SITE, issuer: INTERMEDIATE, validFrom: addDays(today, -120), validTo: addDays(today, 245), serial: '7F3C', keyFp: 'a41f9c2e', signedBy: INTERMEDIATE, intact: true }
  let visitedDomain = SITE
  if (s === 'expired') { site.validFrom = addDays(today, -500); site.validTo = addDays(today, -135) }
  if (s === 'wrong-domain') visitedDomain = 'portal.example-login.com'
  if (s === 'self-signed') { site.issuer = SITE; site.signedBy = SITE }
  if (s === 'unknown-ca') { root.subject = root.issuer = root.signedBy = 'Shady Root CA'; intermediate.issuer = intermediate.signedBy = 'Shady Root CA' }
  if (s === 'tampered') { site.keyFp = 'e7700b5d'; site.intact = false } // Mallory swaps in her own public key after signing
  return { site, intermediate, root, visitedDomain }
}

export interface Check { label: string; pass: boolean; why: string }

export function checkChain(s: Scenario, today = todayIso()): Check[] {
  const { site, intermediate, root, visitedDomain } = buildChain(s, today)
  const sigOk = (c: Cert, issuer: Cert) => c.intact && c.signedBy === issuer.subject && c.issuer === issuer.subject
  const checks: Check[] = [
    { label: 'Domain name matches?', pass: site.subject === visitedDomain, why: `You visited ${visitedDomain}; the certificate is for ${site.subject}.` },
    { label: 'Dates valid?', pass: site.validFrom <= today && today <= site.validTo, why: `Valid ${site.validFrom} to ${site.validTo}; today is ${today}.` },
    { label: "Website signature checks with the intermediate's public key?", pass: sigOk(site, intermediate), why: !site.intact ? 'A field (the public key) was changed after signing, so the signature no longer matches.'
      : site.signedBy === site.subject ? 'The website signed its own certificate (self-signed). No CA vouches for it.'
      : `Signed by ${site.signedBy}.` },
    { label: "Intermediate signature checks with the root's public key?", pass: sigOk(intermediate, root), why: `Signed by ${intermediate.signedBy}.` },
    { label: 'Root is in the trust store?', pass: TRUST_STORE.includes(root.subject), why: `${root.subject} ${TRUST_STORE.includes(root.subject) ? 'is' : 'is not'} trusted by this browser.` },
  ]
  return checks
}
