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

### Types

- `FieldPlacement`
- `FieldType`
- `SignerInfo`
- `SignatureStyle`
- `SigningResult`
- `PdfPageDimensions`

## Tailwind Consumer Setup

This package ships Tailwind classes in components. Add the package path to your Tailwind content scan:

```js
// tailwind.config.js
export default {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@drvillo/react-browser-e-signing/src/**/*.{ts,tsx}',
  ],
}
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

- `PdfViewer` sets `react-pdf` worker from CDN by default using the runtime PDF.js version.
- Browser test config skips execution when Playwright Chromium is not available in the environment.

## Limitations

- Single signer workflow in v0.1
- Visual e-signature annotation + hash integrity, not cryptographic PAdES signatures
- Desktop-first drag/resize experience
