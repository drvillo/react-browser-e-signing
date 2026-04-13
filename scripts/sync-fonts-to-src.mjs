import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FONT_BUNDLE_COPIES } from './font-bundle-copies.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const destDir = join(root, 'src', 'lib', 'fonts')

mkdirSync(destDir, { recursive: true })

for (const [from, filename] of FONT_BUNDLE_COPIES) {
  copyFileSync(join(root, from), join(destDir, filename))
}
