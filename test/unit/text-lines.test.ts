import { describe, expect, it } from 'vitest'
import { groupTextLines } from '../../src/lib/text-lines'
import type { PdfTextContent } from '../../src/lib/text-lines'
import type { PdfPageDimensions } from '../../src/types'

const PAGE: PdfPageDimensions = { pageIndex: 0, widthPt: 612, heightPt: 792 }

function makeItem(
  baselinePt: number,
  heightPt: number,
  overrides: Partial<{ rotationB: number; str: string }> = {}
) {
  return {
    str: overrides.str ?? 'text',
    dir: 'ltr',
    // transform: [scaleX, sinRot, -sinRot, scaleY, tx, ty]
    transform: [12, overrides.rotationB ?? 0, 0, 12, 50, baselinePt],
    width: 100,
    height: heightPt,
    fontName: 'Helvetica',
    hasEOL: false,
  }
}

describe('groupTextLines', () => {
  it('returns empty array for empty items', () => {
    const content: PdfTextContent = { items: [] }
    expect(groupTextLines(content, PAGE)).toEqual([])
  })

  it('returns empty array when page height is zero', () => {
    const content: PdfTextContent = { items: [makeItem(100, 12)] }
    expect(groupTextLines(content, { ...PAGE, heightPt: 0 })).toEqual([])
  })

  it('converts a single item to a text line in top-down percent', () => {
    // baseline at 700pt on a 792pt page
    // baselinePercent = (792 - 700) / 792 * 100 ≈ 11.62%
    // yPercent (line top) = (792 - 700 - 14) / 792 * 100 ≈ 9.85%
    const content: PdfTextContent = { items: [makeItem(700, 14)] }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.baselinePercent).toBeCloseTo((792 - 700) / 792 * 100, 2)
    expect(lines[0]!.yPercent).toBeCloseTo((792 - 700 - 14) / 792 * 100, 2)
    expect(lines[0]!.heightPercent).toBeCloseTo(14 / 792 * 100, 2)
  })

  it('groups items with baselines within 1.5pt tolerance into one line', () => {
    const content: PdfTextContent = {
      items: [
        makeItem(600, 12),
        makeItem(601, 13), // within tolerance of 600
        makeItem(602, 11), // within tolerance of 600 (< 1.5pt from closest)
      ],
    }
    // All three are within 1.5pt of each other (grouping is sequential)
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(1)
    // maxHeightPt = 13
    expect(lines[0]!.heightPercent).toBeCloseTo(13 / 792 * 100, 2)
  })

  it('produces separate lines for items with baselines far apart', () => {
    const content: PdfTextContent = {
      items: [
        makeItem(700, 12), // line near top of page
        makeItem(400, 12), // line in middle of page
      ],
    }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(2)
    // Sorted top to bottom (lower yPercent = closer to top)
    expect(lines[0]!.baselinePercent).toBeLessThan(lines[1]!.baselinePercent)
  })

  it('skips rotated items (transform[1] !== 0)', () => {
    const content: PdfTextContent = {
      items: [
        makeItem(700, 12),                         // normal
        makeItem(600, 12, { rotationB: 0.5 }),     // rotated
      ],
    }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.baselinePercent).toBeCloseTo((792 - 700) / 792 * 100, 2)
  })

  it('skips TextMarkedContent items (no transform property)', () => {
    const content: PdfTextContent = {
      items: [
        { type: 'beginMarkedContent' },          // TextMarkedContent - no transform
        makeItem(700, 12),
        { type: 'endMarkedContent' },
      ],
    }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(1)
  })

  it('skips items with zero height', () => {
    const content: PdfTextContent = {
      items: [
        makeItem(700, 0),  // zero height — skipped
        makeItem(600, 12),
      ],
    }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.baselinePercent).toBeCloseTo((792 - 600) / 792 * 100, 2)
  })

  it('deduplicates lines within 0.3% vertical tolerance', () => {
    // Two baselines very close to each other in percent:
    // 600pt and 601pt on 792pt page: difference = 1/792*100 ≈ 0.126% — below 0.3% threshold
    const content: PdfTextContent = {
      items: [makeItem(600, 12), makeItem(601, 13)],
    }
    const lines = groupTextLines(content, PAGE)
    // They differ by 1pt in baseline → within tolerance → grouped first, then deduped
    expect(lines).toHaveLength(1)
  })

  it('returns lines sorted top-to-bottom (ascending yPercent)', () => {
    const content: PdfTextContent = {
      items: [
        makeItem(200, 12), // lower on the page (higher yPercent)
        makeItem(600, 12), // higher on the page (lower yPercent)
        makeItem(400, 12), // middle
      ],
    }
    const lines = groupTextLines(content, PAGE)
    expect(lines).toHaveLength(3)
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]!.yPercent).toBeGreaterThanOrEqual(lines[i - 1]!.yPercent)
    }
  })
})
