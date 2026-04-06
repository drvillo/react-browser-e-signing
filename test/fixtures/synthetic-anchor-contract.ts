import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const SYNTHETIC_ANCHOR_FILE_NAME = 'synthetic-anchor-contract-fixture.pdf'

interface AnchorTagPlacement {
  text: string
  x: number
  y: number
  fontSize: number
  pageIndex: number
}

export const KNOWN_ANCHOR_TAGS: AnchorTagPlacement[] = [
  { text: '{{ companyName }}', x: 56, y: 600, fontSize: 11, pageIndex: 0 },
  { text: '{{ role }}', x: 56, y: 560, fontSize: 11, pageIndex: 0 },
  { text: '{{ agreementDate }}', x: 56, y: 600, fontSize: 11, pageIndex: 1 },
]

interface CreateSyntheticAnchorContractPdfParams {
  fileName?: string
  includeEdgeCases?: boolean
}

interface SyntheticAnchorContractPdfResult {
  fileName: string
  pdfBytes: Uint8Array
}

export async function createSyntheticAnchorContractPdf(
  params: CreateSyntheticAnchorContractPdfParams = {},
): Promise<SyntheticAnchorContractPdfResult> {
  const pdf = await PDFDocument.create()
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Page 0: Two anchor tags + content
  const page0 = pdf.addPage([612, 792])
  const margin = 56

  page0.drawText('ANCHOR TAG CONTRACT', {
    x: margin,
    y: 740,
    font: boldFont,
    size: 18,
    color: rgb(0.12, 0.12, 0.12),
  })

  page0.drawText('This agreement is entered into by:', {
    x: margin,
    y: 700,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page0.drawText('Company: {{ companyName }}', {
    x: margin,
    y: 600,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page0.drawText('Role: {{ role }}', {
    x: margin,
    y: 560,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page0.drawText('Terms and conditions apply as described below.', {
    x: margin,
    y: 500,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  // Page 1 (signature page): One anchor tag + signature area
  const page1 = pdf.addPage([612, 792])

  page1.drawText('SIGNATURE PAGE', {
    x: margin,
    y: 740,
    font: boldFont,
    size: 16,
    color: rgb(0.12, 0.12, 0.12),
  })

  page1.drawText('Date: {{ agreementDate }}', {
    x: margin,
    y: 600,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page1.drawText('Signature: _________________________', {
    x: margin,
    y: 500,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  // Page 2: No anchor tags (tests selective scanning)
  const page2 = pdf.addPage([612, 792])

  page2.drawText('APPENDIX A', {
    x: margin,
    y: 740,
    font: boldFont,
    size: 14,
    color: rgb(0.2, 0.2, 0.2),
  })

  page2.drawText('This page contains no anchor tags.', {
    x: margin,
    y: 700,
    font: regularFont,
    size: 11,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Edge cases on page 0 (optional)
  if (params.includeEdgeCases) {
    page0.drawText('{{ }}', {
      x: margin,
      y: 440,
      font: regularFont,
      size: 11,
      color: rgb(0.1, 0.1, 0.1),
    })

    page0.drawText('{{   spacedName   }}', {
      x: margin,
      y: 400,
      font: regularFont,
      size: 11,
      color: rgb(0.1, 0.1, 0.1),
    })

    page0.drawText('Just a { single brace } here', {
      x: margin,
      y: 360,
      font: regularFont,
      size: 11,
      color: rgb(0.1, 0.1, 0.1),
    })
  }

  return {
    fileName: params.fileName ?? SYNTHETIC_ANCHOR_FILE_NAME,
    pdfBytes: await pdf.save(),
  }
}
