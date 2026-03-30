import { describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { modifyPdf } from '../../src/lib/pdf-modifier'
import { buildField, buildPageDimension, buildSigner } from '../helpers/field-factory'
import {
  createSourcePdf,
  extractPageText,
  getPageXObjectCount,
  SIGNATURE_DATA_URL,
} from '../helpers/pdf-helpers'

describe('modifyPdf single-page', () => {
  it('embeds signature image into the output PDF bytes', async () => {
    const sourceBytes = await createSourcePdf()

    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ type: 'signature', widthPercent: 35 })],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension()],
    })

    const parsed = await PDFDocument.load(outputBytes)
    const page = parsed.getPages()[0]

    expect(parsed.getPageCount()).toBe(1)
    expect(outputBytes.length).toBeGreaterThan(sourceBytes.length)
    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(page.getSize().width).toBe(600)
    expect(page.getSize().height).toBe(800)
  })

  it('does not embed an image when signature data URL is missing', async () => {
    const sourceBytes = await createSourcePdf()

    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ type: 'signature' })],
      signer: buildSigner(),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBe(0)
  })

  it('draws full name text field', async () => {
    const sourceBytes = await createSourcePdf()
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'name-1', type: 'fullName' })],
      signer: buildSigner({ firstName: 'Jane', lastName: 'Doe' }),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })

    expect(await extractPageText(outputBytes, 0)).toContain('Jane Doe')
  })

  it('draws title text field', async () => {
    const sourceBytes = await createSourcePdf()
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'title-1', type: 'title' })],
      signer: buildSigner({ title: 'CTO' }),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })

    expect(await extractPageText(outputBytes, 0)).toContain('CTO')
  })

  it('draws date text with custom and default values', async () => {
    const sourceBytes = await createSourcePdf()
    const outputCustomDate = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'date-custom', type: 'date' })],
      signer: buildSigner(),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
      dateText: '2026-03-30',
    })
    expect(await extractPageText(outputCustomDate, 0)).toContain('2026-03-30')

    const dateSpy = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockReturnValue('03/30/2026')
    const outputDefaultDate = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'date-default', type: 'date' })],
      signer: buildSigner(),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })
    dateSpy.mockRestore()

    expect(await extractPageText(outputDefaultDate, 0)).toContain('03/30/2026')
  })

  it('supports all field types on one page', async () => {
    const sourceBytes = await createSourcePdf()
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [
        buildField({ id: 'sig-1', type: 'signature' }),
        buildField({ id: 'name-1', type: 'fullName', yPercent: 20 }),
        buildField({ id: 'title-1', type: 'title', yPercent: 30 }),
        buildField({ id: 'date-1', type: 'date', yPercent: 40 }),
      ],
      signer: buildSigner({ firstName: 'Jane', lastName: 'Doe', title: 'CEO' }),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension()],
      dateText: '2026-03-30',
    })

    const pageText = await extractPageText(outputBytes, 0)
    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(pageText).toContain('Jane Doe')
    expect(pageText).toContain('CEO')
    expect(pageText).toContain('2026-03-30')
  })
})

describe('modifyPdf edge-cases', () => {
  it('keeps pdf structurally unchanged when fields are empty', async () => {
    const sourceBytes = await createSourcePdf(1)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension()],
    })

    const sourcePdf = await PDFDocument.load(sourceBytes)
    const outputPdf = await PDFDocument.load(outputBytes)
    expect(outputPdf.getPageCount()).toBe(sourcePdf.getPageCount())
    expect(await getPageXObjectCount(outputBytes, 0)).toBe(0)
  })

  it('skips fields with out-of-bounds page indexes', async () => {
    const sourceBytes = await createSourcePdf(1)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'out-of-bounds', pageIndex: 99, type: 'signature' })],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension({ pageIndex: 0 })],
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBe(0)
  })

  it('draws only available name segments for full name fields', async () => {
    const sourceBytes = await createSourcePdf(1)

    const firstNameOnlyOutput = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'name-only-first', type: 'fullName' })],
      signer: buildSigner({ firstName: 'Jane', lastName: '' }),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })
    expect(await extractPageText(firstNameOnlyOutput, 0)).toContain('Jane')

    const lastNameOnlyOutput = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'name-only-last', type: 'fullName' })],
      signer: buildSigner({ firstName: '', lastName: 'Doe' }),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })
    expect(await extractPageText(lastNameOnlyOutput, 0)).toContain('Doe')
  })

  it('draws no text when both first and last names are empty', async () => {
    const sourceBytes = await createSourcePdf(1)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'name-empty', type: 'fullName' })],
      signer: buildSigner({ firstName: '', lastName: '' }),
      signatureDataUrl: '',
      pageDimensions: [buildPageDimension()],
    })

    expect(await extractPageText(outputBytes, 0)).toBe('')
  })
})
