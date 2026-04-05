import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import { buildPageDimension } from './field-factory'

export const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5l6x0AAAAASUVORK5CYII='
export const SIGNATURE_DATA_URL = `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`

function decodePdfLiteralString(value: string): string {
  return value
    .replace(/\\([\\()])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
}

function decodeHexString(value: string): string {
  const normalizedValue = value.length % 2 === 0 ? value : `${value}0`
  const bytes = new Uint8Array(normalizedValue.length / 2)
  for (let index = 0; index < normalizedValue.length; index += 2)
    bytes[index / 2] = Number.parseInt(normalizedValue.slice(index, index + 2), 16)
  return new TextDecoder('latin1').decode(bytes)
}

function getContentStreamBytes(stream: unknown): Uint8Array {
  if (!stream) return new Uint8Array()
  if (stream instanceof PDFRawStream) return decodePDFRawStream(stream).decode()
  if (typeof stream === 'object' && stream !== null) {
    if ('getUnencodedContents' in stream && typeof stream.getUnencodedContents === 'function')
      return stream.getUnencodedContents() as Uint8Array
    if ('getContents' in stream && typeof stream.getContents === 'function')
      return stream.getContents() as Uint8Array
  }
  return new Uint8Array()
}

function extractPageContentTextOperators(pageContent: string): string[] {
  const fragments: string[] = []

  for (const match of pageContent.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g))
    fragments.push(decodePdfLiteralString(match[1]))

  for (const match of pageContent.matchAll(/<([0-9a-fA-F]+)>\s*Tj/g))
    fragments.push(decodeHexString(match[1]))

  for (const match of pageContent.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    const tokenGroup = match[1]
    for (const stringToken of tokenGroup.matchAll(/\(((?:\\.|[^\\)])*)\)|<([0-9a-fA-F]+)>/g)) {
      const literalString = stringToken[1]
      const hexString = stringToken[2]
      if (literalString !== undefined) fragments.push(decodePdfLiteralString(literalString))
      if (hexString !== undefined) fragments.push(decodeHexString(hexString))
    }
  }

  return fragments
}

export async function getPageXObjectCount(pdfBytes: Uint8Array, pageIndex = 0): Promise<number> {
  const parsed = await PDFDocument.load(pdfBytes)
  const page = parsed.getPages()[pageIndex]
  if (!page) return 0
  const resources = page.node.lookup(PDFName.of('Resources'), PDFDict)
  if (!resources) return 0
  const xObject = resources.get(PDFName.of('XObject'))
  if (!(xObject instanceof PDFDict)) return 0
  return xObject.keys().length
}

export async function extractPageText(pdfBytes: Uint8Array, pageIndex = 0): Promise<string> {
  const parsed = await PDFDocument.load(pdfBytes)
  const page = parsed.getPages()[pageIndex]
  if (!page) return ''
  const contents = page.node.lookup(PDFName.of('Contents'))
  if (!contents) return ''

  const contentBytes =
    contents instanceof PDFArray
      ? contents
          .asArray()
          .map((entry) => parsed.context.lookup(entry))
          .map(getContentStreamBytes)
          .reduce((combined, chunk) => {
            const next = new Uint8Array(combined.length + chunk.length)
            next.set(combined)
            next.set(chunk, combined.length)
            return next
          }, new Uint8Array())
      : getContentStreamBytes(contents)

  const pageContent = new TextDecoder('latin1').decode(contentBytes)
  return extractPageContentTextOperators(pageContent).join(' ')
}

export async function extractPageContentStream(pdfBytes: Uint8Array, pageIndex = 0): Promise<string> {
  const parsed = await PDFDocument.load(pdfBytes)
  const page = parsed.getPages()[pageIndex]
  if (!page) return ''
  const contents = page.node.lookup(PDFName.of('Contents'))
  if (!contents) return ''

  const contentBytes =
    contents instanceof PDFArray
      ? contents
          .asArray()
          .map((entry) => parsed.context.lookup(entry))
          .map(getContentStreamBytes)
          .reduce((combined, chunk) => {
            const next = new Uint8Array(combined.length + chunk.length)
            next.set(combined)
            next.set(chunk, combined.length)
            return next
          }, new Uint8Array())
      : getContentStreamBytes(contents)

  return new TextDecoder('latin1').decode(contentBytes)
}

export function extractPageRects(contentStream: string): Array<{ x: number; y: number; w: number; h: number }> {
  const rects: Array<{ x: number; y: number; w: number; h: number }> = []
  for (const match of contentStream.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+re/g)) {
    rects.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      w: parseFloat(match[3]),
      h: parseFloat(match[4]),
    })
  }
  return rects
}

export async function createSourcePdf(pageCount = 1): Promise<Uint8Array> {
  const sourceDocument = await PDFDocument.create()
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) sourceDocument.addPage([600, 800])
  return sourceDocument.save()
}

export async function buildPageDimensionsFromPdf(pdfBytes: Uint8Array) {
  const parsed = await PDFDocument.load(pdfBytes)
  return parsed.getPages().map((page, pageIndex) =>
    buildPageDimension({
      pageIndex,
      widthPt: page.getSize().width,
      heightPt: page.getSize().height,
    })
  )
}
