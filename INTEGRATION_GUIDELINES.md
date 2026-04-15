# INTEGRATION_GUIDELINES

## 1) Metadata

- packageName: `@drvillo/react-browser-e-signing`
- runtime: browser-only (React)
- peerDependencies: `react`, `react-dom`
- requiredCssImport: `@drvillo/react-browser-e-signing/styles.css`
- recommendedWorkerSetup:
  - import `configure` from package
  - import `getPdfWorkerSrc` from `@drvillo/react-browser-e-signing/worker`
  - call `configure({ pdfWorkerSrc: getPdfWorkerSrc() })`
- bundledSignatureFonts: six Latin `woff2` files under `dist/fonts/` (from devDependency `@fontsource/*` at publish build). Optional import path `@drvillo/react-browser-e-signing/fonts/<file>.woff2`. Default `fontMode` loads these via `FontFace` (no Google Fonts request).

## 2) Full Public API

### 2.1 Components

```ts
interface PdfViewerProps {
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  onScaleChange: (nextScale: number) => void
  onDocumentLoadSuccess: (numPages: number) => void
  onPageDimensions: (input: { pageIndex: number; widthPt: number; heightPt: number }) => void
  /**
   * Called after each page's text content is extracted.
   * Use with `groupTextLines` to enable snap-to-text-line on `FieldOverlay`.
   * Omit to disable text extraction (no snap, no overhead).
   */
  onPageTextContent?: (pageIndex: number, textContent: TextContent) => void
  renderOverlay?: (pageIndex: number) => React.ReactNode
  renderToolbarContent?: () => React.ReactNode
  className?: string
  workerSrc?: string
  pageMode?: 'scroll' | 'single'
  currentPageIndex?: number
}
```

```ts
interface PdfPageNavigatorProps {
  currentPageIndex: number
  numPages: number
  onPageChange: (pageIndex: number) => void
  className?: string
}
```

```ts
interface FieldOverlayProps {
  pageIndex: number
  fields: FieldPlacement[]
  selectedFieldType: FieldType | null
  onAddField: (input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }) => void
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  /** When true, clicking the overlay does not add fields (`data-state='readonly'`). */
  readOnly?: boolean
  /**
   * Text lines from `groupTextLines` for this page.
   * When provided, dragged fields snap their value baseline to the nearest line.
   * A red guide line (`[data-slot="snap-guide"]`) appears while snap is active.
   * Omit or pass `undefined` to disable snap. Pass `[]` to opt-in but disable at runtime.
   */
  textLines?: TextLine[]
  className?: string
}
```

```ts
interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  className?: string
}
```

```ts
interface FieldPaletteProps {
  selectedFieldType: FieldType | null
  onSelectFieldType: (fieldType: FieldType | null) => void
  fieldTypes?: FieldType[]   // defaults to ['signature', 'fullName', 'title', 'date', 'text']
  className?: string
}
```

```ts
interface SignerDetailsPanelProps {
  signerInfo: SignerInfo
  onSignerInfoChange: (nextSignerInfo: SignerInfo) => void
  className?: string
}
```

```ts
interface SignaturePreviewProps {
  signerName: string
  style: SignatureStyle
  signatureDataUrl: string | null
  isRendering: boolean
  onStyleChange: (nextStyle: SignatureStyle) => void
  className?: string
}
```

```ts
interface SignaturePadProps {
  onDrawn: (signatureDataUrl: string) => void
  className?: string
}
```

```ts
interface SigningCompleteProps {
  signerName: string
  fieldCount: number
  signedAt: string
  documentHash: string
  downloadUrl: string
  fileName?: string
  onReset: () => void
  className?: string
}
```

### 2.2 Hooks

```ts
type PdfInput = File | Blob | ArrayBuffer | Uint8Array | null

function usePdfDocument(pdfInput: PdfInput): {
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>
  pageDimensions: PdfPageDimensions[]
  setPageDimension: (pageIndex: number, widthPt: number, heightPt: number) => void
  handleDocumentLoadSuccess: (loadedPages: number) => void
  hasPdf: boolean
  isLoading: boolean
  errorMessage: string | null
}
```

```ts
function useFieldPlacement(options?: {
  defaultWidthPercent?: number
  defaultHeightPercent?: number
  initialFields?: FieldPlacement[]
}): {
  fields: FieldPlacement[]
  addField: (input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number; label?: string }) => FieldPlacement
  appendFields: (nextFields: FieldPlacement[]) => void
  updateField: (id: string, partial: Partial<FieldPlacement>) => void
  removeField: (id: string) => void
  clearFields: () => void
  setFields: (fields: FieldPlacement[]) => void
}
```

`updateField` on a field with `locked: true` ignores positional keys (`xPercent`, `yPercent`, `widthPercent`, `heightPercent`) but still applies `label`, `value`, and `locked`. `removeField` is a no-op for locked fields.

```ts
function useSignatureRenderer(input: {
  signerName: string
  style: SignatureStyle
}): {
  signatureDataUrl: string | null
  isRendering: boolean
}
```

```ts
interface UsePdfPageVisibilityOptions {
  containerRef: React.RefObject<HTMLElement | null>
  numPages: number
  threshold?: number
}

interface UsePdfPageVisibilityReturn {
  currentPageIndex: number
  visiblePageIndices: number[]
  scrollToPage: (pageIndex: number) => void
}

function usePdfPageVisibility(options: UsePdfPageVisibilityOptions): UsePdfPageVisibilityReturn
```

```ts
/**
 * Manages the per-page TextLine[] state needed for snap-to-text alignment.
 * Pass pageDimensions from usePdfDocument.
 * handlePageTextContent has a stable identity — safe to pass as a prop.
 */
function usePdfTextLines(pageDimensions: PdfPageDimensions[]): {
  /** Map from page index to extracted text lines. Pass .get(pageIndex) to FieldOverlay. */
  textLinesByPage: Map<number, TextLine[]>
  /** Stable callback for PdfViewer's onPageTextContent prop. */
  handlePageTextContent: (pageIndex: number, textContent: PdfTextContent) => void
}
```

### 2.3 Types

```ts
type FieldType = 'signature' | 'fullName' | 'title' | 'date' | 'text'

interface FieldPlacement {
  id: string
  type: FieldType
  pageIndex: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  /** Display label; when unset, UI falls back to a type-derived label (e.g. "Full Name"). */
  label?: string
  /** Pre-filled content. For `signature`, a PNG data URL. For other types, plain text. */
  value?: string
  /** When true, field cannot be dragged, resized, or removed via UI; hook ignores positional updates and removal. */
  locked?: boolean
}

interface SignerInfo {
  firstName: string
  lastName: string
  title: string
}

type SignatureStyle =
  | { mode: 'typed'; fontFamily: string }
  | { mode: 'drawn'; dataUrl: string }

interface SigningResult {
  pdfBytes: Uint8Array
  sha256: string
}

interface PdfPageDimensions {
  pageIndex: number
  widthPt: number
  heightPt: number
}

interface SignatureFieldPreview {
  signatureDataUrl: string | null
  fullName: string
  title: string
  dateText: string
}

/** A text line extracted from a PDF page, in top-down percent coordinates. */
interface TextLine {
  /** Top edge of the line box (top-down, same convention as field yPercent). */
  yPercent: number
  /** Height of the line box as a percent of page height. */
  heightPercent: number
  /** Baseline position (top-down percent). Used for snap alignment. */
  baselinePercent: number
}
```

`SignatureField` sets root attributes `data-locked` and `data-has-value` for styling.

### 2.4 Utilities and config

```ts
function configure(options: {
  pdfWorkerSrc?: string
  fontMode?: 'bundled' | 'local-only' | 'network'
  fontUrlResolver?: (fontFamily: string) => string | null
  onWarning?: (warning: { code: string; message: string }) => void
}): void

function modifyPdf(input: {
  pdfBytes: Uint8Array
  fields: FieldPlacement[]
  signer?: SignerInfo
  signatureDataUrl?: string
  pageDimensions: PdfPageDimensions[]
  dateText?: string
}): Promise<Uint8Array>

function mapToPoints(field: FieldPlacement, page: PdfPageDimensions): {
  x: number
  y: number
  width: number
  height: number
}

function mapFromPoints(
  rect: { x: number; y: number; width: number; height: number },
  page: PdfPageDimensions
): Pick<FieldPlacement, 'xPercent' | 'yPercent' | 'widthPercent' | 'heightPercent'>

function loadSignatureFont(fontFamily: string): Promise<void>
function sha256(data: Uint8Array): Promise<string>

/**
 * Extracts text line positions from a pdfjs TextContent.
 * Returns top-down percent coordinates consistent with field placement.
 * Rotated items and zero-height items are skipped.
 * Returns [] for scanned/image-only PDFs.
 */
function groupTextLines(textContent: TextContent, page: PdfPageDimensions): TextLine[]

/**
 * Snaps a field's position so its rendered value aligns with the nearest text
 * line baseline, if within threshold (default 1.5%).
 *
 * `valueCenterRatio` (0..1, default 0.5) controls where the value content's
 * visual center sits within the field — measured from the DOM at drag start
 * to account for the label, padding, and border that push content below center.
 */
function snapToTextLine(params: {
  candidateYPercent: number
  fieldHeightPercent: number
  textLines: TextLine[]
  valueCenterRatio?: number
  threshold?: number
}): { yPercent: number; snappedLineBaselinePercent: number | null }

/** Default snap threshold (page-percent units). */
const SNAP_THRESHOLD_PERCENT: 1.5
```

Per field, if `field.value` is set it is embedded directly (signature as PNG, others as text with a white backing rect). Otherwise values are derived from `signer` / `signatureDataUrl` / `dateText` as in previous releases. You can call `modifyPdf` with only `field.value`-populated fields and omit `signer` and `signatureDataUrl`.

### 2.5 Constants

```ts
const defaults: {
  SIGNATURE_FONTS: readonly string[]
  DEFAULT_FIELD_WIDTH_PERCENT: 25
  DEFAULT_FIELD_HEIGHT_PERCENT: 7
}
```

```ts
const SLOTS = {
  pdfViewer: 'pdf-viewer',
  pdfViewerEmpty: 'pdf-viewer-empty',
  pdfViewerToolbar: 'pdf-viewer-toolbar',
  pdfViewerToolbarContent: 'pdf-viewer-toolbar-content',
  pdfViewerPageCount: 'pdf-viewer-page-count',
  pdfViewerZoom: 'pdf-viewer-zoom',
  pdfViewerZoomButton: 'pdf-viewer-zoom-button',
  pdfViewerZoomValue: 'pdf-viewer-zoom-value',
  pdfViewerPages: 'pdf-viewer-pages',
  pdfViewerPage: 'pdf-viewer-page',
  pdfViewerLoading: 'pdf-viewer-loading',
  pdfViewerError: 'pdf-viewer-error',
  pdfPageNavigator: 'pdf-page-navigator',
  pdfPageNavigatorButton: 'pdf-page-navigator-button',
  pdfPageNavigatorLabel: 'pdf-page-navigator-label',
  fieldOverlay: 'field-overlay',
  signatureField: 'signature-field',
  signatureFieldContent: 'signature-field-content',
  signatureFieldLabel: 'signature-field-label',
  signatureFieldPreview: 'signature-field-preview',
  signatureFieldPreviewImage: 'signature-field-preview-image',
  signatureFieldPreviewText: 'signature-field-preview-text',
  signatureFieldRemove: 'signature-field-remove',
  signatureFieldResize: 'signature-field-resize',
  signatureFieldLabelInput: 'signature-field-label-input',
  signatureFieldValueInput: 'signature-field-value-input',
  fieldPalette: 'field-palette',
  fieldPaletteButton: 'field-palette-button',
  signerPanel: 'signer-panel',
  signerPanelHeading: 'signer-panel-heading',
  signerPanelLabel: 'signer-panel-label',
  signerPanelInput: 'signer-panel-input',
  signaturePreview: 'signature-preview',
  signaturePreviewHeading: 'signature-preview-heading',
  signaturePreviewModeToggle: 'signature-preview-mode-toggle',
  signaturePreviewModeButton: 'signature-preview-mode-button',
  signaturePreviewFontLabel: 'signature-preview-font-label',
  signaturePreviewFontSelect: 'signature-preview-font-select',
  signaturePreviewDisplay: 'signature-preview-display',
  signaturePreviewImage: 'signature-preview-image',
  signaturePreviewPlaceholder: 'signature-preview-placeholder',
  signaturePad: 'signature-pad',
  signaturePadCanvas: 'signature-pad-canvas',
  signaturePadActions: 'signature-pad-actions',
  signaturePadClear: 'signature-pad-clear',
  signingComplete: 'signing-complete',
  signingCompleteHeading: 'signing-complete-heading',
  signingCompleteDetails: 'signing-complete-details',
  signingCompleteHash: 'signing-complete-hash',
  signingCompleteHashLabel: 'signing-complete-hash-label',
  signingCompleteHashValue: 'signing-complete-hash-value',
  signingCompleteActions: 'signing-complete-actions',
  signingCompleteDownload: 'signing-complete-download',
  signingCompleteReset: 'signing-complete-reset',
  /** Red guide line rendered across the overlay while a field snaps to a text line. */
  snapGuide: 'snap-guide',
} as const
```

## 3) Multi-Page behavior

- `pageMode='scroll'`:
  - all pages rendered in vertical stack
  - best for desktop reading/review
  - use `usePdfPageVisibility` + `PdfPageNavigator` for quick jumps
- `pageMode='single'`:
  - only one page rendered at a time
  - controlled by `currentPageIndex`
  - best for mobile/focused workflows
- `renderToolbarContent`:
  - add `FieldPalette`, `PdfPageNavigator`, or custom controls directly in viewer toolbar
  - avoids losing field placement controls while moving across pages

## 4) Text fields, `field.value`, `locked`, and `readOnly`

### `text` fields

Use `type: 'text'` for freeform labeled fields. Labels and values live on `FieldPlacement` (`label`, `value`). After placement, `SignatureField` enters inline label edit, then value edit (Tab/Enter), calling `onUpdateField(id, { label })` and `onUpdateField(id, { value })`. No separate `Record<string, string>` map is required.

### Optional sidebar for text values

Build a small panel that lists `fields.filter(f => f.type === 'text' && f.label)` and calls `updateField(f.id, { value })` on change. The library does not ship this component so consumers control layout and validation.

### `field.value` on any type

- **`signature`:** `value` is a PNG data URL; preview and `modifyPdf` use it when set, instead of the global `signatureDataUrl`.
- **`fullName` | `title` | `date` | `text`:** `value` is plain text; when set, `modifyPdf` embeds it (and skips signer-derived text for that field).

### `locked`

`locked: true` fixes **geometry only**: no drag, resize, or remove (the hook ignores positional updates and removal). It does **not** require `field.value` to be set—you can lock an empty signature box so the signer cannot move it while they complete signing through your UI (e.g. `SignaturePreview` / `signatureDataUrl` passed to `modifyPdf`). For `text` fields, inline label and value editing remain available when locked; use your own UI or flags if the signer must not rename labels.

Combine with `FieldOverlay readOnly` to block **new** placements while signers work only on existing fields.

### `FieldOverlay readOnly`

`readOnly` disables click-to-add and sets `data-state='readonly'`. Distinct from per-field `locked`: `readOnly` = no new fields; `locked` = that field cannot drag/resize/remove.

### Pre-filled document (two phases) — consumer pattern

```tsx
// Phase 1: user A places fields and sets some values
updateField(id, { value: 'Acme Corp' })
await saveToServer(JSON.stringify(fields))

// Phase 2a: lock only rows that were prefilled (empty signer slots stay movable until you lock them)
const hydrated = parsed.map((f) => ({ ...f, locked: f.value != null && f.value !== '' }))
// Phase 2b: or lock every placement so the signer cannot move any box (incl. empty signature fields)
const hydratedAllLocked = parsed.map((f) => ({ ...f, locked: true }))

const { fields, updateField } = useFieldPlacement({ initialFields: hydratedAllLocked })

<FieldOverlay readOnly fields={fields} ... />
// User B signs / fills via your panels; modifyPdf({ fields, signer, signatureDataUrl, ... })
```

### Reusable template — consumer pattern

```tsx
// Save layout without values
const templateFields = fields.map(({ value, ...rest }) => rest)
await saveTemplate(JSON.stringify(templateFields))

// Load
const { fields, setFields } = useFieldPlacement({ initialFields: JSON.parse(await loadTemplate()) })
```

## 5) Required wiring for page-aware UI

```tsx
const viewerContainerRef = useRef<HTMLDivElement | null>(null)
const { currentPageIndex, scrollToPage } = usePdfPageVisibility({
  containerRef: viewerContainerRef,
  numPages,
})
```

```tsx
<div ref={viewerContainerRef}>
  <PdfViewer
    pdfData={pdfData}
    numPages={numPages}
    scale={scale}
    onScaleChange={setScale}
    onDocumentLoadSuccess={handleDocumentLoadSuccess}
    onPageDimensions={({ pageIndex, widthPt, heightPt }) => setPageDimension(pageIndex, widthPt, heightPt)}
    pageMode="scroll"
    currentPageIndex={currentPageIndex}
    renderToolbarContent={() => (
      <>
        <PdfPageNavigator
          currentPageIndex={currentPageIndex}
          numPages={numPages}
          onPageChange={scrollToPage}
        />
        <FieldPalette selectedFieldType={selectedFieldType} onSelectFieldType={setSelectedFieldType} />
      </>
    )}
    renderOverlay={(pageIndex) => (
      <FieldOverlay
        pageIndex={pageIndex}
        fields={fields}
        selectedFieldType={selectedFieldType}
        onAddField={(input) => { addField(input); setSelectedFieldType(null) }}
        onUpdateField={updateField}
        onRemoveField={removeField}
        preview={fieldPreview}
      />
    )}
  />
</div>
```

## 6) Composition patterns

### PatternA_desktopStickySidebar

- use `pageMode='scroll'`
- put `PdfPageNavigator + FieldPalette` in `renderToolbarContent`
- keep signer controls sticky:

```tsx
<aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
  <SignerDetailsPanel signerInfo={signerInfo} onSignerInfoChange={setSignerInfo} />
  <SignaturePreview
    signerName={displayName}
    style={signatureStyle}
    signatureDataUrl={signatureDataUrl}
    isRendering={isRendering}
    onStyleChange={setSignatureStyle}
  />
</aside>
```

### PatternB_mobileSinglePage

- use `pageMode='single'`
- keep local `singlePageIndex` state
- use `PdfPageNavigator.onPageChange -> setSinglePageIndex`

### PatternC_responsiveSwitching

- desktop: `scroll`
- narrow viewport: `single`
- keep one toolbar composition in both modes

```tsx
const [isMobile, setIsMobile] = useState(false)
const [singlePageIndex, setSinglePageIndex] = useState(0)
const isSinglePageMode = isMobile

const activePageIndex = isSinglePageMode ? singlePageIndex : currentPageIndex
const handlePageChange = (pageIndex: number) =>
  isSinglePageMode ? setSinglePageIndex(pageIndex) : scrollToPage(pageIndex)
```

### PatternD_mobileWizard

- step1: upload + signer details
- step2: `PdfViewer(pageMode='single')` + `FieldPalette` + `PdfPageNavigator`
- step3: review + sign

### PatternE_embeddedMinimal

- only `PdfViewer` + overlays + toolbar controls
- no sidebar
- recommended for constrained panes/modals

### PatternF_textFields

- Select `text` from `FieldPalette` (included by default), then click the PDF to place
- After placement, inline label then value editing writes to `fields` via `updateField`
- Optionally render your own sidebar that maps `fields.filter(f => f.type === 'text')` to inputs bound to `updateField(id, { value })`
- Use `locked` + `readOnly` for multi-step flows where some fields must not move after a prior step

## 7) Field placement data flow

### Standard field placement (palette-based)

1. User toggles a field type in `FieldPalette`
2. `FieldOverlay` enters placing mode (`data-state='placing'`, crosshair cursor)
3. User clicks on the overlay on the target page
4. Overlay computes `xPercent/yPercent` from click position relative to page
5. `onAddField` calls `useFieldPlacement.addField`, which appends a `FieldPlacement` with a unique `id`
6. Consumer resets `selectedFieldType` to `null`
7. `SignatureField` supports drag-to-move + corner resize
8. `modifyPdf` maps `xPercent/yPercent/widthPercent/heightPercent` to PDF points via `mapToPoints` per page

### Text field placement

Steps 1–8 above apply, plus:

9. For `type: 'text'`, `SignatureField` enters label-edit mode when `label` is missing
10. Label commit → `onUpdateField(id, { label })`
11. Tab/Enter → value-edit mode; value commit on blur → `onUpdateField(id, { value })`
12. At export, `modifyPdf` uses `field.value` when set; otherwise text fields without a value are skipped

## 8) Decision tree (agent-optimized)

```txt
IF desktop-first:
  use PatternA_desktopStickySidebar

IF mobile-first:
  use PatternB_mobileSinglePage

IF responsive:
  use PatternC_responsiveSwitching

IF multi-step signing flow:
  use PatternD_mobileWizard

IF embedded in modal or constrained panel:
  use PatternE_embeddedMinimal

IF document has freeform labeled fields:
  use PatternF_textFields

IF documents are usually 1-2 pages:
  default scroll mode is enough
```

## 9) Consumer responsibilities

- manage layout (sticky/fixed/sidebar/wizard)
- manage app-level validation and confirmation UX
- manage final download flow and success state
- choose mobile/desktop strategy (`scroll` vs `single`)
- style components via default `styles.css` or custom `[data-slot]` selectors and `data-locked` / `data-has-value` on fields
- persist and hydrate `FieldPlacement[]` (including `label`, `value`, `locked`) for templates and multi-step flows
- optionally build a sidebar for `text` fields that calls `updateField` — the library stays agnostic to that UI
- validate required fields in app code before calling `modifyPdf`
- optionally wire `onPageTextContent` + `textLines` for snap-to-text-line alignment (see section 10)

## 10) Snap-to-text alignment

When a user drags a field, the field can snap so the **value text that will appear in the signed PDF** aligns with a nearby line of text in the document. A thin red guide line (`[data-slot="snap-guide"]`) appears across the overlay while snap is active, similar to alignment guides in drawing tools.

Snap works for all field types. The snap reference is the **value content's visual center** within the field — measured from the DOM at drag start to account for the label, padding, and border. This ensures pixel-accurate alignment regardless of field type, label height, or CSS customization.

When a snapped field is **resized**, the snap position is automatically recalculated so the alignment is maintained with the new field dimensions.

### Enabling snap (recommended)

Use the `usePdfTextLines` hook — pass `pageDimensions` from `usePdfDocument` and wire the two returned values directly to `PdfViewer` and `FieldOverlay`:

```tsx
import { usePdfTextLines } from '@drvillo/react-browser-e-signing'

const { pageDimensions } = usePdfDocument(pdfInput)
const { textLinesByPage, handlePageTextContent } = usePdfTextLines(pageDimensions)

<PdfViewer
  {...viewerProps}
  onPageTextContent={handlePageTextContent}
  renderOverlay={(pageIndex) => (
    <FieldOverlay
      {...overlayProps}
      pageIndex={pageIndex}
      textLines={textLinesByPage.get(pageIndex)}
    />
  )}
/>
```

`FieldOverlay` threads `textLines` to each `SignatureField`, which snaps during drag automatically. `handlePageTextContent` has a stable identity — it never triggers unnecessary re-renders on `PdfViewer`. The Map resets automatically when a new document is loaded.

<details>
<summary>Manual wiring (without hook)</summary>

For full control, manage the state yourself using `groupTextLines`:

```tsx
import { groupTextLines, type TextLine } from '@drvillo/react-browser-e-signing'
import { useRef, useState, useEffect } from 'react'

const [textLinesByPage, setTextLinesByPage] = useState<Map<number, TextLine[]>>(new Map())
// Ref avoids stale closure in the callback
const pageDimensionsRef = useRef(pageDimensions)
useEffect(() => { pageDimensionsRef.current = pageDimensions }, [pageDimensions])

<PdfViewer
  onPageTextContent={(pageIndex, textContent) => {
    const pageDim = pageDimensionsRef.current.find((d) => d.pageIndex === pageIndex)
    if (!pageDim) return
    setTextLinesByPage((prev) => new Map(prev).set(pageIndex, groupTextLines(textContent, pageDim)))
  }}
  renderOverlay={(pageIndex) => (
    <FieldOverlay textLines={textLinesByPage.get(pageIndex)} ... />
  )}
/>
```

</details>

### Disabling snap

Two approaches:

1. **Do not pass `textLines`** (or pass `undefined`). This is the zero-code default — existing integrations work unchanged with no text extraction overhead.
2. **Pass `textLines={[]}`** to disable snap at runtime while keeping the wiring in place (e.g. behind a user toggle).

Snap is per-overlay. Pass `textLines` only for specific pages if needed.

### Scanned / image-only PDFs

`groupTextLines` returns `[]` when the page has no text items (e.g. a scanned image). Snap is silently skipped; no error is thrown.

### Styling the snap guide

The snap guide is a 1px-tall `div` with `data-slot="snap-guide"`. Default styles apply a red background (`#dc2626`). Override via CSS:

```css
[data-slot='snap-guide'] {
  background: #7c3aed; /* custom snap guide color */
}
```

### Snap threshold and advanced usage

The default snap threshold is **1.5% of page height**. Export `snapToTextLine` and `SNAP_THRESHOLD_PERCENT` are available for advanced integrations (e.g. custom drag implementations):

```ts
import { snapToTextLine, SNAP_THRESHOLD_PERCENT } from '@drvillo/react-browser-e-signing'

const result = snapToTextLine({
  candidateYPercent,
  fieldHeightPercent: field.heightPercent,
  textLines,
  threshold: 2.5, // wider than default
})
```
