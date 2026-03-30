import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const SYNTHETIC_CONTRACT_FILE_NAME = 'synthetic-contract-fixture.pdf'

interface CreateSyntheticContractPdfParams {
  fileName?: string
  pageCount?: number
}

interface SyntheticContractPdfResult {
  fileName: string
  pdfBytes: Uint8Array
}

export async function createSyntheticContractPdf(
  params: CreateSyntheticContractPdfParams = {},
): Promise<SyntheticContractPdfResult> {
  const pageCount = Math.max(2, params.pageCount ?? 2)
  const pdf = await PDFDocument.create()
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  const firstPage = pdf.addPage([612, 792])
  drawContractPage({
    page: firstPage,
    regularFont,
    boldFont,
    title: 'MASTER SERVICES AGREEMENT',
    subtitle: 'Synthetic Contract Fixture for Browser E-Signature Tests',
  })

  for (let pageIndex = 1; pageIndex < pageCount - 1; pageIndex += 1) {
    const middlePage = pdf.addPage([612, 792])
    drawIntermediatePage({
      page: middlePage,
      regularFont,
      pageNumber: pageIndex + 1,
    })
  }

  const signaturePage = pdf.addPage([612, 792])
  drawSignaturePage({
    page: signaturePage,
    regularFont,
    boldFont,
  })

  return {
    fileName: params.fileName ?? SYNTHETIC_CONTRACT_FILE_NAME,
    pdfBytes: await pdf.save(),
  }
}

interface DrawContractPageParams {
  page: ReturnType<PDFDocument['addPage']>
  regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>
  title: string
  subtitle: string
}

function drawContractPage({
  page,
  regularFont,
  boldFont,
  title,
  subtitle,
}: DrawContractPageParams): void {
  const margin = 56
  const lineHeight = 20
  let cursorY = page.getHeight() - margin

  page.drawText(title, {
    x: margin,
    y: cursorY,
    font: boldFont,
    size: 18,
    color: rgb(0.12, 0.12, 0.12),
  })

  cursorY -= 28
  page.drawText(subtitle, {
    x: margin,
    y: cursorY,
    font: regularFont,
    size: 10,
    color: rgb(0.32, 0.32, 0.32),
  })

  cursorY -= 34

  const clauses = [
    '1. Parties: Acme Treasury LLC ("Client") and Northwind OTC Services Inc. ("Provider").',
    '2. Services: Provider will deliver OTC execution support and post-trade reconciliation.',
    '3. Fees: Client agrees to the fee schedule in Appendix A, due net 30 from invoice date.',
    '4. Confidentiality: Both parties must protect non-public financial and commercial data.',
    '5. Term: The agreement starts on Jan 1, 2026 and renews annually unless terminated.',
    '6. Governing Law: This agreement is governed by the laws of New York, United States.',
  ]

  for (const clause of clauses) {
    page.drawText(clause, {
      x: margin,
      y: cursorY,
      font: regularFont,
      size: 11,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: page.getWidth() - margin * 2,
      lineHeight: 14,
    })
    cursorY -= lineHeight * 1.3
  }

  cursorY -= 12
  page.drawText('Execution Copy - Generated for Automated Test Harness', {
    x: margin,
    y: cursorY,
    font: boldFont,
    size: 11,
    color: rgb(0.2, 0.2, 0.2),
  })
}

interface DrawSignaturePageParams {
  page: ReturnType<PDFDocument['addPage']>
  regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>
}

function drawSignaturePage({
  page,
  regularFont,
  boldFont,
}: DrawSignaturePageParams): void {
  const margin = 56
  const top = page.getHeight() - 96

  page.drawText('SIGNATURE PAGE', {
    x: margin,
    y: top,
    font: boldFont,
    size: 16,
    color: rgb(0.12, 0.12, 0.12),
  })

  page.drawText('Provider Signature:', {
    x: margin,
    y: top - 64,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page.drawRectangle({
    x: margin,
    y: top - 98,
    width: 260,
    height: 28,
    borderWidth: 1,
    borderColor: rgb(0.55, 0.55, 0.55),
  })

  page.drawText('Name: _________________________', {
    x: margin,
    y: top - 136,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page.drawText('Title: __________________________', {
    x: margin,
    y: top - 164,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })

  page.drawText('Date: __________________________', {
    x: margin,
    y: top - 192,
    font: regularFont,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
  })
}

interface DrawIntermediatePageParams {
  page: ReturnType<PDFDocument['addPage']>
  regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>
  pageNumber: number
}

function drawIntermediatePage({ page, regularFont, pageNumber }: DrawIntermediatePageParams): void {
  page.drawText(`INTERMEDIATE PAGE ${pageNumber}`, {
    x: 56,
    y: page.getHeight() - 96,
    font: regularFont,
    size: 12,
    color: rgb(0.25, 0.25, 0.25),
  })
}
