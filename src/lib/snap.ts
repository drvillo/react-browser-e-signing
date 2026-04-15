import type { TextLine } from './text-lines'

/**
 * How close the field's value center must be to a text line baseline
 * (in page-percent units) to trigger a snap.
 */
export const SNAP_THRESHOLD_PERCENT = 1.5

export interface SnapResult {
  /** The (possibly snapped) yPercent for the field top. */
  yPercent: number
  /**
   * The baseline percent of the snapped text line (for rendering the guide),
   * or null if no snap occurred.
   */
  snappedLineBaselinePercent: number | null
}

/**
 * Returns the snapped field top so the rendered value aligns with the nearest
 * text line baseline, if within the snap threshold.
 *
 * The snap reference point is the value content's visual center within the
 * field, controlled by `valueCenterRatio`:
 *
 *   snapRef = fieldTop + fieldHeight * valueCenterRatio
 *   => snappedFieldTop = baseline - fieldHeight * valueCenterRatio
 *
 * Default `valueCenterRatio` is 0.5 (geometric center). Callers should measure
 * the actual value element position in the DOM and pass the measured ratio for
 * pixel-accurate alignment — this accounts for the field's label, padding, and
 * border pushing the value content below the geometric center.
 */
export function snapToTextLine(params: {
  candidateYPercent: number
  fieldHeightPercent: number
  textLines: TextLine[]
  /**
   * Where the value content's visual center sits within the field, as a
   * fraction of field height from the top (0 = top edge, 1 = bottom edge).
   * Defaults to 0.5 (geometric center).
   */
  valueCenterRatio?: number
  threshold?: number
}): SnapResult {
  const {
    candidateYPercent,
    fieldHeightPercent,
    textLines,
    valueCenterRatio = 0.5,
    threshold = SNAP_THRESHOLD_PERCENT,
  } = params

  if (textLines.length === 0) {
    return { yPercent: candidateYPercent, snappedLineBaselinePercent: null }
  }

  const snapRefPercent = candidateYPercent + fieldHeightPercent * valueCenterRatio

  let bestLine: TextLine | null = null
  let bestDistance = Infinity

  for (const line of textLines) {
    const distance = Math.abs(line.baselinePercent - snapRefPercent)
    if (distance < bestDistance) {
      bestDistance = distance
      bestLine = line
    }
  }

  if (bestLine === null || bestDistance > threshold) {
    return { yPercent: candidateYPercent, snappedLineBaselinePercent: null }
  }

  const snappedYPercent = bestLine.baselinePercent - fieldHeightPercent * valueCenterRatio
  const clampedYPercent = Math.max(0, Math.min(100 - fieldHeightPercent, snappedYPercent))

  return {
    yPercent: clampedYPercent,
    snappedLineBaselinePercent: bestLine.baselinePercent,
  }
}
