import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

copyFileSync(
  join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
  join(root, 'worker/pdf.worker.min.mjs'),
)
