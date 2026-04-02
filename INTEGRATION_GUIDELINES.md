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

## 2) Full Public API (post-change)

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
  className?: string
}
```

```ts
interface FieldPaletteProps {
  selectedFieldType: FieldType | null
  onSelectFieldType: (fieldType: FieldType | null) => void
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
}): {
  fields: FieldPlacement[]
  addField: (input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }) => FieldPlacement
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
type FieldType = 'signature' | 'fullName' | 'title' | 'date'

interface FieldPlacement {
  id: string
  type: FieldType
  pageIndex: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
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
```

### 2.4 Utilities and config

```ts
function configure(options: {
  pdfWorkerSrc?: string
  fontMode?: 'network' | 'local-only'
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

## 3) Multi-Page behavior (post-change)

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

## 4) Required wiring for page-aware UI

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
        onAddField={handleAddField}
        onUpdateField={updateField}
        onRemoveField={removeField}
        preview={fieldPreview}
      />
    )}
  />
</div>
```

## 5) Composition patterns

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

## 6) Field placement data flow

1. user toggles a field in `FieldPalette`
2. `FieldOverlay` enters placing mode (`data-state='placing'`, crosshair cursor)
3. user clicks overlay on target page
4. overlay computes `xPercent/yPercent` from click position
5. `useFieldPlacement.addField` adds a `FieldPlacement` with `pageIndex`
6. `SignatureField` supports drag move + corner resize
7. `modifyPdf` maps percentages to PDF points using `mapToPoints` for each page

## 7) Decision tree (agent-optimized)

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

IF documents are usually 1-2 pages:
  default scroll mode is enough
```

## 8) Consumer responsibilities

- manage layout (sticky/fixed/sidebar/wizard)
- manage app-level validation and confirmation UX
- manage final download flow and success state
- choose mobile/desktop strategy (`scroll` vs `single`)
- style components via default `styles.css` or custom `[data-slot]` selectors
