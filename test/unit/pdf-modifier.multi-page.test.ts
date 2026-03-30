import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { modifyPdf } from '../../src/lib/pdf-modifier'
import { createSyntheticContractPdf } from '../fixtures/synthetic-contract'
import { buildField, buildPageDimension, buildSigner } from '../helpers/field-factory'
import {
  buildPageDimensionsFromPdf,
  createSourcePdf,
  extractPageText,
  getPageXObjectCount,
  SIGNATURE_DATA_URL,
} from '../helpers/pdf-helpers'

describe('modifyPdf multi-page', () => {
  it('embeds signature fields on both pages of a 2-page pdf', async () => {
    const sourceBytes = await createSourcePdf(2)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [
        buildField({ id: 'sig-0', pageIndex: 0, type: 'signature' }),
        buildField({ id: 'sig-1', pageIndex: 1, type: 'signature' }),
      ],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension({ pageIndex: 0 }), buildPageDimension({ pageIndex: 1 })],
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(await getPageXObjectCount(outputBytes, 1)).toBeGreaterThan(0)
  })

  it('supports one signature field per page on a 3-page pdf', async () => {
    const sourceBytes = await createSourcePdf(3)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [
        buildField({ id: 'sig-0', pageIndex: 0, type: 'signature' }),
        buildField({ id: 'sig-1', pageIndex: 1, type: 'signature' }),
        buildField({ id: 'sig-2', pageIndex: 2, type: 'signature' }),
      ],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [
        buildPageDimension({ pageIndex: 0 }),
        buildPageDimension({ pageIndex: 1 }),
        buildPageDimension({ pageIndex: 2 }),
      ],
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(await getPageXObjectCount(outputBytes, 1)).toBeGreaterThan(0)
    expect(await getPageXObjectCount(outputBytes, 2)).toBeGreaterThan(0)
  })

  it('leaves untouched pages without signature fields', async () => {
    const sourceBytes = await createSourcePdf(2)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [buildField({ id: 'sig-1', pageIndex: 1, type: 'signature' })],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [buildPageDimension({ pageIndex: 0 }), buildPageDimension({ pageIndex: 1 })],
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBe(0)
    expect(await getPageXObjectCount(outputBytes, 1)).toBeGreaterThan(0)
  })

  it('supports mixed field types across pages', async () => {
    const sourceBytes = await createSourcePdf(3)
    const outputBytes = await modifyPdf({
      pdfBytes: sourceBytes,
      fields: [
        buildField({ id: 'sig-0', pageIndex: 0, type: 'signature' }),
        buildField({ id: 'name-1', pageIndex: 1, type: 'fullName' }),
        buildField({ id: 'title-1', pageIndex: 1, type: 'title', yPercent: 25 }),
        buildField({ id: 'date-2', pageIndex: 2, type: 'date' }),
      ],
      signer: buildSigner({ firstName: 'Jane', lastName: 'Doe', title: 'CFO' }),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [
        buildPageDimension({ pageIndex: 0 }),
        buildPageDimension({ pageIndex: 1 }),
        buildPageDimension({ pageIndex: 2 }),
      ],
      dateText: '2026-03-30',
    })

    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(await extractPageText(outputBytes, 1)).toContain('Jane Doe')
    expect(await extractPageText(outputBytes, 1)).toContain('CFO')
    expect(await extractPageText(outputBytes, 2)).toContain('2026-03-30')
  })
})

describe('modifyPdf synthetic-contract fixture', () => {
  it('embeds signature image for the synthetic contract fixture', async () => {
    const { pdfBytes: fixtureBytes } = await createSyntheticContractPdf()
    const fixtureDocument = await PDFDocument.load(fixtureBytes)
    const firstPageSize = fixtureDocument.getPages()[0].getSize()

    const outputBytes = await modifyPdf({
      pdfBytes: fixtureBytes,
      fields: [
        buildField({
          id: 'signature-contract',
          type: 'signature',
          pageIndex: 0,
          xPercent: 12,
          yPercent: 20,
          widthPercent: 22,
          heightPercent: 6,
        }),
      ],
      signer: buildSigner(),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions: [
        buildPageDimension({
          pageIndex: 0,
          widthPt: firstPageSize.width,
          heightPt: firstPageSize.height,
        }),
      ],
    })

    const outputDocument = await PDFDocument.load(outputBytes)
    expect(outputDocument.getPageCount()).toBe(fixtureDocument.getPageCount())
    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
  })

  it('supports placing fields across multiple pages in synthetic contract', async () => {
    const { pdfBytes: fixtureBytes } = await createSyntheticContractPdf({ pageCount: 3 })
    const pageDimensions = await buildPageDimensionsFromPdf(fixtureBytes)

    const outputBytes = await modifyPdf({
      pdfBytes: fixtureBytes,
      fields: [
        buildField({ id: 'sig-0', pageIndex: 0, type: 'signature' }),
        buildField({ id: 'name-1', pageIndex: 1, type: 'fullName' }),
        buildField({ id: 'sig-2', pageIndex: 2, type: 'signature' }),
      ],
      signer: buildSigner({ firstName: 'Jane', lastName: 'Doe' }),
      signatureDataUrl: SIGNATURE_DATA_URL,
      pageDimensions,
    })

    const parsedOutput = await PDFDocument.load(outputBytes)
    expect(parsedOutput.getPageCount()).toBe(3)
    expect(await getPageXObjectCount(outputBytes, 0)).toBeGreaterThan(0)
    expect(await getPageXObjectCount(outputBytes, 2)).toBeGreaterThan(0)
    expect(await extractPageText(outputBytes, 1)).toContain('Jane Doe')
  })
})
