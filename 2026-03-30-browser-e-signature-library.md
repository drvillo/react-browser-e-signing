# PRD: @drvillo/browser-e-signature

Browser-only PDF e-signature library with field placement and handwritten signature rendering.

## 1. Overview

A standalone TypeScript library that lets users sign PDFs entirely in the browser: upload a PDF, place signature fields, enter signer details, render a handwritten-style signature, embed it into the PDF, and download the result. No server component. No backend dependency. Same architecture and tooling as [`@drvillo/browser-watermark`](https://github.com/drvillo/browser-watermark).

### Features
- **Browser-only**: All PDF processing happens client-side — no uploads, no server
- **Field placement**: Drag-and-drop signature, name, title, and date fields onto any PDF page
- **Handwritten signatures**: Typed (name rendered in a handwriting font) or drawn (freehand canvas)
- **PDF modification**: Embeds signatures and text into the actual PDF via pdf-lib
- **Integrity hash**: SHA-256 of the signed PDF for tamper detection
- **React components**: Ready-to-use viewer, field editor, and signature renderer
- **TypeScript**: Full type definitions included

---

## 2. Project Structure

Mirrors [`@drvillo/browser-watermark`](https://github.com/drvillo/browser-watermark) exactly:

```
browser-e-signature/
├── .gitignore
├── LICENSE                         # MIT
├── README.md
├── package.json
├── tsconfig.json
├── tsup.config.ts                  # Build: src/ → dist/ (ESM + .d.ts)
├── vite.config.ts                  # Demo dev server (root: demo/)
├── vitest.config.ts                # Unit tests
├── vitest.browser.config.ts        # Browser tests (optional, if needed)
├── src/
│   ├── index.ts                    # Barrel export (public API)
│   ├── components/
│   │   ├── pdf-viewer.tsx          # react-pdf wrapper, renders pages
│   │   ├── field-overlay.tsx       # Transparent overlay per page for field placement
│   │   ├── signature-field.tsx     # Draggable/resizable field component
│   │   ├── field-palette.tsx       # Toolbar for selecting field types
│   │   ├── signer-details-panel.tsx
│   │   ├── signature-preview.tsx   # Live preview of typed/drawn signature
│   │   ├── signature-pad.tsx       # Freehand drawing (signature_pad wrapper)
│   │   └── signing-complete.tsx    # Post-sign: hash, download, summary
│   ├── hooks/
│   │   ├── use-pdf-document.ts     # Load PDF, track pages/dimensions
│   │   ├── use-field-placement.ts  # State management for placed fields
│   │   └── use-signature-renderer.ts # Render name as signature image (canvas)
│   ├── lib/
│   │   ├── pdf-modifier.ts         # pdf-lib: embed signatures/text into PDF
│   │   ├── coordinate-mapper.ts    # Convert % positions ↔ PDF points
│   │   ├── signature-fonts.ts      # Font definitions and loading
│   │   └── hash.ts                 # SHA-256 of PDF bytes (WebCrypto)
│   └── types.ts                    # Shared types
├── test/
│   └── ...                         # vitest unit + browser tests
└── demo/
    ├── index.html                  # Standalone demo entry
    ├── main.tsx                    # React mount point
    └── App.tsx                     # Demo app (upload → place → sign → download)
```

---

## 3. Configuration Files

### `package.json`

```jsonc
{
  "name": "@drvillo/browser-e-signature",
  "version": "0.1.0",
  "description": "Browser-only PDF e-signature library with field placement and handwritten rendering",
  "repository": {
    "type": "git",
    "url": "https://github.com/drvillo/browser-e-signature.git"
  },
  "homepage": "https://github.com/drvillo/browser-e-signature#readme",
  "bugs": "https://github.com/drvillo/browser-e-signature/issues",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "demo": "vite",
    "demo:build": "vite build",
    "test": "vitest run",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["e-signature", "pdf", "sign", "browser", "react"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "@pdf-lib/fontkit": "^1.1.1",
    "react-pdf": "^9.0.0",
    "signature_pad": "^5.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vitest": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

### `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  external: ['react', 'react-dom'],
})
```

### `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "demo", "**/*.test.ts"]
}
```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'demo',
  plugins: [react()],
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    open: true,
  },
})
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
})
```

---

## 4. Public API (`src/index.ts`)

Single barrel export. Consumers import everything from `@drvillo/browser-e-signature`.

```typescript
// Components
export { PdfViewer } from './components/pdf-viewer'
export { FieldOverlay } from './components/field-overlay'
export { SignatureField } from './components/signature-field'
export { FieldPalette } from './components/field-palette'
export { SignerDetailsPanel } from './components/signer-details-panel'
export { SignaturePreview } from './components/signature-preview'
export { SignaturePad } from './components/signature-pad'
export { SigningComplete } from './components/signing-complete'

// Hooks
export { usePdfDocument } from './hooks/use-pdf-document'
export { useFieldPlacement } from './hooks/use-field-placement'
export { useSignatureRenderer } from './hooks/use-signature-renderer'

// Pure logic (framework-agnostic)
export { modifyPdf } from './lib/pdf-modifier'
export { mapToPoints, mapFromPoints } from './lib/coordinate-mapper'
export { loadSignatureFont, SIGNATURE_FONTS } from './lib/signature-fonts'
export { sha256 } from './lib/hash'

// Types
export type {
  FieldPlacement,
  FieldType,
  SignerInfo,
  SignatureStyle,
  SigningResult,
  PdfPageDimensions,
} from './types'

// Defaults
export const defaults = {
  SIGNATURE_FONTS: ['Dancing Script', 'Great Vibes', 'Sacramento', 'Alex Brush'],
  DEFAULT_FIELD_WIDTH_PERCENT: 25,
  DEFAULT_FIELD_HEIGHT_PERCENT: 5,
} as const
```

---

## 5. Functional Specification

### 5.1 PDF Viewing

`PdfViewer` renders a PDF from a `File`, `Blob`, `ArrayBuffer`, or `Uint8Array` using react-pdf (PDF.js). It renders all pages sequentially with configurable scale, page navigation controls, and exposes page dimensions to the field placement layer.

### 5.2 Field Placement

`FieldOverlay` renders a transparent positioning layer over each PDF page. Users place fields by selecting a type from `FieldPalette` and clicking on the page. Placed fields are **draggable** and **resizable**.

**Field types:**

| Field | Renders as | Auto-filled from |
|---|---|---|
| `signature` | Handwritten-style PNG image | Signer's name + selected font |
| `fullName` | Text | Signer's first + last name |
| `title` | Text | Signer's capacity / role |
| `date` | Text | Current date (auto) |

**Coordinate storage** — positions are stored as percentage offsets (scale-independent):

```typescript
interface FieldPlacement {
  id: string
  type: FieldType
  pageIndex: number
  xPercent: number      // 0–100, from left edge
  yPercent: number      // 0–100, from top edge
  widthPercent: number
  heightPercent: number
}
```

### 5.3 Signature Rendering

Two modes:

**Typed (default)** — signer's full name rendered in a handwriting font on a hidden canvas, exported as PNG.

Available fonts (loaded from Google Fonts at runtime):
- *Dancing Script* — casual, friendly
- *Great Vibes* — elegant, formal
- *Sacramento* — flowing, compact
- *Alex Brush* — classic cursive

**Drawn** — freehand drawing via `signature_pad` canvas. Exported as PNG.

Both produce a PNG data URL that is embedded into the PDF as an image.

### 5.4 PDF Modification

`modifyPdf()` takes the original PDF bytes, an array of `FieldPlacement` objects, and the signer's details. It uses pdf-lib to:

1. Embed signature PNG images at placed coordinates (converted from % to PDF points).
2. Draw text (name, title, date) at placed coordinates using a standard font.
3. Return the modified PDF as `Uint8Array`.

The original PDF is never mutated — pdf-lib produces a new copy.

**Coordinate mapping** (% → PDF points):

```
x_points = (xPercent / 100) * pageWidthPoints
y_points = pageHeightPoints - ((yPercent / 100) * pageHeightPoints) - fieldHeightPoints
```

PDF origin is bottom-left; screen origin is top-left — the Y axis is flipped.

### 5.5 Integrity Hash

After modification, `sha256()` computes a SHA-256 hash of the signed PDF bytes using the Web Crypto API. The hash is returned alongside the signed PDF for tamper detection.

---

## 6. Demo

Run the demo locally:

```bash
pnpm install
pnpm demo
```

This starts a Vite dev server (at `http://localhost:5174`) with a standalone React app. The demo allows you to:

- Upload a PDF and view it in the browser
- Place signature, name, title, and date fields by clicking on pages
- Drag and resize placed fields
- Enter signer details (first name, last name, title)
- Choose a handwriting font style or draw a freehand signature
- Click "Sign Document" with a confirmation step
- Download the signed PDF
- View the SHA-256 hash of the signed document

---

## 7. Development

```bash
# Install dependencies
pnpm install

# Build library (src/ → dist/)
pnpm build

# Watch mode (rebuild on changes)
pnpm dev

# Run demo
pnpm demo

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## 8. Enhancement Path

### 8.1 AcroForm Auto-Detection

Many prepared PDFs include AcroForm signature fields. pdf-lib can detect these:

```typescript
const form = pdfDoc.getForm()
for (const field of form.getFields()) {
  if (field.constructor.name === 'PDFSignature') {
    for (const widget of field.acroField.getWidgets()) {
      const rect = widget.Rect()?.asRectangle()
      // rect gives { x, y, width, height } in PDF points
    }
  }
}
```

If detected, auto-populate the field overlay with pre-placed fields at the correct positions. Users can still adjust.

### 8.2 LLM-Assisted Field Detection

For PDFs without AcroForm fields, a vision LLM could analyze rendered page images and return bounding box coordinates for "Signature:", "Sign here:", or signature line areas. The architecture supports this — `useFieldPlacement` accepts programmatic field insertion alongside manual placement.

---

## 9. Rollout Milestones

### M1: Scaffold + PDF Viewer + Field Placement (5–6 days)

**Scope:**
- Scaffold project: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `README.md`.
- Verify `pnpm build` produces `dist/` with ESM + type declarations.
- Verify `pnpm demo` starts the Vite dev server.
- Build `PdfViewer`: renders pages, handles zoom, page navigation.
- Build `FieldOverlay`: transparent div per page, click-to-place.
- Build `SignatureField`: draggable + resizable.
- Build `FieldPalette`: toolbar for field type selection.
- `useFieldPlacement` hook: state management for placed fields.
- Wire up `demo/App.tsx` with file upload + viewer + field placement.

**Testable:** `pnpm demo` serves a working app. User uploads a PDF, sees it rendered, can place/move/resize/remove fields. `pnpm build` produces a valid `dist/`.

---

### M2: Signature Rendering + Signer Details (3–4 days)

**Scope:**
- Build `SignerDetailsPanel`: first name, last name, title inputs.
- Load Google Fonts handwriting fonts (4 options).
- Build `SignaturePreview`: live-renders the name in selected font.
- `useSignatureRenderer` hook: canvas rendering → PNG export.
- Build `SignaturePad`: freehand drawing alternative.
- Wire up field preview: placed signature fields show the rendered signature.

**Testable:** User enters name, selects a handwriting font (or draws), sees a live preview. Signature fields on the PDF update to show the rendered signature.

---

### M3: PDF Modification + Download (3–4 days)

**Scope:**
- Build `modifyPdf()`: uses pdf-lib to embed signature images and text at placed coordinates.
- Build `mapToPoints()` / `mapFromPoints()`: coordinate conversion.
- Build `sha256()`: SHA-256 of signed PDF (WebCrypto).
- Build signing flow: "Sign Document" button → confirmation dialog → modify PDF → return result.
- Build `SigningComplete`: hash display, download button, signing summary.

**Testable:** End-to-end in demo: upload PDF → place fields → enter name → sign → download a valid modified PDF with embedded signature. Hash displayed.

---

### M4: Tests + Polish (2–3 days)

**Scope:**
- Unit tests: coordinate mapper, hash function, signature font loading, field placement state.
- Integration test: `modifyPdf()` round-trip (place fields → modify → verify fields present in output PDF).
- Demo polish: edge cases (no fields placed, empty name, large PDFs, corrupt PDFs).
- README with installation, usage examples, API reference, and demo instructions.

**Testable:** `pnpm test` passes. `pnpm build` + `pnpm demo` work from a clean install. README is complete.

---

**Total estimated effort: 13–17 days across 4 milestones.**

---

## 10. Open Questions

1. **Font licensing**: Google Fonts are Apache 2.0 / OFL licensed. Confirm embedding rendered text (as PNG) into user PDFs is permitted. (Expected: yes.)

2. **PDF.js worker**: react-pdf requires a PDF.js worker. Bundle it or load from CDN? Bundling is more reliable for a standalone library; CDN reduces size.

3. **Mobile field placement**: Drag-and-drop on mobile is challenging. Support desktop primarily for v0.1. Mobile can use tap-to-place. Note as UX debt.

4. **Multiple signers**: v0.1 supports single-signer. The architecture supports multiple signers (fields tagged per signer, each fills their own), but coordination is left to the consumer.

5. **Signature field size defaults**: DocuSign uses ~200x50px at standard zoom. Make defaults configurable via `defaults` export.

6. **Page rendering performance**: Large PDFs (50+ pages) may need virtualized rendering (only visible pages). Defer unless performance is an issue.

7. **Tailwind portability**: Components use Tailwind classes. Consumers must include `node_modules/@drvillo/browser-e-signature/src/**/*.tsx` in their Tailwind content config. Document in README.

---

## 11. Limitations

- Single-signer only in v0.1 (multi-signer coordination left to consumer)
- No cryptographic PDF signatures (PAdES/CAdES) — visual annotation + hash-based integrity only
- Not designed for qualified electronic signatures (eIDAS QES)
- Signature field placement is manual (AcroForm auto-detection is an enhancement)
- Desktop-first; mobile drag-and-drop is limited

## License

MIT
