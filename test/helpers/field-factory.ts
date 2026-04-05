import type { FieldPlacement, PdfPageDimensions, SignerInfo } from '../../src/types'

export function buildField(overrides: Partial<FieldPlacement> = {}): FieldPlacement {
  return {
    id: overrides.id ?? 'field-1',
    type: overrides.type ?? 'signature',
    pageIndex: overrides.pageIndex ?? 0,
    xPercent: overrides.xPercent ?? 10,
    yPercent: overrides.yPercent ?? 10,
    widthPercent: overrides.widthPercent ?? 25,
    heightPercent: overrides.heightPercent ?? 6,
    ...(overrides.locked !== undefined && { locked: overrides.locked }),
    ...(overrides.label !== undefined && { label: overrides.label }),
  }
}

export function buildSigner(overrides: Partial<SignerInfo> = {}): SignerInfo {
  return {
    firstName: overrides.firstName ?? 'Jane',
    lastName: overrides.lastName ?? 'Doe',
    title: overrides.title ?? 'CEO',
    ...(overrides.customFields !== undefined && { customFields: overrides.customFields }),
  }
}

export function buildPageDimension(overrides: Partial<PdfPageDimensions> = {}): PdfPageDimensions {
  return {
    pageIndex: overrides.pageIndex ?? 0,
    widthPt: overrides.widthPt ?? 600,
    heightPt: overrides.heightPt ?? 800,
  }
}
