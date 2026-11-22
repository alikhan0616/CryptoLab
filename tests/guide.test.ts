// Keeps public/guide.md (the plain-text version for people and AI tools) in sync with the app.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '..')
const guide = readFileSync(join(root, 'public/guide.md'), 'utf8')
const plainGuide = guide.replace(/\*\*/g, '') // ignore **bold** markers when comparing wording

describe('study guide (public/guide.md)', () => {
  it('has a section for every page in the app', () => {
    const routes = readFileSync(join(root, 'src/routes.tsx'), 'utf8')
    const titles = [...routes.matchAll(/code: '([A-Z]\d+)', title: '([^']+)'/g)].map((m) => [m[1], m[2]])
    expect(titles.length).toBe(17)
    for (const [code, title] of titles) expect(guide, `missing heading "${code}. ${title}"`).toContain(`### ${code}. ${title}`)
  })

  it('repeats every "Course says" line from the technique pages word for word', () => {
    const dir = join(root, 'src/pages/techniques')
    let checked = 0
    for (const file of readdirSync(dir)) {
      const src = readFileSync(join(dir, file), 'utf8')
      const block = src.match(/courseSays=\{\[([\s\S]*?)\]\}/)?.[1]
      if (!block) continue
      for (const m of block.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
        const line = (m[1] ?? m[2]).replace(/\\'/g, "'")
        expect(plainGuide, `${file}: guide is missing "${line}"`).toContain(line)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(30)
  })

  it('contains the known-answer values', () => {
    for (const v of ['KHOOR', 'EADGT', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', '69c4e0d86a7b0430d8cdb78070b4c55a', '85E813540F0AB405', '3233', '2753', '2790', '190 bytes'])
      expect(guide).toContain(v)
  })
})
