# React Browser E-Signing

`@drvillo/react-browser-e-signing` — browser-only PDF e-signing for React: field placement, typed or drawn signatures, `pdf-lib` embedding.

## Features

- Browser-only PDF signing flow with no server upload
- Drag + resize field placement for signature, full name, title, and date
- Typed signature rendering with handwriting fonts or freehand drawing
- PDF modification with `pdf-lib`
- SHA-256 hash generation for integrity checks
- React components, hooks, and pure utility functions

## Install

```bash
pnpm add @drvillo/react-browser-e-signing
```

## Quick Start

```tsx
import { defaults, modifyPdf, sha256, useFieldPlacement } from '@drvillo/react-browser-e-signing'
import '@drvillo/react-browser-e-signing/styles.css'
```

Use the demo app for a complete end-to-end integration:

```bash
pnpm install
pnpm demo
```

The demo imports the package from `src/` (not `dist/`). `pnpm demo` runs `sync-fonts-to-src.mjs`, which copies the bundled `.woff2` files into `src/lib/fonts/` (gitignored) so `loadSignatureFont` can resolve them next to `signature-fonts.ts` during Vite dev.

## Public API

### Components

- `PdfViewer`
- `FieldOverlay`
- `SignatureField`
- `FieldPalette`
- `SignerDetailsPanel`
- `SignaturePreview`
- `SignaturePad`
- `SigningComplete`

### Hooks

- `usePdfDocument`
- `useFieldPlacement`
- `useSignatureRenderer`

### Pure Utilities

- `modifyPdf`
- `mapToPoints`
- `mapFromPoints`
- `loadSignatureFont`
- `SIGNATURE_FONTS`
- `sha256`

### Configuration

- `configure(options)` — PDF worker URL, signature font mode (`bundled` | `local-only`; deprecated `network`), optional `fontUrlResolver`, optional `onWarning` callback
- `getPdfWorkerSrc()` — from `@drvillo/react-browser-e-signing/worker`; returns a bundler-resolved URL for the packaged `pdf.worker.min.mjs` (recommended default for `pdfWorkerSrc`)
- Types: `ESigningConfig`, `SignatureFontWarning`

### Types

- `FieldPlacement`
- `FieldType`
- `SignerInfo`
- `SignatureStyle`
- `SigningResult`
- `PdfPageDimensions`

## Styling and Theming

Library components are style-agnostic:

- components expose `data-slot` attributes for all key DOM parts
- stateful elements expose `data-state`
- each component root accepts `className`
- no Tailwind setup is required in consumer apps

### Option 1: Use default styles

```tsx
import '@drvillo/react-browser-e-signing/styles.css'
```

### Option 2: Bring your own styles

Skip the default stylesheet and target slots from your app CSS:

```css
[data-slot='field-palette-button'] {
  border-radius: 999px;
  border: 1px solid #111827;
  background: #ffffff;
}

[data-slot='field-palette-button'][data-state='selected'] {
  background: #111827;
  color: #ffffff;
}
```

### Slot constants

Use exported slot constants to avoid string literals:

```tsx
import { SLOTS } from '@drvillo/react-browser-e-signing'

const selector = `[data-slot="${SLOTS.fieldPaletteButton}"]`
```

## Development Scripts

```bash
pnpm build
pnpm dev
pnpm demo
pnpm demo:build
pnpm test
pnpm typecheck
```

After a fresh clone, run **`pnpm build` once** so `dist/` includes the bundled worker, `worker.mjs`, and types (the copy step runs after tsup’s type emit).

## Notes

- **PDF worker:** PDF.js **must** load its worker from a URL. This package ships `pdf.worker.min.mjs` built from the same `pdfjs-dist` version as `react-pdf` (see **Bundled PDF.js worker** below). The package does **not** inject a CDN URL by default; call `configure({ pdfWorkerSrc: getPdfWorkerSrc() })` or set `workerSrc` on `PdfViewer` so the worker loads (recommended for production). See **Production hardening** below.
- Browser test config skips execution when Playwright Chromium is not available in the environment.
- Demo theme switcher (`default` / `custom`) shows how a container app can fully re-theme the same components.

## Production hardening

Runtime calls to external CDNs (e.g. PDF.js worker) often fail in real apps: **CSP** (`worker-src`, `connect-src`), ad blockers, corporate proxies, or offline users. This library defaults to **no injected worker URL** and lets you control loading explicitly. Typed signature fonts are **bundled** in the package (no Google Fonts fetch).

### Bundled PDF.js worker (recommended)

The npm package includes `pdf.worker.min.mjs` at the same path layout as `react-pdf`’s `pdfjs-dist` dependency, so you do **not** need unpkg or a manual copy script for the default flow.

Configure once (e.g. app entry or a client-only module):

```tsx
import { configure } from '@drvillo/react-browser-e-signing'
import { getPdfWorkerSrc } from '@drvillo/react-browser-e-signing/worker'

configure({ pdfWorkerSrc: getPdfWorkerSrc() })
```

`getPdfWorkerSrc()` uses `new URL('./pdf.worker.min.mjs', import.meta.url)` so Vite, webpack 5, and similar bundlers emit the worker as an asset and rewrite the URL. **Do not** point at a third-party CDN in production if you can avoid it.

Or per viewer:

```tsx
import { getPdfWorkerSrc } from '@drvillo/react-browser-e-signing/worker'

<PdfViewer workerSrc={getPdfWorkerSrc()} {...pdfViewerProps} />
```

`workerSrc` on `PdfViewer` overrides `configure({ pdfWorkerSrc })`.

**Advanced:** import the raw file (e.g. Vite):

```tsx
import workerUrl from '@drvillo/react-browser-e-signing/pdf.worker.min.mjs?url'

configure({ pdfWorkerSrc: workerUrl })
```

**Versioning:** when this library upgrades `react-pdf` / `pdfjs-dist`, the published worker file is regenerated from that `pdfjs-dist` version. Keep your app on the published package version you intend; do not mix a different `pdfjs-dist` worker binary with another API version.

**SSR / Next.js App Router:** PDF.js runs in the browser. Set `pdfWorkerSrc` only on the client — e.g. in `useEffect`, or in a file loaded via `dynamic(..., { ssr: false })`, or in a client-only entry — so `getPdfWorkerSrc()` and worker loading are not evaluated during SSR.

### Manual self-host (fallback)

If you prefer serving the worker from your own `public/` folder, copy the file that matches the `pdfjs-dist` version used by `react-pdf` (see `node_modules/react-pdf/package.json`):

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

Then:

```tsx
import { configure } from '@drvillo/react-browser-e-signing'

configure({ pdfWorkerSrc: '/pdf.worker.min.mjs' })
```

### Typed signatures: bundled fonts (default)

Latin **woff2** files for the built-in signature typefaces are **shipped in the package** under `dist/fonts/` (sourced from `@fontsource/*` at build time). `loadSignatureFont` registers them via the FontFace API — **no runtime fetch to Google Fonts**.

### Typed signatures: local-only fonts

Skip registering bundled fonts; the browser uses whatever faces are already installed or available (fallback may look generic):

```tsx
configure({ fontMode: 'local-only' })
```

Load failures are reported via `onWarning` when set; rendering still produces a PNG using fallback glyphs when a face is missing.

### Custom font URLs (override or self-hosted woff/woff2)

```tsx
configure({
  fontUrlResolver: (family) => `/fonts/${family.replace(/\s+/g, '-')}.woff2`,
})
```

Return `null` to use the **bundled** woff2 for that family (when not using `local-only`).

### Observability

```tsx
configure({
  onWarning: (w) => {
    console.warn(`[react-browser-e-signing] ${w.code}: ${w.message}`)
  },
})
```

Warnings are non-throwing; signing flow should remain usable.

### CSP-oriented example

If everything is same-origin (including the worker URL after your bundler emits it):

```
Content-Security-Policy: worker-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self';
```

A self-hosted worker loaded from the same origin as your app typically satisfies `worker-src 'self'`. Typed signature fonts load from the same origin as your app bundle (package `dist/fonts/*.woff2`); allow `font-src 'self'` (or your asset origin).

### Migration from v0.1.2 and earlier

Previously, `PdfViewer` set the worker to unpkg at module load, and typed fonts fetched Google Fonts at runtime.

- **Worker:** to restore the old CDN behavior (not recommended for production), set `pdfWorkerSrc` to the unpkg URL for your PDF.js version, e.g. `https://unpkg.com/pdfjs-dist@<version>/build/pdf.worker.min.mjs` (match `pdfjs.version` from `react-pdf` / `pdfjs-dist`).
- **Fonts:** default is bundled Latin woff2 files (no Google fetch). Use `fontMode: 'local-only'` when you must not register `@font-face` from the package.

## Limitations

- Single signer workflow in v0.1
- Visual e-signature annotation + hash integrity, not cryptographic PAdES signatures
- Desktop-first drag/resize experience
