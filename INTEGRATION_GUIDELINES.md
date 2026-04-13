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
  onUpdateCustomValue?: (label: string, value: string) => void
  onCustomFieldRenamed?: (oldLabel: string, newLabel: string) => void
  preview: SignatureFieldPreview
  className?: string
}
```

```ts
interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  onUpdateCustomValue?: (label: string, value: string) => void
  onCustomFieldRenamed?: (oldLabel: string, newLabel: string) => void
  className?: string
}
```

```ts
interface FieldPaletteProps {
  selectedFieldType: FieldType | null
  onSelectFieldType: (fieldType: FieldType | null) => void
  fieldTypes?: FieldType[]   // defaults to ['signature', 'fullName', 'title', 'date'] — excludes 'custom'
  className?: string
}
```

```ts
interface CustomFieldsPanelProps {
  fields: FieldPlacement[]
  values: Record<string, string>
  onValuesChange: (nextValues: Record<string, string>) => void
  isPlacingField: boolean
  onTogglePlacing: () => void
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
  updateField: (id: string, partial: Partial<FieldPlacement>) => void
  removeField: (id: string) => void
  clearFields: () => void
}
```

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

### 2.3 Types

```ts
type FieldType = 'signature' | 'fullName' | 'title' | 'date' | 'custom'

interface FieldPlacement {
  id: string
  type: FieldType
  pageIndex: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  label?: string   // required for 'custom' fields; used as the key in SignerInfo.customFields
}

interface SignerInfo {
  firstName: string
  lastName: string
  title: string
  customFields?: Record<string, string>
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
  customFields?: Record<string, string>
}
```

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
  signer: SignerInfo
  signatureDataUrl: string
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
```

### 2.5 Constants

```ts
const defaults: {
  SIGNATURE_FONTS: readonly string[]
  DEFAULT_FIELD_WIDTH_PERCENT: 25
  DEFAULT_FIELD_HEIGHT_PERCENT: 5
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
  customFieldsPanel: 'custom-fields-panel',
  customFieldsPanelHeading: 'custom-fields-panel-heading',
  customFieldsPanelLabel: 'custom-fields-panel-label',
  customFieldsPanelInput: 'custom-fields-panel-input',
  customFieldsPanelAddButton: 'custom-fields-panel-add-button',
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

## 4) Custom fields wiring

Custom fields let consumers add freeform labeled fields to any PDF. The workflow is: place → label inline → optionally fill value inline or via `CustomFieldsPanel`.

### State the consumer owns

```tsx
const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null)
const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
```

### Wire `CustomFieldsPanel` to drive placement

```tsx
<CustomFieldsPanel
  fields={fields}
  values={customFieldValues}
  onValuesChange={setCustomFieldValues}
  isPlacingField={selectedFieldType === 'custom'}
  onTogglePlacing={() =>
    setSelectedFieldType((prev) => (prev === 'custom' ? null : 'custom'))
  }
/>
```

`isPlacingField` tells the panel which state to show ("Click on the PDF to place…" vs. "+ New field"). `onTogglePlacing` hands control of `selectedFieldType` back to the consumer so `FieldOverlay` also responds correctly.

### Wire `FieldOverlay` for placement, value updates, and renames

```tsx
renderOverlay={(pageIndex) => (
  <FieldOverlay
    pageIndex={pageIndex}
    fields={fields}
    selectedFieldType={selectedFieldType}
    onAddField={(input) => { addField(input); setSelectedFieldType(null) }}
    onUpdateField={updateField}
    onRemoveField={removeField}
    onUpdateCustomValue={(label, value) =>
      setCustomFieldValues((prev) => ({ ...prev, [label]: value }))
    }
    onCustomFieldRenamed={(oldLabel, newLabel) =>
      setCustomFieldValues((prev) => {
        const { [oldLabel]: value, ...rest } = prev
        return { ...rest, [newLabel]: value ?? '' }
      })
    }
    preview={fieldPreview}
  />
)}
```

`onUpdateCustomValue` fires when the user commits a value via inline editing inside `SignatureField`. `onCustomFieldRenamed` fires when the user renames a label; the consumer must migrate any stored value from the old key to the new key.

### Inline editing UX (managed by `SignatureField`)

When a custom field is placed without a label:
1. `SignatureField` immediately enters label-editing mode and focuses the label input.
2. The user types a label and commits with Enter, Tab, or blur.
3. On Tab or Enter the field transitions to value-editing mode; on blur/Escape it returns to idle.
4. When the value is committed, `onUpdateCustomValue(label, value)` fires and `CustomFieldsPanel` updates.

Consumers can also edit values directly in `CustomFieldsPanel` — both paths write to the same `customFieldValues` map.

### Pass custom values to `modifyPdf`

```tsx
const signerWithCustomFields: SignerInfo = {
  ...signerInfo,
  customFields: customFieldValues,
}

const signedPdfBytes = await modifyPdf({
  pdfBytes: inputBytes,
  fields,
  signer: signerWithCustomFields,
  signatureDataUrl,
  pageDimensions,
  dateText,
})
```

`modifyPdf` reads `signer.customFields[field.label]` for each `type === 'custom'` field and stamps the value onto the PDF.

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
        onUpdateCustomValue={(label, value) =>
          setCustomFieldValues((prev) => ({ ...prev, [label]: value }))
        }
        onCustomFieldRenamed={(oldLabel, newLabel) =>
          setCustomFieldValues((prev) => {
            const { [oldLabel]: value, ...rest } = prev
            return { ...rest, [newLabel]: value ?? '' }
          })
        }
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
  <CustomFieldsPanel
    fields={fields}
    values={customFieldValues}
    onValuesChange={setCustomFieldValues}
    isPlacingField={selectedFieldType === 'custom'}
    onTogglePlacing={() => setSelectedFieldType((prev) => (prev === 'custom' ? null : 'custom'))}
  />
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

### PatternF_customFields

- Use `CustomFieldsPanel` in the sidebar; it owns the "+ New field" button
- Do not add `'custom'` to `FieldPalette.fieldTypes` when `CustomFieldsPanel` is present — each is a standalone entry point
- When the user clicks "+ New field", `onTogglePlacing` sets `selectedFieldType = 'custom'`; `FieldOverlay` enters crosshair mode
- After placement, `SignatureField` auto-enters label-edit mode; Tab/Enter transitions to value-edit mode
- `onUpdateCustomValue` and `onCustomFieldRenamed` propagate changes back to consumer state
- `CustomFieldsPanel` re-renders automatically once `fields` contains entries with labels

```tsx
// Minimal custom fields integration
const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

<CustomFieldsPanel
  fields={fields}
  values={customFieldValues}
  onValuesChange={setCustomFieldValues}
  isPlacingField={selectedFieldType === 'custom'}
  onTogglePlacing={() => setSelectedFieldType((prev) => (prev === 'custom' ? null : 'custom'))}
/>

// In renderOverlay:
onUpdateCustomValue={(label, value) =>
  setCustomFieldValues((prev) => ({ ...prev, [label]: value }))
}
onCustomFieldRenamed={(oldLabel, newLabel) =>
  setCustomFieldValues((prev) => {
    const { [oldLabel]: value, ...rest } = prev
    return { ...rest, [newLabel]: value ?? '' }
  })
}
```

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

### Custom field placement

Steps 1–8 above apply, plus:

9. `SignatureField` immediately enters label-edit mode (no label yet)
10. User types a label and commits → `onUpdateField(id, { label })` fires
11. If committed via Tab or Enter, value-edit mode activates → `onUpdateCustomValue(label, value)` fires on blur
12. `CustomFieldsPanel` derives its displayed fields from `fields.filter(f => f.type === 'custom' && f.label)`
13. On rename: `onCustomFieldRenamed(oldLabel, newLabel)` → consumer migrates value key
14. At export, `modifyPdf` draws a white background over the field area and stamps `signer.customFields[field.label]`

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
  use PatternF_customFields

IF documents are usually 1-2 pages:
  default scroll mode is enough
```

## 9) Consumer responsibilities

- manage layout (sticky/fixed/sidebar/wizard)
- manage app-level validation and confirmation UX
- manage final download flow and success state
- choose mobile/desktop strategy (`scroll` vs `single`)
- style components via default `styles.css` or custom `[data-slot]` selectors
- own `customFieldValues: Record<string, string>` state and pass it into `SignerInfo.customFields` before calling `modifyPdf`
- handle `onUpdateCustomValue` to merge inline-edited values into `customFieldValues`
- handle `onCustomFieldRenamed` to migrate the value stored under the old label key to the new key
- render `CustomFieldsPanel` (or equivalent custom UI) to let signers fill custom field values and trigger placement mode
