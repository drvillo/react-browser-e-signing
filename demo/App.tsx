/// <reference types="vite/client" />
import { useEffect, useMemo, useRef, useState } from 'react'
import { getPdfWorkerSrc } from '../worker/index.mjs'
import {
  configure,
  FieldOverlay,
  FieldPalette,
  PdfPageNavigator,
  PdfViewer,
  SignaturePreview,
  SignerDetailsPanel,
  SigningComplete,
  defaults,
  modifyPdf,
  sha256,
  useFieldPlacement,
  usePdfDocument,
  usePdfPageVisibility,
  useSignatureRenderer,
  usePdfTextLines,
} from '../src/index'

configure({ pdfWorkerSrc: getPdfWorkerSrc() })
import type {
  FieldPlacement,
  FieldType,
  PdfPageDimensions,
  SignatureFieldPreview,
  SignatureStyle,
  SignerInfo,
  SigningResult,
} from '../src/types'

interface SignedDocumentState {
  result: SigningResult
  downloadUrl: string
  signedAt: string
}

type DemoTheme = 'default' | 'custom'
type PageModeControl = 'auto' | 'scroll' | 'single'

const THEME_FILE_MAP: Record<DemoTheme, string> = {
  default: '/themes/default-theme.css',
  custom: '/themes/custom-theme.css',
}

const TEMPLATE_FIELDS: FieldPlacement[] = [
  {
    id: 'template-signature',
    type: 'signature',
    pageIndex: 0,
    xPercent: 10,
    yPercent: 70,
    widthPercent: 35,
    heightPercent: 8,
  },
  {
    id: 'template-name',
    type: 'fullName',
    pageIndex: 0,
    xPercent: 10,
    yPercent: 82,
    widthPercent: 30,
    heightPercent: 5,
  },
  {
    id: 'template-date',
    type: 'date',
    pageIndex: 0,
    xPercent: 60,
    yPercent: 82,
    widthPercent: 20,
    heightPercent: 5,
  },
]

function signerDisplayName(signerInfo: SignerInfo): string {
  return [signerInfo.firstName, signerInfo.lastName].filter(Boolean).join(' ').trim()
}

function createDefaultSigner(): SignerInfo {
  return {
    firstName: '',
    lastName: '',
    title: '',
  }
}

function todayDateText(): string {
  return new Date().toLocaleDateString()
}

interface SigningAreaProps {
  initialFields?: FieldPlacement[]
  onPdfClear: () => void
  pdfInput: File | null
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  setScale: (scale: number) => void
  handleDocumentLoadSuccess: (numPages: number) => void
  setPageDimension: (pageIndex: number, widthPt: number, heightPt: number) => void
  pageDimensions: PdfPageDimensions[]
  pageModeControl: PageModeControl
  visibilityThreshold: number
  showToolbarControls: boolean
  showToolbarPageNavigator: boolean
  showToolbarFieldPalette: boolean
  showStandaloneFieldPalette: boolean
  showStickySidebar: boolean
  showVisibilityReadout: boolean
}

function SigningArea({
  initialFields,
  onPdfClear,
  pdfInput,
  pdfData,
  numPages,
  scale,
  setScale,
  handleDocumentLoadSuccess,
  setPageDimension,
  pageDimensions,
  pageModeControl,
  visibilityThreshold,
  showToolbarControls,
  showToolbarPageNavigator,
  showToolbarFieldPalette,
  showStandaloneFieldPalette,
  showStickySidebar,
  showVisibilityReadout,
}: SigningAreaProps) {
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null)
  const [signerInfo, setSignerInfo] = useState<SignerInfo>(createDefaultSigner())
  const [signatureStyle, setSignatureStyle] = useState<SignatureStyle>({
    mode: 'typed',
    fontFamily: defaults.SIGNATURE_FONTS[0],
  })
  const [signedDocument, setSignedDocument] = useState<SignedDocumentState | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [singlePageIndex, setSinglePageIndex] = useState(0)
  const viewerContainerRef = useRef<HTMLDivElement | null>(null)

  const { fields, addField, updateField, removeField, clearFields, setFields } = useFieldPlacement({
    defaultWidthPercent: defaults.DEFAULT_FIELD_WIDTH_PERCENT,
    defaultHeightPercent: defaults.DEFAULT_FIELD_HEIGHT_PERCENT,
    initialFields,
  })

  const { textLinesByPage, handlePageTextContent } = usePdfTextLines(pageDimensions)

  /** PRD: readOnly overlay = no new fields on click; locked = per-field no drag/resize/remove. */
  const [overlayReadOnly, setOverlayReadOnly] = useState(false)

  useEffect(() => {
    if (overlayReadOnly) setSelectedFieldType(null)
  }, [overlayReadOnly])

  const displayName = useMemo(() => signerDisplayName(signerInfo), [signerInfo])
  const { signatureDataUrl, isRendering } = useSignatureRenderer({
    signerName: displayName,
    style: signatureStyle,
  })
  const dateText = useMemo(() => todayDateText(), [])
  const { currentPageIndex, visiblePageIndices, scrollToPage } = usePdfPageVisibility({
    containerRef: viewerContainerRef,
    numPages,
    threshold: visibilityThreshold,
  })
  const isSinglePageMode = pageModeControl === 'auto' ? isMobile : pageModeControl === 'single'
  const activePageIndex = isSinglePageMode ? singlePageIndex : currentPageIndex

  const fieldPreview: SignatureFieldPreview = useMemo(
    () => ({
      signatureDataUrl,
      fullName: displayName,
      title: signerInfo.title,
      dateText,
    }),
    [dateText, displayName, signatureDataUrl, signerInfo.title]
  )

  useEffect(() => {
    if (!signedDocument) return
    return () => URL.revokeObjectURL(signedDocument.downloadUrl)
  }, [signedDocument])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQueryList = window.matchMedia('(max-width: 1024px)')
    setIsMobile(mediaQueryList.matches)

    function handleMediaQueryChange(event: MediaQueryListEvent): void {
      setIsMobile(event.matches)
    }

    mediaQueryList.addEventListener('change', handleMediaQueryChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleMediaQueryChange)
    }
  }, [])

  useEffect(() => {
    setSinglePageIndex((previousPageIndex) => {
      if (numPages <= 0) return 0
      if (previousPageIndex < 0) return 0
      if (previousPageIndex > numPages - 1) return numPages - 1
      return previousPageIndex
    })
  }, [numPages])

  useEffect(() => {
    if (!isSinglePageMode) return
    setSinglePageIndex(currentPageIndex)
  }, [currentPageIndex, isSinglePageMode])

  const pdfKey = pdfInput ? `${pdfInput.name}-${pdfInput.size}-${pdfInput.lastModified}` : null
  const previousPdfKeyRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (previousPdfKeyRef.current === undefined) {
      previousPdfKeyRef.current = pdfKey
      return
    }

    if (previousPdfKeyRef.current === pdfKey) return

    const previousKey = previousPdfKeyRef.current
    previousPdfKeyRef.current = pdfKey

    // First upload (null → file): keep initialFields / template fields.
    if (previousKey === null && pdfKey !== null) return

    clearFields()
    setSignedDocument((previous) => {
      if (previous) URL.revokeObjectURL(previous.downloadUrl)
      return null
    })
    setErrorMessage(null)
  }, [pdfKey, clearFields])

  async function handleSignDocument(): Promise<void> {
    if (!pdfInput) {
      setErrorMessage('Upload a PDF before signing.')
      return
    }
    if (!fields.length) {
      setErrorMessage('Place at least one field before signing.')
      return
    }
    if (!displayName) {
      setErrorMessage('Enter signer first and last name before signing.')
      return
    }
    if (!signatureDataUrl) {
      setErrorMessage('Create a signature first (typed or drawn).')
      return
    }

    const confirmed = window.confirm(`You are about to sign this document as ${displayName}. Continue?`)
    if (!confirmed) return

    setIsSigning(true)
    setErrorMessage(null)

    try {
      const inputBytes = new Uint8Array(await pdfInput.arrayBuffer())
      const signedPdfBytes = await modifyPdf({
        pdfBytes: inputBytes,
        fields,
        signer: signerInfo,
        signatureDataUrl,
        pageDimensions,
        dateText,
      })
      const hash = await sha256(signedPdfBytes)
      const blob = new Blob([signedPdfBytes as BlobPart], { type: 'application/pdf' })
      const downloadUrl = URL.createObjectURL(blob)
      setSignedDocument({
        result: {
          pdfBytes: signedPdfBytes,
          sha256: hash,
        },
        downloadUrl,
        signedAt: new Date().toISOString(),
      })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign PDF')
    } finally {
      setIsSigning(false)
    }
  }

  function handleReset(): void {
    if (signedDocument) URL.revokeObjectURL(signedDocument.downloadUrl)
    setSignedDocument(null)
    onPdfClear()
    clearFields()
    setErrorMessage(null)
  }

  function handleAddField(input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }): void {
    addField(input)
    setSelectedFieldType(null)
  }

  function handlePageChange(pageIndex: number): void {
    if (isSinglePageMode) {
      setSinglePageIndex(pageIndex)
      return
    }
    scrollToPage(pageIndex)
  }

  function handleLockAllPlacements(): void {
    setFields(fields.map((field) => ({ ...field, locked: true })))
  }

  function handleLockFieldsWithValues(): void {
    setFields(
      fields.map((field) =>
        field.value != null && field.value !== '' ? { ...field, locked: true } : field
      )
    )
  }

  function handleUnlockAllFields(): void {
    setFields(fields.map((field) => ({ ...field, locked: false })))
  }

  return (
    <>
      {showVisibilityReadout ? (
        <div className="mb-4 grid gap-1 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-2">
          <div>activePage: {numPages ? activePageIndex + 1 : 0}</div>
          <div>visiblePages: {visiblePageIndices.map((pageIndex) => pageIndex + 1).join(', ') || 'none'}</div>
          <div>mode: {isSinglePageMode ? 'single' : 'scroll'}</div>
          <div>isMobile: {isMobile ? 'true' : 'false'}</div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {showStandaloneFieldPalette ? (
            <FieldPalette selectedFieldType={selectedFieldType} onSelectFieldType={setSelectedFieldType} />
          ) : null}
          {signedDocument ? (
            <SigningComplete
              signerName={displayName}
              fieldCount={fields.length}
              signedAt={new Date(signedDocument.signedAt).toLocaleString()}
              documentHash={signedDocument.result.sha256}
              downloadUrl={signedDocument.downloadUrl}
              fileName={`signed-${Date.now()}.pdf`}
              onReset={handleReset}
            />
          ) : null}
          <div ref={viewerContainerRef}>
            <PdfViewer
              pdfData={pdfData}
              numPages={numPages}
              scale={scale}
              onScaleChange={setScale}
              onDocumentLoadSuccess={handleDocumentLoadSuccess}
              onPageDimensions={({ pageIndex, widthPt, heightPt }) => setPageDimension(pageIndex, widthPt, heightPt)}
              onPageTextContent={handlePageTextContent}
              pageMode={isSinglePageMode ? 'single' : 'scroll'}
              currentPageIndex={activePageIndex}
              renderToolbarContent={
                showToolbarControls && (showToolbarPageNavigator || showToolbarFieldPalette)
                  ? () => (
                      <>
                        {showToolbarPageNavigator ? (
                          <PdfPageNavigator
                            currentPageIndex={activePageIndex}
                            numPages={numPages}
                            onPageChange={handlePageChange}
                          />
                        ) : null}
                        {showToolbarFieldPalette ? (
                          <FieldPalette selectedFieldType={selectedFieldType} onSelectFieldType={setSelectedFieldType} />
                        ) : null}
                      </>
                    )
                  : undefined
              }
              renderOverlay={(pageIndex) => (
                <FieldOverlay
                  pageIndex={pageIndex}
                  fields={fields}
                  selectedFieldType={selectedFieldType}
                  onAddField={handleAddField}
                  onUpdateField={updateField}
                  onRemoveField={removeField}
                  preview={fieldPreview}
                  readOnly={overlayReadOnly}
                  textLines={textLinesByPage.get(pageIndex)}
                />
              )}
            />
          </div>
        </section>

        <aside className={`space-y-4 ${showStickySidebar ? 'lg:sticky lg:top-6 lg:self-start' : ''}`}>
          <SignerDetailsPanel signerInfo={signerInfo} onSignerInfoChange={setSignerInfo} />

          <div
            data-demo-slot="layout-integration-card"
            className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-700"
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Layout (client integration)
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-slate-600">
              <code className="rounded bg-slate-100 px-1">FieldOverlay readOnly</code> stops{' '}
              <strong>adding</strong> fields on click—useful when a later user should only fill existing slots, not
              place new ones. Per-field <code className="rounded bg-slate-100 px-1">locked</code> fixes{' '}
              <strong>position and size</strong> (no drag, resize, or remove). Lock empty signature slots so the signer
              cannot move them; they still sign via your app (e.g. preview panel →{' '}
              <code className="rounded bg-slate-100 px-0.5">modifyPdf</code>). Text fields can still be filled/edited
              inline when locked. Combine <code className="rounded bg-slate-100 px-0.5">readOnly</code> + all{' '}
              <code className="rounded bg-slate-100 px-0.5">locked</code> for a fully fixed layout.
            </p>
            <label className="flex cursor-pointer items-start gap-2 border-b border-slate-100 pb-3">
              <input
                type="checkbox"
                checked={overlayReadOnly}
                onChange={(event) => setOverlayReadOnly(event.target.checked)}
                data-demo-slot="overlay-readonly-toggle"
              />
              <span className="grid gap-0.5">
                <span className="font-medium text-slate-800">Read-only overlay</span>
                <span className="text-xs text-slate-500">
                  No new placements on the PDF (palette selection is cleared). Existing fields still render.
                </span>
              </span>
            </label>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                data-demo-slot="lock-all-placements"
                className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
                onClick={handleLockAllPlacements}
                disabled={!fields.length}
              >
                Lock all placements (incl. empty slots)
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Typical sender → signer handoff: sender places signature/text fields, then sets{' '}
                <code className="rounded bg-slate-100 px-0.5">locked: true</code> on every field so the signer cannot
                move boxes—empty signature fields stay put until they sign.
              </p>
              <button
                type="button"
                data-demo-slot="lock-fields-with-values"
                className="rounded border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleLockFieldsWithValues}
                disabled={!fields.length}
              >
                Lock only fields that already have a value
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Alternative: lock only prefilled rows (e.g. company name); leave empty signer fields unlocked until you
                are ready.
              </p>
              <button
                type="button"
                data-demo-slot="unlock-all-fields"
                className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleUnlockAllFields}
                disabled={!fields.some((f) => f.locked)}
              >
                Unlock all fields
              </button>
            </div>
          </div>

          <SignaturePreview
            signerName={displayName}
            style={signatureStyle}
            signatureDataUrl={signatureDataUrl}
            isRendering={isRendering}
            onStyleChange={setSignatureStyle}
          />

          <div data-demo-slot="sign-card" className="rounded-lg border border-slate-300 bg-white p-4">
            <button
              type="button"
              data-demo-slot="sign-button"
              className="w-full rounded bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => void handleSignDocument()}
              disabled={isSigning || !pdfInput || !fields.length}
            >
              {isSigning ? 'Signing...' : 'Sign Document'}
            </button>
          </div>
        </aside>
      </div>

      {errorMessage ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
    </>
  )
}

export function App() {
  const [theme, setTheme] = useState<DemoTheme>('default')
  const [pdfInput, setPdfInput] = useState<File | null>(null)
  const [templateMode, setTemplateMode] = useState(false)
  const [pageModeControl, setPageModeControl] = useState<PageModeControl>('auto')
  const [showToolbarControls, setShowToolbarControls] = useState(true)
  const [showToolbarPageNavigator, setShowToolbarPageNavigator] = useState(true)
  const [showToolbarFieldPalette, setShowToolbarFieldPalette] = useState(true)
  const [showStandaloneFieldPalette, setShowStandaloneFieldPalette] = useState(false)
  const [showStickySidebar, setShowStickySidebar] = useState(true)
  const [showVisibilityReadout, setShowVisibilityReadout] = useState(true)
  const [visibilityThreshold, setVisibilityThreshold] = useState(0.5)

  const {
    pdfData,
    numPages,
    scale,
    setScale,
    pageDimensions,
    setPageDimension,
    handleDocumentLoadSuccess,
    errorMessage: documentErrorMessage,
  } = usePdfDocument(pdfInput)

  useEffect(() => {
    const linkId = 'esig-theme-link'
    let linkElement = document.getElementById(linkId) as HTMLLinkElement | null

    if (!linkElement) {
      linkElement = document.createElement('link')
      linkElement.id = linkId
      linkElement.rel = 'stylesheet'
      document.head.appendChild(linkElement)
    }

    linkElement.href = THEME_FILE_MAP[theme]
    document.body.dataset.theme = theme
  }, [theme])

  return (
    <div data-demo-slot="shell" className="mx-auto w-full max-w-[1400px] space-y-4 p-4 md:p-6">
      <header data-demo-slot="header" className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 data-demo-slot="title" className="text-xl font-semibold text-slate-900">
            Browser E-Signature Demo
          </h1>
          <button
            type="button"
            data-demo-slot="theme-toggle"
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setTheme(theme === 'default' ? 'custom' : 'default')}
          >
            Theme: {theme === 'default' ? 'Default' : 'Custom'}
          </button>
        </div>
        <p data-demo-slot="subtitle" className="text-sm text-slate-600">
          Upload, place fields, sign, and download fully in-browser. Toggle themes to verify style-agnostic library
          components.
        </p>
      </header>

      <div data-demo-slot="upload-card" className="rounded-lg border border-slate-300 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label data-demo-slot="upload-label" className="block flex-1 text-sm font-medium text-slate-700">
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              data-demo-slot="upload-input"
              className="mt-2 block w-full rounded border border-slate-300 p-2 text-sm"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null
                setPdfInput(nextFile)
              }}
            />
          </label>

          <button
            type="button"
            data-demo-slot="template-mode-button"
            aria-pressed={templateMode}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              templateMode
                ? 'border border-blue-700 bg-blue-700 text-white hover:bg-blue-800'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setTemplateMode((previousValue) => !previousValue)}
          >
            {templateMode ? 'Template Mode: On' : 'Template Mode: Off'}
          </button>
        </div>
      </div>

      <section data-demo-slot="controls-panel" className="rounded-lg border border-slate-300 bg-white p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">UX Controls Lab</h2>
          <p className="text-xs text-slate-600">
            Toggle the new primitives to inspect behavior in scroll/single modes and different control layouts.
          </p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1 rounded border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-700">Page mode behavior</span>
            <select
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
              value={pageModeControl}
              onChange={(event) => setPageModeControl(event.target.value as PageModeControl)}
            >
              <option value="auto">Auto (responsive)</option>
              <option value="scroll">Force scroll mode</option>
              <option value="single">Force single-page mode</option>
            </select>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showToolbarControls}
              onChange={(event) => setShowToolbarControls(event.target.checked)}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Enable renderToolbarContent</span>
              <span className="text-xs text-slate-500">Mount/unmount injected toolbar controls.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showToolbarPageNavigator}
              onChange={(event) => setShowToolbarPageNavigator(event.target.checked)}
              disabled={!showToolbarControls}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Show PdfPageNavigator in toolbar</span>
              <span className="text-xs text-slate-500">Prev/next and page index controls.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showToolbarFieldPalette}
              onChange={(event) => setShowToolbarFieldPalette(event.target.checked)}
              disabled={!showToolbarControls}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Show FieldPalette in toolbar</span>
              <span className="text-xs text-slate-500">Placement tool always visible while navigating pages.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showStandaloneFieldPalette}
              onChange={(event) => setShowStandaloneFieldPalette(event.target.checked)}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Show standalone FieldPalette</span>
              <span className="text-xs text-slate-500">Render additional palette above the viewer.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showStickySidebar}
              onChange={(event) => setShowStickySidebar(event.target.checked)}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Enable sticky signer sidebar</span>
              <span className="text-xs text-slate-500">Keeps signer/sign controls visible while scrolling pages.</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={showVisibilityReadout}
              onChange={(event) => setShowVisibilityReadout(event.target.checked)}
            />
            <span className="grid gap-1">
              <span className="text-xs font-medium text-slate-700">Show visibility diagnostics</span>
              <span className="text-xs text-slate-500">
                Displays active page and visible pages from usePdfPageVisibility.
              </span>
            </span>
          </label>

          <label className="grid gap-1 rounded border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-700">Visibility threshold</span>
            <select
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
              value={visibilityThreshold}
              onChange={(event) => setVisibilityThreshold(Number(event.target.value))}
            >
              <option value={0.25}>0.25 (aggressive)</option>
              <option value={0.5}>0.5 (balanced)</option>
              <option value={0.75}>0.75 (strict)</option>
            </select>
          </label>
        </div>
      </section>

      <SigningArea
        key={String(templateMode)}
        initialFields={templateMode ? TEMPLATE_FIELDS : undefined}
        onPdfClear={() => setPdfInput(null)}
        pdfInput={pdfInput}
        pdfData={pdfData}
        numPages={numPages}
        scale={scale}
        setScale={setScale}
        handleDocumentLoadSuccess={handleDocumentLoadSuccess}
        setPageDimension={setPageDimension}
        pageDimensions={pageDimensions}
        pageModeControl={pageModeControl}
        visibilityThreshold={visibilityThreshold}
        showToolbarControls={showToolbarControls}
        showToolbarPageNavigator={showToolbarPageNavigator}
        showToolbarFieldPalette={showToolbarFieldPalette}
        showStandaloneFieldPalette={showStandaloneFieldPalette}
        showStickySidebar={showStickySidebar}
        showVisibilityReadout={showVisibilityReadout}
      />

      {documentErrorMessage ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{documentErrorMessage}</div>
      ) : null}
    </div>
  )
}
