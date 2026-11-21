// The single ordered list of pages. The sidebar, top-bar counter and
// next/previous navigation all read from this list.
import type { ComponentType } from 'react'
import Home from './pages/Home'
import P1ChooseTool from './pages/practice/P1ChooseTool'
import P2Triage from './pages/practice/P2Triage'
import P3Misconceptions from './pages/practice/P3Misconceptions'
import F1Why from './pages/fundamentals/F1Why'
import F2Pipeline from './pages/fundamentals/F2Pipeline'
import F3Encoding from './pages/fundamentals/F3Encoding'
import F4SymAsym from './pages/fundamentals/F4SymAsym'
import T1Caesar from './pages/techniques/T1Caesar'
import T2Sha256 from './pages/techniques/T2Sha256'
import T3Salting from './pages/techniques/T3Salting'
import T4Hmac from './pages/techniques/T4Hmac'
import T5Des from './pages/techniques/T5Des'
import T6Aes from './pages/techniques/T6Aes'
import T7Rsa from './pages/techniques/T7Rsa'
import T8Signatures from './pages/techniques/T8Signatures'
import T9Pki from './pages/techniques/T9Pki'
import T10Hybrid from './pages/techniques/T10Hybrid'

export type Category = 'symmetric' | 'asymmetric' | 'keyless' | 'hybrid'
export type Part = 'home' | 'fundamentals' | 'techniques' | 'practice'

export interface PageDef {
  path: string
  code: string // short label in the sidebar, e.g. F1, T3, P2
  title: string
  short?: string // shorter label for the sidebar
  part: Part
  category?: Category
  level?: number
  component: ComponentType
}

export const PAGES: PageDef[] = [
  { path: '/', code: '', title: 'Home', part: 'home', component: Home },

  { path: '/fundamentals/why', code: 'F1', title: 'Why cryptography?', part: 'fundamentals', component: F1Why },
  { path: '/fundamentals/pipeline', code: 'F2', title: 'Plaintext to ciphertext', part: 'fundamentals', component: F2Pipeline },
  { path: '/fundamentals/encoding', code: 'F3', title: 'Encoding vs encryption vs hashing', short: 'Encode, encrypt, hash', part: 'fundamentals', component: F3Encoding },
  { path: '/fundamentals/sym-vs-asym', code: 'F4', title: 'Symmetric vs asymmetric', part: 'fundamentals', component: F4SymAsym },

  { path: '/techniques/caesar', code: 'T1', title: 'Caesar cipher', part: 'techniques', category: 'symmetric', level: 1, component: T1Caesar },
  { path: '/techniques/sha256', code: 'T2', title: 'SHA-256 hashing', part: 'techniques', category: 'keyless', level: 2, component: T2Sha256 },
  { path: '/techniques/salting', code: 'T3', title: 'Salting passwords', part: 'techniques', category: 'keyless', level: 3, component: T3Salting },
  { path: '/techniques/hmac', code: 'T4', title: 'HMAC', part: 'techniques', category: 'symmetric', level: 4, component: T4Hmac },
  { path: '/techniques/des', code: 'T5', title: 'DES and 3DES', part: 'techniques', category: 'symmetric', level: 5, component: T5Des },
  { path: '/techniques/aes', code: 'T6', title: 'AES', part: 'techniques', category: 'symmetric', level: 6, component: T6Aes },
  { path: '/techniques/rsa', code: 'T7', title: 'RSA', part: 'techniques', category: 'asymmetric', level: 7, component: T7Rsa },
  { path: '/techniques/signatures', code: 'T8', title: 'Digital signatures', part: 'techniques', category: 'asymmetric', level: 8, component: T8Signatures },
  { path: '/techniques/pki', code: 'T9', title: 'PKI and certificates', part: 'techniques', category: 'asymmetric', level: 9, component: T9Pki },
  { path: '/techniques/hybrid', code: 'T10', title: 'Hybrid cryptography', part: 'techniques', category: 'hybrid', level: 10, component: T10Hybrid },

  { path: '/practice/choose-tool', code: 'P1', title: 'Activity 1: choose the right tool', short: 'Activity 1: choose a tool', part: 'practice', component: P1ChooseTool },
  { path: '/practice/triage', code: 'P2', title: 'Activity 2: cryptographic triage', short: 'Activity 2: triage', part: 'practice', component: P2Triage },
  { path: '/practice/misconceptions', code: 'P3', title: 'Misconceptions', part: 'practice', component: P3Misconceptions },
]

export const PART_LABELS: Record<Exclude<Part, 'home'>, string> = {
  fundamentals: 'Part 1 · Fundamentals',
  techniques: 'Part 2 · Techniques',
  practice: 'Part 3 · Practice',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  symmetric: 'Symmetric',
  asymmetric: 'Asymmetric',
  keyless: 'Keyless (hashing)',
  hybrid: 'Hybrid',
}

export const pageIndex = (path: string) => PAGES.findIndex((p) => p.path === path)
