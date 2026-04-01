import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

const pkg = readJson(join(root, 'package.json'))
const reactPdf = readJson(join(root, 'node_modules/react-pdf/package.json'))
const expectedPdfjs = reactPdf.dependencies?.['pdfjs-dist'] ?? reactPdf.peerDependencies?.['pdfjs-dist']

if (!expectedPdfjs) {
  console.error('verify-worker: could not read pdfjs-dist version from react-pdf')
  process.exit(1)
}

const pinned = pkg.devDependencies?.['pdfjs-dist']
if (pinned && pinned.replace(/^[\^~]/, '') !== expectedPdfjs.replace(/^[\^~]/, '')) {
  console.error(
    `verify-worker: devDependency pdfjs-dist (${pinned}) must match react-pdf's pdfjs-dist (${expectedPdfjs})`,
  )
  process.exit(1)
}

const workerPath = join(root, 'dist/pdf.worker.min.mjs')
const helperPath = join(root, 'dist/worker.mjs')

if (!existsSync(workerPath)) {
  console.error('verify-worker: missing dist/pdf.worker.min.mjs')
  process.exit(1)
}

if (!existsSync(helperPath)) {
  console.error('verify-worker: missing dist/worker.mjs')
  process.exit(1)
}

const workerBytes = readFileSync(workerPath)
if (workerBytes.length < 10_000) {
  console.error('verify-worker: dist/pdf.worker.min.mjs seems too small')
  process.exit(1)
}

console.log('verify-worker: ok (pdf.worker.min.mjs present, pdfjs-dist matches react-pdf)')
