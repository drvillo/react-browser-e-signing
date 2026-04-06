import { describe, expect, it, vi } from 'vitest'
import { scanAnchorTags } from '../../src/hooks/use-anchor-tags'

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

function mockPdfjsDist(pages: Array<{ items: ReturnType<typeof createMockTextItem>[]; width: number; height: number }>) {
  const mockPages = pages.map((pageConfig, index) => ({
    getViewport: () => ({ width: pageConfig.width, height: pageConfig.height }),
    getTextContent: async () => ({ items: pageConfig.items }),
  }))

  vi.doMock('pdfjs-dist', () => ({
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: pages.length,
        getPage: async (pageNum: number) => mockPages[pageNum - 1],
      }),
    }),
  }))
}

describe('scanAnchorTags', () => {
  it('detects a single anchor tag on one page', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('{{ companyName }}', 56, 600, 120, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(1)
    expect(fields[0].type).toBe('custom')
    expect(fields[0].label).toBe('companyName')
    expect(fields[0].locked).toBe(true)
    expect(fields[0].pageIndex).toBe(0)
    expect(fields[0].xPercent).toBeCloseTo((56 / 612) * 100, 0)

    vi.doUnmock('pdfjs-dist')
  })

  it('detects multiple tags on one page', async () => {
    mockPdfjsDist([
      {
        items: [
          createMockTextItem('{{ companyName }}', 56, 600, 120, 12),
          createMockTextItem('{{ role }}', 56, 560, 80, 12),
        ],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(2)
    expect(fields[0].label).toBe('companyName')
    expect(fields[1].label).toBe('role')

    vi.doUnmock('pdfjs-dist')
  })

  it('detects tags across pages with correct pageIndex', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('{{ companyName }}', 56, 600, 120, 12)],
        width: 612,
        height: 792,
      },
      {
        items: [createMockTextItem('{{ agreementDate }}', 56, 600, 130, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(2)
    expect(fields[0].pageIndex).toBe(0)
    expect(fields[0].label).toBe('companyName')
    expect(fields[1].pageIndex).toBe(1)
    expect(fields[1].label).toBe('agreementDate')

    vi.doUnmock('pdfjs-dist')
  })

  it('trims extra whitespace from field names', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('{{   foo   }}', 56, 600, 100, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(1)
    expect(fields[0].label).toBe('foo')

    vi.doUnmock('pdfjs-dist')
  })

  it('skips empty field names {{ }}', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('{{ }}', 56, 600, 40, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(0)

    vi.doUnmock('pdfjs-dist')
  })

  it('returns empty array for PDF with no tags', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('Just regular text.', 56, 600, 150, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(0)

    vi.doUnmock('pdfjs-dist')
  })

  it('handles duplicate labels as separate fields', async () => {
    mockPdfjsDist([
      {
        items: [
          createMockTextItem('{{ amount }}', 56, 600, 80, 12),
          createMockTextItem('{{ amount }}', 56, 400, 80, 12),
        ],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(2)
    expect(fields[0].label).toBe('amount')
    expect(fields[1].label).toBe('amount')
    expect(fields[0].id).not.toBe(fields[1].id)

    vi.doUnmock('pdfjs-dist')
  })

  it('produces stable ordering for same input', async () => {
    const mockConfig = [
      {
        items: [
          createMockTextItem('{{ alpha }}', 56, 700, 80, 12),
          createMockTextItem('{{ beta }}', 56, 600, 80, 12),
          createMockTextItem('{{ gamma }}', 56, 500, 80, 12),
        ],
        width: 612,
        height: 792,
      },
    ]

    mockPdfjsDist(mockConfig)
    const { scanAnchorTags: scan1 } = await import('../../src/hooks/use-anchor-tags')
    const fields1 = await scan1(new ArrayBuffer(10))
    vi.doUnmock('pdfjs-dist')

    mockPdfjsDist(mockConfig)
    const { scanAnchorTags: scan2 } = await import('../../src/hooks/use-anchor-tags')
    const fields2 = await scan2(new ArrayBuffer(10))
    vi.doUnmock('pdfjs-dist')

    expect(fields1.map((f) => f.label)).toEqual(fields2.map((f) => f.label))
    expect(fields1.map((f) => f.pageIndex)).toEqual(fields2.map((f) => f.pageIndex))
  })

  it('respects locked: false option', async () => {
    mockPdfjsDist([
      {
        items: [createMockTextItem('{{ test }}', 56, 600, 80, 12)],
        width: 612,
        height: 792,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10), { locked: false })

    expect(fields).toHaveLength(1)
    expect(fields[0].locked).toBe(false)

    vi.doUnmock('pdfjs-dist')
  })

  it('computes position as percentage of page dimensions', async () => {
    const pageWidth = 612
    const pageHeight = 792
    const x = 100
    const y = 500
    const width = 150
    const height = 14

    mockPdfjsDist([
      {
        items: [createMockTextItem('{{ pos }}', x, y, width, height)],
        width: pageWidth,
        height: pageHeight,
      },
    ])

    const { scanAnchorTags: scan } = await import('../../src/hooks/use-anchor-tags')
    const fields = await scan(new ArrayBuffer(10))

    expect(fields).toHaveLength(1)

    const expectedXPercent = (x / pageWidth) * 100
    const expectedYPercent = ((pageHeight - y - height) / pageHeight) * 100
    const expectedWidthPercent = (width / pageWidth) * 100
    const expectedHeightPercent = (height / pageHeight) * 100

    expect(fields[0].xPercent).toBeCloseTo(expectedXPercent, 1)
    expect(fields[0].yPercent).toBeCloseTo(expectedYPercent, 1)
    expect(fields[0].widthPercent).toBeCloseTo(expectedWidthPercent, 1)
    expect(fields[0].heightPercent).toBeCloseTo(expectedHeightPercent, 1)

    vi.doUnmock('pdfjs-dist')
  })
})
