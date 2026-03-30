import { describe, expect, it } from 'vitest'
import { mapFromPoints, mapToPoints } from '../../src/lib/coordinate-mapper'

describe('coordinate mapper', () => {
  const page = { pageIndex: 0, widthPt: 600, heightPt: 800 }

  it('maps percentages to points with y-axis inversion', () => {
    const field = {
      id: '1',
      type: 'signature' as const,
      pageIndex: 0,
      xPercent: 10,
      yPercent: 20,
      widthPercent: 30,
      heightPercent: 10,
    }

    const result = mapToPoints(field, page)
    expect(result.x).toBeCloseTo(60)
    expect(result.width).toBeCloseTo(180)
    expect(result.height).toBeCloseTo(80)
    expect(result.y).toBeCloseTo(560)
  })

  it('round-trips points back to percentages', () => {
    const field = {
      id: '1',
      type: 'signature' as const,
      pageIndex: 0,
      xPercent: 37,
      yPercent: 16,
      widthPercent: 22,
      heightPercent: 9,
    }

    const points = mapToPoints(field, page)
    const percentages = mapFromPoints(points, page)
    expect(percentages.xPercent).toBeCloseTo(field.xPercent)
    expect(percentages.yPercent).toBeCloseTo(field.yPercent)
    expect(percentages.widthPercent).toBeCloseTo(field.widthPercent)
    expect(percentages.heightPercent).toBeCloseTo(field.heightPercent)
  })

  it('clamps invalid percentages to supported bounds', () => {
    const field = {
      id: '2',
      type: 'signature' as const,
      pageIndex: 0,
      xPercent: Number.NaN,
      yPercent: -10,
      widthPercent: 140,
      heightPercent: Number.NaN,
    }

    const result = mapToPoints(field, page)
    expect(result.x).toBe(0)
    expect(result.y).toBe(800)
    expect(result.width).toBe(600)
    expect(result.height).toBe(0)
  })

  it('handles zero-sized pages without throwing', () => {
    const field = {
      id: '3',
      type: 'signature' as const,
      pageIndex: 0,
      xPercent: 50,
      yPercent: 50,
      widthPercent: 25,
      heightPercent: 10,
    }

    const zeroPage = { pageIndex: 0, widthPt: 0, heightPt: 0 }
    const result = mapToPoints(field, zeroPage)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
  })

  it('maps full-page field to page boundaries', () => {
    const fullPageField = {
      id: '4',
      type: 'signature' as const,
      pageIndex: 0,
      xPercent: 0,
      yPercent: 0,
      widthPercent: 100,
      heightPercent: 100,
    }

    const result = mapToPoints(fullPageField, page)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.width).toBe(600)
    expect(result.height).toBe(800)
  })
})
