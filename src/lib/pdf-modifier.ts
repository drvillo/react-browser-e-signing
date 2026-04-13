import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { mapToPoints } from './coordinate-mapper'
import type { FieldPlacement, PdfPageDimensions, SignerInfo } from '../types'

export interface ModifyPdfInput {
  pdfBytes: Uint8Array
  fields: FieldPlacement[]
  signer?: SignerInfo
  signatureDataUrl?: string
  pageDimensions: PdfPageDimensions[]
  dateText?: string
}

function fullNameFromSigner(signer: SignerInfo): string {
  return [signer.firstName, signer.lastName].filter(Boolean).join(' ').trim()
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid signature data URL')
  const binary =
    typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function modifyPdf({
  pdfBytes,
  fields,
  signer,
  signatureDataUrl,
  pageDimensions,
  dateText,
}: ModifyPdfInput): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(pdfBytes)
  pdfDocument.registerFontkit(fontkit)
  const pages = pdfDocument.getPages()
  const helveticaFont = await pdfDocument.embedFont(StandardFonts.Helvetica)

  const globalSignatureBytes = signatureDataUrl ? dataUrlToBytes(signatureDataUrl) : null
  const globalSignatureImage = globalSignatureBytes ? await pdfDocument.embedPng(globalSignatureBytes) : null
  const resolvedDateText = dateText || new Date().toLocaleDateString()

  for (const field of fields) {
    const page = pages[field.pageIndex]
    const pageDimension = pageDimensions.find((entry) => entry.pageIndex === field.pageIndex)
    if (!page || !pageDimension) continue

    const pointRect = mapToPoints(field, pageDimension)

    if (field.value) {
      if (field.type === 'signature') {
        const imageBytes = dataUrlToBytes(field.value)
        const image = await pdfDocument.embedPng(imageBytes)
        page.drawImage(image, {
          x: pointRect.x,
          y: pointRect.y,
          width: pointRect.width,
          height: pointRect.height,
        })
        continue
      }

      const pad = 2
      page.drawRectangle({
        x: pointRect.x - pad,
        y: pointRect.y - pad,
        width: pointRect.width + pad * 2,
        height: pointRect.height + pad * 2,
        color: rgb(1, 1, 1),
      })
      const textSize = Math.max(9, Math.min(16, pointRect.height * 0.6))
      page.drawText(field.value, {
        x: pointRect.x + 2,
        y: pointRect.y + Math.max(0, (pointRect.height - textSize) / 2),
        size: textSize,
        font: helveticaFont,
      })
      continue
    }

    if (field.type === 'signature' && globalSignatureImage) {
      page.drawImage(globalSignatureImage, {
        x: pointRect.x,
        y: pointRect.y,
        width: pointRect.width,
        height: pointRect.height,
      })
      continue
    }

    if (field.type === 'text') continue

    if (!signer) continue

    const textValue =
      field.type === 'fullName'
        ? fullNameFromSigner(signer)
        : field.type === 'title'
          ? signer.title
          : field.type === 'date'
            ? resolvedDateText
            : ''
    if (!textValue) continue

    const textSize = Math.max(9, Math.min(16, pointRect.height * 0.6))
    page.drawText(textValue, {
      x: pointRect.x + 2,
      y: pointRect.y + Math.max(0, (pointRect.height - textSize) / 2),
      size: textSize,
      font: helveticaFont,
    })
  }

  return pdfDocument.save()
}
