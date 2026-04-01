import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getPdfWorkerSrc } from '../../worker/index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

function normalizeVersion(v: string) {
  return v.replace(/^[\^~]/, '')
}

describe('worker entry', () => {
  it('getPdfWorkerSrc returns a URL ending in pdf.worker.min.mjs', () => {
    const href = getPdfWorkerSrc()
    expect(href).toMatch(/pdf\.worker\.min\.mjs(\?.*)?$/)
  })

  it('worker/index.mjs source exists', () => {
    expect(existsSync(join(root, 'worker/index.mjs'))).toBe(true)
  })

  it('pdfjs-dist in devDependencies matches react-pdf dependency', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      devDependencies?: Record<string, string>
    }
    const reactPdf = JSON.parse(
      readFileSync(join(root, 'node_modules/react-pdf/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    const expected = reactPdf.dependencies?.['pdfjs-dist']
    const pinned = pkg.devDependencies?.['pdfjs-dist']
    expect(expected).toBeDefined()
    expect(pinned).toBeDefined()
    expect(normalizeVersion(pinned!)).toBe(normalizeVersion(expected!))
  })
})
