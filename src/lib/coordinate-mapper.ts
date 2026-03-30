import type { FieldPlacement, PdfPageDimensions, PointRect } from '../types'

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export function mapToPoints(field: FieldPlacement, page: PdfPageDimensions): PointRect {
  const xPercent = clampPercent(field.xPercent)
  const yPercent = clampPercent(field.yPercent)
  const widthPercent = clampPercent(field.widthPercent)
  const heightPercent = clampPercent(field.heightPercent)

  const width = (widthPercent / 100) * page.widthPt
  const height = (heightPercent / 100) * page.heightPt
  const x = (xPercent / 100) * page.widthPt
  const y = page.heightPt - (yPercent / 100) * page.heightPt - height

  return { x, y, width, height }
}

export function mapFromPoints(
  rect: PointRect,
  page: PdfPageDimensions
): Pick<FieldPlacement, 'xPercent' | 'yPercent' | 'widthPercent' | 'heightPercent'> {
  const widthPercent = (rect.width / page.widthPt) * 100
  const heightPercent = (rect.height / page.heightPt) * 100
  const xPercent = (rect.x / page.widthPt) * 100
  const yPercent = ((page.heightPt - rect.y - rect.height) / page.heightPt) * 100

  return {
    xPercent: clampPercent(xPercent),
    yPercent: clampPercent(yPercent),
    widthPercent: clampPercent(widthPercent),
    heightPercent: clampPercent(heightPercent),
  }
}
