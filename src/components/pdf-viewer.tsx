import { Document, Page, pdfjs } from 'react-pdf'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { getConfig } from '../lib/config'
import type { PdfTextContent } from '../lib/text-lines'
import { cn } from '../lib/cn'

interface PdfViewerProps {
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  onScaleChange: (nextScale: number) => void
  onDocumentLoadSuccess: (numPages: number) => void
  onPageDimensions: (input: { pageIndex: number; widthPt: number; heightPt: number }) => void
  /**
   * Called after each page's text content is extracted (via PDF.js getTextContent).
   * Use with `groupTextLines` to enable snap-to-text-line on `FieldOverlay`.
   * Omit this prop to disable text extraction entirely (no overhead).
   */
  onPageTextContent?: (pageIndex: number, textContent: PdfTextContent) => void
  renderOverlay?: (pageIndex: number) => ReactNode
  /** Render extra controls in the toolbar between page count and zoom controls. */
  renderToolbarContent?: () => ReactNode
  className?: string
  /** PDF.js worker script URL. Overrides `configure({ pdfWorkerSrc })`. When neither is set, worker URL is left unset (no CDN injection). */
  workerSrc?: string
  /** 'scroll' renders all pages. 'single' renders only currentPageIndex. */
  pageMode?: 'scroll' | 'single'
  /** Visible page index in single mode (0-based). */
  currentPageIndex?: number
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2
const SCALE_STEP = 0.1

export function PdfViewer({
  pdfData,
  numPages,
  scale,
  onScaleChange,
  onDocumentLoadSuccess,
  onPageDimensions,
  onPageTextContent,
  renderOverlay,
  renderToolbarContent,
  className,
  workerSrc,
  pageMode = 'scroll',
  currentPageIndex = 0,
}: PdfViewerProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromConfig = getConfig().pdfWorkerSrc
    const next = workerSrc ?? fromConfig
    if (next) pdfjs.GlobalWorkerOptions.workerSrc = next
  }, [workerSrc])

  if (!pdfData)
    return (
      <div data-slot="pdf-viewer-empty" className={cn(className)}>
        Upload a PDF to begin
      </div>
    )

  const maxPageIndex = Math.max(0, numPages - 1)
  const resolvedCurrentPageIndex = Math.min(maxPageIndex, Math.max(0, currentPageIndex))
  const pageIndices =
    pageMode === 'single' ? [resolvedCurrentPageIndex] : Array.from({ length: numPages }, (_, pageIndex) => pageIndex)

  return (
    <div data-slot="pdf-viewer" className={cn(className)}>
      <div data-slot="pdf-viewer-toolbar">
        <div data-slot="pdf-viewer-page-count">Pages: {numPages || '—'}</div>
        {renderToolbarContent ? (
          <div data-slot="pdf-viewer-toolbar-content">{renderToolbarContent()}</div>
        ) : null}
        <div data-slot="pdf-viewer-zoom">
          <button
            type="button"
            data-slot="pdf-viewer-zoom-button"
            onClick={() => onScaleChange(Math.max(MIN_SCALE, Number((scale - SCALE_STEP).toFixed(2))))}
          >
            -
          </button>
          <span data-slot="pdf-viewer-zoom-value">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            data-slot="pdf-viewer-zoom-button"
            onClick={() => onScaleChange(Math.min(MAX_SCALE, Number((scale + SCALE_STEP).toFixed(2))))}
          >
            +
          </button>
        </div>
      </div>

      <Document
        file={pdfData}
        onLoadSuccess={(loadedPdf) => onDocumentLoadSuccess(loadedPdf.numPages)}
        loading={<div data-slot="pdf-viewer-loading">Loading PDF...</div>}
        error={<div data-slot="pdf-viewer-error">Unable to render this PDF.</div>}
      >
        <div data-slot="pdf-viewer-pages">
          {pageIndices.map((pageIndex) => (
            <div
              key={`pdf-page-${pageIndex}`}
              data-slot="pdf-viewer-page"
              style={{ position: 'relative', margin: '0 auto', width: 'fit-content' }}
            >
              <Page
                pageNumber={pageIndex + 1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={(page) => {
                  onPageDimensions({
                    pageIndex,
                    widthPt: page.view[2],
                    heightPt: page.view[3],
                  })
                  if (onPageTextContent) {
                    page.getTextContent().then((textContent) => {
                      onPageTextContent(pageIndex, textContent as PdfTextContent)
                    })
                  }
                }}
              />
              {renderOverlay?.(pageIndex)}
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}
