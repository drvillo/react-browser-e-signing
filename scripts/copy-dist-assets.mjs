import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FONT_BUNDLE_COPIES } from './font-bundle-copies.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

mkdirSync(join(root, 'dist', 'fonts'), { recursive: true })

const fontCopies = FONT_BUNDLE_COPIES.map(([from, filename]) => [from, `dist/fonts/${filename}`])

const copies = [
  ['src/styles.css', 'dist/styles.css'],
  ['node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'dist/pdf.worker.min.mjs'],
  ['worker/index.mjs', 'dist/worker.mjs'],
  ['worker/index.d.mts', 'dist/worker.d.mts'],
  ...fontCopies,
]

for (const [from, to] of copies) {
  copyFileSync(join(root, from), join(root, to))
}
