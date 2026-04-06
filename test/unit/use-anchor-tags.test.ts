import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

function createMockTextItem(str: string, x: number, y: number, width: number, height: number) {
  return {
    str,
    transform: [1, 0, 0, height, x, y],
    width,
    height,
    dir: 'ltr',
    hasEOL: false,
  }
}

function setupPdfjsMock(
  pages: Array<{ items: ReturnType<typeof createMockTextItem>[]; width: number; height: number }>,
  shouldFail = false
) {
  vi.doMock('pdfjs-dist', () => ({
    getDocument: () => ({
      promise: shouldFail
        ? Promise.reject(new Error('Invalid PDF structure'))
        : Promise.resolve({
            numPages: pages.length,
            getPage: async (pageNum: number) => ({
              getViewport: () => ({ width: pages[pageNum - 1].width, height: pages[pageNum - 1].height }),
              getTextContent: async () => ({ items: pages[pageNum - 1].items }),
            }),
          }),
    }),
  }))
}

afterEach(() => {
  vi.doUnmock('pdfjs-dist')
  vi.restoreAllMocks()
})

describe('useAnchorTags', () => {
  it('returns fields when pdfData has tags', async () => {
    setupPdfjsMock([
      {
        items: [createMockTextItem('{{ companyName }}', 56, 600, 120, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { useAnchorTags } = await import('../../src/hooks/use-anchor-tags')
    const pdfData = new ArrayBuffer(10)
    const { result } = renderHook(() => useAnchorTags(pdfData))

    await waitFor(() => {
      expect(result.current.isScanning).toBe(false)
    })

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0].label).toBe('companyName')
    expect(result.current.error).toBeNull()
  })

  it('returns empty fields and no error for null pdfData', async () => {
    setupPdfjsMock([])

    const { useAnchorTags } = await import('../../src/hooks/use-anchor-tags')
    const { result } = renderHook(() => useAnchorTags(null))

    expect(result.current.fields).toHaveLength(0)
    expect(result.current.isScanning).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('reports error on corrupt data', async () => {
    setupPdfjsMock([], true)

    const { useAnchorTags } = await import('../../src/hooks/use-anchor-tags')
    const pdfData = new ArrayBuffer(10)
    const { result } = renderHook(() => useAnchorTags(pdfData))

    await waitFor(() => {
      expect(result.current.isScanning).toBe(false)
    })

    expect(result.current.fields).toHaveLength(0)
    expect(result.current.error).toBe('Invalid PDF structure')
  })

  it('re-scans when pdfData reference changes', async () => {
    setupPdfjsMock([
      {
        items: [createMockTextItem('{{ first }}', 56, 600, 80, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { useAnchorTags } = await import('../../src/hooks/use-anchor-tags')
    const pdfData1 = new ArrayBuffer(10)
    const { result, rerender } = renderHook(
      ({ data }: { data: ArrayBuffer | null }) => useAnchorTags(data),
      { initialProps: { data: pdfData1 } }
    )

    await waitFor(() => {
      expect(result.current.isScanning).toBe(false)
    })

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0].label).toBe('first')

    vi.doUnmock('pdfjs-dist')
    setupPdfjsMock([
      {
        items: [
          createMockTextItem('{{ second }}', 56, 600, 80, 12),
          createMockTextItem('{{ third }}', 56, 500, 80, 12),
        ],
        width: 612,
        height: 792,
      },
    ])

    const pdfData2 = new ArrayBuffer(20)
    rerender({ data: pdfData2 })

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(2)
    })

    expect(result.current.fields[0].label).toBe('second')
    expect(result.current.fields[1].label).toBe('third')
  })
})
