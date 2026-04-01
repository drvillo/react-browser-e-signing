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

- `configure(options)` — PDF worker URL, signature font mode (`network` | `local-only`), optional `fontUrlResolver`, optional `onWarning` callback
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

## Notes

- **PDF worker:** the package does **not** inject a third-party worker URL. Set `configure({ pdfWorkerSrc })` and/or `<PdfViewer workerSrc="..." />` so PDF.js can load a worker (recommended for production). See **Production hardening** below.
- Browser test config skips execution when Playwright Chromium is not available in the environment.
- Demo theme switcher (`default` / `custom`) shows how a container app can fully re-theme the same components.

## Production hardening

Runtime calls to external CDNs (PDF.js worker, Google Fonts) often fail in real apps: **CSP** (`worker-src`, `connect-src`, `font-src`), ad blockers, corporate proxies, or offline users. They also add noisy console errors (`Failed to fetch`) even when the rest of the UI works. This library defaults to **no injected worker URL** and lets you control loading explicitly.

### Self-hosted PDF.js worker (recommended)

Copy the worker file that matches your installed `pdfjs-dist` (same major/minor as `react-pdf` / PDF.js):

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

Then configure once (e.g. in your app entry or root layout client component):

```tsx
import { configure } from '@drvillo/react-browser-e-signing'

configure({ pdfWorkerSrc: '/pdf.worker.min.mjs' })
```

Or per viewer:

```tsx
<PdfViewer workerSrc="/pdf.worker.min.mjs" {...pdfViewerProps} />
```

`workerSrc` on `PdfViewer` overrides `configure({ pdfWorkerSrc })`.

### Typed signatures: local-only fonts (no network)

Skip all font fetches (handwriting fonts won’t load from Google; the browser uses whatever faces are already available, with sensible fallback):

```tsx
configure({ fontMode: 'local-only' })
```

Default is `fontMode: 'network'`, which keeps the previous Google Fonts behavior but **does not throw** on failure; failures are reported via `onWarning` when set.

### Custom font URLs (self-hosted woff/woff2)

```tsx
configure({
  fontUrlResolver: (family) => `/fonts/${family.replace(/\s+/g, '-')}.woff2`,
})
```

Return `null` to fall back to Google Fonts for that family (when `fontMode` is `'network'`).

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

If everything is same-origin:

```
Content-Security-Policy: worker-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self';
```

Adjust `connect-src` / `font-src` if you still use Google Fonts or a CDN for the worker.

### Migration from v0.1.2 and earlier

Previously, `PdfViewer` set the worker to unpkg at module load, and typed fonts fetched Google Fonts CSS + files at runtime.

- **Worker:** to restore the old CDN behavior (not recommended for production), set `pdfWorkerSrc` to the unpkg URL for your PDF.js version, e.g. `https://unpkg.com/pdfjs-dist@<version>/build/pdf.worker.min.mjs` (match `pdfjs.version` from `react-pdf` / `pdfjs-dist`).
- **Fonts:** behavior is unchanged when you omit `configure()` except that network failures no longer surface as thrown errors from `loadSignatureFont`; use `fontMode: 'local-only'` for strict no-network deployments.

## Limitations

- Single signer workflow in v0.1
- Visual e-signature annotation + hash integrity, not cryptographic PAdES signatures
- Desktop-first drag/resize experience
