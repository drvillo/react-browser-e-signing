import { useCallback, useEffect, useRef, useState } from 'react'
import { groupTextLines } from '../lib/text-lines'
import type { PdfTextContent, TextLine } from '../lib/text-lines'
import type { PdfPageDimensions } from '../types'

/**
 * Manages the per-page text line state needed for snap-to-text-line on FieldOverlay.
 *
 * Pass `pageDimensions` from `usePdfDocument` and wire the returned
 * `handlePageTextContent` to `PdfViewer`'s `onPageTextContent` prop:
 *
 * ```tsx
 * const { textLinesByPage, handlePageTextContent } = usePdfTextLines(pageDimensions)
 *
 * <PdfViewer
 *   onPageTextContent={handlePageTextContent}
 *   renderOverlay={(pageIndex) => (
 *     <FieldOverlay textLines={textLinesByPage.get(pageIndex)} ... />
 *   )}
 * />
 * ```
 *
 * `handlePageTextContent` has a stable identity — it never changes between renders,
 * so it is safe to pass directly as a prop without triggering PdfViewer re-mounts.
 * Internally it reads the latest `pageDimensions` via a ref to avoid stale closures.
 *
 * The Map is reset whenever `pageDimensions` becomes empty (i.e. a new document
 * is loaded), clearing stale lines from the previous PDF.
 */
export function usePdfTextLines(pageDimensions: PdfPageDimensions[]): {
  /** Map from page index to the extracted text lines for that page. */
  textLinesByPage: Map<number, TextLine[]>
  /**
   * Stable callback to pass to `PdfViewer`'s `onPageTextContent` prop.
   * Calls `groupTextLines` and updates the internal Map.
   */
  handlePageTextContent: (pageIndex: number, textContent: PdfTextContent) => void
} {
  const [textLinesByPage, setTextLinesByPage] = useState<Map<number, TextLine[]>>(new Map())

  // Keep a ref so handlePageTextContent always sees the latest pageDimensions
  // without needing it in its dependency array (which would change identity on
  // every dimension update, causing PdfViewer to re-register the callback).
  const pageDimensionsRef = useRef<PdfPageDimensions[]>(pageDimensions)
  useEffect(() => {
    pageDimensionsRef.current = pageDimensions
  }, [pageDimensions])

  // Reset text lines when a new document is loaded (dimensions cleared).
  useEffect(() => {
    if (pageDimensions.length === 0) {
      setTextLinesByPage(new Map())
    }
  }, [pageDimensions])

  // Stable identity: deps array is empty; the ref is read inside.
  const handlePageTextContent = useCallback((pageIndex: number, textContent: PdfTextContent) => {
    const pageDim = pageDimensionsRef.current.find((d) => d.pageIndex === pageIndex)
    if (!pageDim) return
    const lines = groupTextLines(textContent, pageDim)
    setTextLinesByPage((prev) => new Map(prev).set(pageIndex, lines))
  }, [])

  return { textLinesByPage, handlePageTextContent }
}
