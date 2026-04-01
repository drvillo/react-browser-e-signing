import { Document, Page, pdfjs } from 'react-pdf'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { getConfig } from '../lib/config'
import { cn } from '../lib/cn'

interface PdfViewerProps {
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  onScaleChange: (nextScale: number) => void
  onDocumentLoadSuccess: (numPages: number) => void
  onPageDimensions: (input: { pageIndex: number; widthPt: number; heightPt: number }) => void
  renderOverlay?: (pageIndex: number) => ReactNode
  className?: string
  /** PDF.js worker script URL. Overrides `configure({ pdfWorkerSrc })`. When neither is set, worker URL is left unset (no CDN injection). */
  workerSrc?: string
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
  renderOverlay,
  className,
  workerSrc,
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

  return (
    <div data-slot="pdf-viewer" className={cn(className)}>
      <div data-slot="pdf-viewer-toolbar">
        <div data-slot="pdf-viewer-page-count">Pages: {numPages || '—'}</div>
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
          {Array.from({ length: numPages }, (_, pageIndex) => (
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
                onLoadSuccess={(page) =>
                  onPageDimensions({
                    pageIndex,
                    widthPt: page.view[2],
                    heightPt: page.view[3],
                  })
                }
              />
              {renderOverlay?.(pageIndex)}
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}
