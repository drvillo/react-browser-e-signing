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

- `PdfViewer` sets `react-pdf` worker from CDN by default using the runtime PDF.js version.
- Browser test config skips execution when Playwright Chromium is not available in the environment.
- Demo theme switcher (`default` / `custom`) shows how a container app can fully re-theme the same components.

## Limitations

- Single signer workflow in v0.1
- Visual e-signature annotation + hash integrity, not cryptographic PAdES signatures
- Desktop-first drag/resize experience
