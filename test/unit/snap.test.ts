import { describe, expect, it } from 'vitest'
import { snapToTextLine, SNAP_THRESHOLD_PERCENT } from '../../src/lib/snap'
import type { TextLine } from '../../src/lib/text-lines'

function makeLine(baselinePercent: number, heightPercent = 1.5): TextLine {
  return {
    baselinePercent,
    yPercent: baselinePercent - heightPercent,
    heightPercent,
  }
}

describe('snapToTextLine — default (valueCenterRatio = 0.5)', () => {
  it('returns original position when textLines is empty', () => {
    const result = snapToTextLine({
      candidateYPercent: 20,
      fieldHeightPercent: 7,
      textLines: [],
    })
    expect(result.yPercent).toBe(20)
    expect(result.snappedLineBaselinePercent).toBeNull()
  })

  it('snaps when field center is exactly on a text line baseline', () => {
    const fieldHeight = 7
    const baseline = 30
    const candidate = baseline - fieldHeight / 2

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
    })

    expect(result.snappedLineBaselinePercent).toBe(baseline)
    expect(result.yPercent + fieldHeight / 2).toBeCloseTo(baseline, 5)
  })

  it('snaps when field center is within threshold', () => {
    const fieldHeight = 7
    const baseline = 30
    const candidate = baseline - fieldHeight / 2 + SNAP_THRESHOLD_PERCENT * 0.5

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
    })

    expect(result.snappedLineBaselinePercent).toBe(baseline)
    expect(result.yPercent + fieldHeight / 2).toBeCloseTo(baseline, 5)
  })

  it('does NOT snap when field center is beyond threshold', () => {
    const fieldHeight = 7
    const baseline = 30
    const candidate = baseline - fieldHeight / 2 + SNAP_THRESHOLD_PERCENT * 2.5

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
    })

    expect(result.yPercent).toBe(candidate)
    expect(result.snappedLineBaselinePercent).toBeNull()
  })

  it('snaps to the nearest line when multiple lines exist', () => {
    const fieldHeight = 7
    const candidateYPercent = 25.5 - fieldHeight / 2

    const result = snapToTextLine({
      candidateYPercent,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(25), makeLine(40)],
    })

    expect(result.snappedLineBaselinePercent).toBe(25)
    expect(result.yPercent + fieldHeight / 2).toBeCloseTo(25, 5)
  })

  it('uses a custom threshold', () => {
    const fieldHeight = 7
    const baseline = 50
    const candidate = baseline - fieldHeight / 2 + 0.5

    const tight = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      threshold: 0.2,
    })
    expect(tight.snappedLineBaselinePercent).toBeNull()

    const loose = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      threshold: 2,
    })
    expect(loose.snappedLineBaselinePercent).toBe(baseline)
  })

  it('clamps snapped yPercent to [0, 100 - fieldHeight]', () => {
    const fieldHeight = 7
    const result = snapToTextLine({
      candidateYPercent: 0,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(1)],
      threshold: 10,
    })
    expect(result.yPercent).toBeGreaterThanOrEqual(0)
    expect(result.yPercent).toBeLessThanOrEqual(100 - fieldHeight)
  })

  it('works with different field heights (resize scenario)', () => {
    const baseline = 40

    for (const fieldHeight of [3, 7, 12, 20]) {
      const candidate = baseline - fieldHeight / 2
      const result = snapToTextLine({
        candidateYPercent: candidate,
        fieldHeightPercent: fieldHeight,
        textLines: [makeLine(baseline)],
      })
      expect(result.snappedLineBaselinePercent).toBe(baseline)
      expect(result.yPercent + fieldHeight / 2).toBeCloseTo(baseline, 5)
    }
  })
})

describe('snapToTextLine — custom valueCenterRatio', () => {
  it('uses valueCenterRatio to shift the snap reference point', () => {
    const fieldHeight = 10
    const baseline = 50
    // Value center at 65% of field height (label pushes content down)
    const ratio = 0.65
    // Snap ref = candidateY + 10 * 0.65 = candidateY + 6.5
    // For snap: candidateY + 6.5 = 50 → candidateY = 43.5
    const candidate = baseline - fieldHeight * ratio

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      valueCenterRatio: ratio,
    })

    expect(result.snappedLineBaselinePercent).toBe(baseline)
    // The snap reference (fieldTop + fieldHeight * ratio) should land on baseline
    expect(result.yPercent + fieldHeight * ratio).toBeCloseTo(baseline, 5)
    // fieldTop is shifted up compared to center-based snap
    expect(result.yPercent).toBeCloseTo(baseline - fieldHeight * ratio, 5)
  })

  it('ratio > 0.5 shifts snap reference below center (typical for fields with labels)', () => {
    const fieldHeight = 7
    const baseline = 30
    const ratio = 0.65

    const centerResult = snapToTextLine({
      candidateYPercent: baseline - fieldHeight * 0.5,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      valueCenterRatio: 0.5,
    })

    const shiftedResult = snapToTextLine({
      candidateYPercent: baseline - fieldHeight * ratio,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      valueCenterRatio: ratio,
    })

    // Both snap to the same baseline
    expect(centerResult.snappedLineBaselinePercent).toBe(baseline)
    expect(shiftedResult.snappedLineBaselinePercent).toBe(baseline)

    // But with ratio > 0.5, field top is higher (further from baseline)
    expect(shiftedResult.yPercent).toBeLessThan(centerResult.yPercent)
  })

  it('ratio = 1.0 snaps field bottom to baseline', () => {
    const fieldHeight = 7
    const baseline = 50
    const candidate = baseline - fieldHeight

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      valueCenterRatio: 1.0,
    })

    expect(result.snappedLineBaselinePercent).toBe(baseline)
    expect(result.yPercent + fieldHeight).toBeCloseTo(baseline, 5)
  })

  it('ratio = 0.0 snaps field top to baseline', () => {
    const fieldHeight = 7
    const baseline = 50
    const candidate = baseline

    const result = snapToTextLine({
      candidateYPercent: candidate,
      fieldHeightPercent: fieldHeight,
      textLines: [makeLine(baseline)],
      valueCenterRatio: 0.0,
    })

    expect(result.snappedLineBaselinePercent).toBe(baseline)
    expect(result.yPercent).toBeCloseTo(baseline, 5)
  })
})
