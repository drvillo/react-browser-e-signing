import { Document, Page, pdfjs } from 'react-pdf'
import type { ReactNode } from 'react'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PdfViewerProps {
  pdfData: ArrayBuffer | null
  numPages: number
  scale: number
  onScaleChange: (nextScale: number) => void
  onDocumentLoadSuccess: (numPages: number) => void
  onPageDimensions: (input: { pageIndex: number; widthPt: number; heightPt: number }) => void
  renderOverlay?: (pageIndex: number) => ReactNode
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
}: PdfViewerProps) {
  if (!pdfData)
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Upload a PDF to begin
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-white p-3">
        <div className="text-sm text-slate-700">Pages: {numPages || '—'}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            onClick={() => onScaleChange(Math.max(MIN_SCALE, Number((scale - SCALE_STEP).toFixed(2))))}
          >
            -
          </button>
          <span className="w-16 text-center text-sm text-slate-700">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            onClick={() => onScaleChange(Math.min(MAX_SCALE, Number((scale + SCALE_STEP).toFixed(2))))}
          >
            +
          </button>
        </div>
      </div>

      <Document
        file={pdfData}
        onLoadSuccess={(loadedPdf) => onDocumentLoadSuccess(loadedPdf.numPages)}
        loading={<div className="text-sm text-slate-500">Loading PDF...</div>}
        error={<div className="text-sm text-red-600">Unable to render this PDF.</div>}
      >
        <div className="space-y-6">
          {Array.from({ length: numPages }, (_, pageIndex) => (
            <div key={`pdf-page-${pageIndex}`} className="relative mx-auto w-fit rounded bg-white p-2 shadow">
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
