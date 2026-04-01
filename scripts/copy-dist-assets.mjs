import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const copies = [
  ['src/styles.css', 'dist/styles.css'],
  ['node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'dist/pdf.worker.min.mjs'],
  ['worker/index.mjs', 'dist/worker.mjs'],
  ['worker/index.d.mts', 'dist/worker.d.mts'],
]

for (const [from, to] of copies) {
  copyFileSync(join(root, from), join(root, to))
}
