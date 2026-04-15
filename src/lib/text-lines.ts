import type { PdfPageDimensions } from '../types'

/**
 * Minimal subset of pdfjs-dist TextContent used here.
 * Structurally compatible so pdfjs TextContent satisfies this type.
 */
export interface PdfTextContent {
  items: Array<PdfTextItem | PdfTextMarkedContent>
}

interface PdfTextItem {
  str: string
  dir: string
  transform: number[]
  width: number
  height: number
  fontName: string
  hasEOL: boolean
}

interface PdfTextMarkedContent {
  type: string
}

/** A text line extracted from a PDF page, in top-down percent coordinates. */
export interface TextLine {
  /** Top edge of the line box (top-down, same convention as field yPercent). */
  yPercent: number
  /** Height of the line box as a percent of page height. */
  heightPercent: number
  /** Baseline position (top-down percent). Used for snap alignment. */
  baselinePercent: number
}

/** Max vertical distance (in PDF points) between two items considered the same line. */
const BASELINE_TOLERANCE_PT = 1.5

/** Min vertical distance (in percent) between two deduplicated lines. */
const LINE_DEDUP_TOLERANCE_PERCENT = 0.3

function isTextItem(item: PdfTextItem | PdfTextMarkedContent): item is PdfTextItem {
  return 'transform' in item
}

/**
 * Extracts text line positions from a pdfjs TextContent, returning them in
 * top-down percent coordinates consistent with field placement.
 *
 * Rotated text items are skipped. Items with zero height are skipped.
 * Scanned/image-only PDFs return an empty array (no text items).
 */
export function groupTextLines(textContent: PdfTextContent, page: PdfPageDimensions): TextLine[] {
  if (!page || page.heightPt <= 0) return []

  const textItems = textContent.items.filter((item): item is PdfTextItem => {
    if (!isTextItem(item)) return false
    if (item.height <= 0) return false
    // Skip rotated text: transform[1] is the sin component; non-zero means rotation
    if (Math.abs(item.transform[1]) > 0.01) return false
    return true
  })

  // Group items by their baseline (transform[5]) within a pt tolerance
  const groups: Array<{ baselinePt: number; maxHeightPt: number }> = []

  for (const item of textItems) {
    const baselinePt = item.transform[5]
    const heightPt = item.height

    const existing = groups.find((g) => Math.abs(baselinePt - g.baselinePt) <= BASELINE_TOLERANCE_PT)
    if (existing) {
      existing.maxHeightPt = Math.max(existing.maxHeightPt, heightPt)
    } else {
      groups.push({ baselinePt, maxHeightPt: heightPt })
    }
  }

  const lines: TextLine[] = groups.map(({ baselinePt, maxHeightPt }) => {
    // PDF origin is bottom-left; convert to top-down percent
    const baselinePercent = ((page.heightPt - baselinePt) / page.heightPt) * 100
    // Top of line box = baseline + height (upward in PDF space)
    const yPercent = ((page.heightPt - baselinePt - maxHeightPt) / page.heightPt) * 100
    const heightPercent = (maxHeightPt / page.heightPt) * 100

    return {
      yPercent: Math.max(0, yPercent),
      heightPercent,
      baselinePercent: Math.min(100, Math.max(0, baselinePercent)),
    }
  })

  lines.sort((a, b) => a.yPercent - b.yPercent)

  // Deduplicate lines that are very close together (e.g. sub-pixel font differences)
  const deduplicated: TextLine[] = []
  for (const line of lines) {
    const last = deduplicated[deduplicated.length - 1]
    if (last && Math.abs(line.baselinePercent - last.baselinePercent) < LINE_DEDUP_TOLERANCE_PERCENT) {
      last.yPercent = Math.min(last.yPercent, line.yPercent)
      last.heightPercent = Math.max(last.heightPercent, line.heightPercent)
    } else {
      deduplicated.push({ ...line })
    }
  }

  return deduplicated
}
