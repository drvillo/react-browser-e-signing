export type FieldType = 'signature' | 'fullName' | 'title' | 'date'

export interface FieldPlacement {
  id: string
  type: FieldType
  pageIndex: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  locked?: boolean
}

export interface SignerInfo {
  firstName: string
  lastName: string
  title: string
}

export interface SignatureStyleTyped {
  mode: 'typed'
  fontFamily: string
}

export interface SignatureStyleDrawn {
  mode: 'drawn'
  dataUrl: string
}

export type SignatureStyle = SignatureStyleTyped | SignatureStyleDrawn

export interface SigningResult {
  pdfBytes: Uint8Array
  sha256: string
}

export interface PdfPageDimensions {
  pageIndex: number
  widthPt: number
  heightPt: number
}

export interface PointRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SignatureFieldPreview {
  signatureDataUrl: string | null
  fullName: string
  title: string
  dateText: string
}
