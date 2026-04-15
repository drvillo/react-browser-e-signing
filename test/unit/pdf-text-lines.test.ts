import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePdfTextLines } from '../../src/hooks/use-pdf-text-lines'
import type { PdfTextContent } from '../../src/lib/text-lines'
import type { PdfPageDimensions } from '../../src/types'

const PAGE_0: PdfPageDimensions = { pageIndex: 0, widthPt: 612, heightPt: 792 }
const PAGE_1: PdfPageDimensions = { pageIndex: 1, widthPt: 612, heightPt: 792 }

function makeTextContent(baselinePt: number, heightPt = 12): PdfTextContent {
  return {
    items: [
      {
        str: 'Hello',
        dir: 'ltr',
        transform: [12, 0, 0, 12, 50, baselinePt],
        width: 100,
        height: heightPt,
        fontName: 'Helvetica',
        hasEOL: false,
      },
    ],
  }
}

describe('usePdfTextLines', () => {
  it('returns an empty Map initially', () => {
    const { result } = renderHook(() => usePdfTextLines([PAGE_0]))
    expect(result.current.textLinesByPage.size).toBe(0)
  })

  it('populates the Map when handlePageTextContent is called with a known page', () => {
    const { result } = renderHook(() => usePdfTextLines([PAGE_0]))

    act(() => {
      result.current.handlePageTextContent(0, makeTextContent(700, 14))
    })

    expect(result.current.textLinesByPage.has(0)).toBe(true)
    const lines = result.current.textLinesByPage.get(0)!
    expect(lines.length).toBeGreaterThan(0)
    // baseline at 700pt on 792pt page → (792-700)/792*100 ≈ 11.62%
    expect(lines[0]!.baselinePercent).toBeCloseTo((792 - 700) / 792 * 100, 2)
  })

  it('silently skips when pageIndex has no matching dimension', () => {
    const { result } = renderHook(() => usePdfTextLines([PAGE_0]))

    act(() => {
      // pageIndex 99 is not in dimensions
      result.current.handlePageTextContent(99, makeTextContent(400))
    })

    expect(result.current.textLinesByPage.size).toBe(0)
  })

  it('handles multiple pages independently', () => {
    const { result } = renderHook(() => usePdfTextLines([PAGE_0, PAGE_1]))

    act(() => {
      result.current.handlePageTextContent(0, makeTextContent(700))
      result.current.handlePageTextContent(1, makeTextContent(600))
    })

    expect(result.current.textLinesByPage.has(0)).toBe(true)
    expect(result.current.textLinesByPage.has(1)).toBe(true)
    // Each page has its own lines
    expect(result.current.textLinesByPage.get(0)![0]!.baselinePercent).toBeCloseTo(
      (792 - 700) / 792 * 100, 2
    )
    expect(result.current.textLinesByPage.get(1)![0]!.baselinePercent).toBeCloseTo(
      (792 - 600) / 792 * 100, 2
    )
  })

  it('resets the Map when pageDimensions becomes empty (new document loaded)', () => {
    let dims: PdfPageDimensions[] = [PAGE_0]
    const { result, rerender } = renderHook(() => usePdfTextLines(dims))

    act(() => {
      result.current.handlePageTextContent(0, makeTextContent(700))
    })
    expect(result.current.textLinesByPage.size).toBe(1)

    // Simulate new document load: dimensions cleared first
    dims = []
    rerender()

    expect(result.current.textLinesByPage.size).toBe(0)
  })

  it('handlePageTextContent has stable identity across re-renders', () => {
    let dims: PdfPageDimensions[] = [PAGE_0]
    const { result, rerender } = renderHook(() => usePdfTextLines(dims))

    const firstRef = result.current.handlePageTextContent

    // Trigger a re-render by changing dims (but not clearing)
    dims = [PAGE_0, PAGE_1]
    rerender()

    expect(result.current.handlePageTextContent).toBe(firstRef)
  })

  it('uses latest pageDimensions inside the stable callback (no stale closure)', () => {
    // Start with no dimensions
    let dims: PdfPageDimensions[] = []
    const { result, rerender } = renderHook(() => usePdfTextLines(dims))

    // Add page 0 dimension (without changing callback identity)
    dims = [PAGE_0]
    rerender()

    // Calling the callback should now find page 0's dimension
    act(() => {
      result.current.handlePageTextContent(0, makeTextContent(700))
    })

    expect(result.current.textLinesByPage.has(0)).toBe(true)
  })
})
