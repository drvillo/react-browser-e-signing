import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { pdfjs } from 'react-pdf'
import { PdfViewer } from '../../src/components/pdf-viewer'
import { configure, resetConfig } from '../../src/lib/config'

const noop = () => undefined

/** Minimal bytes so react-pdf may error gracefully but the component mounts */
const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer

describe('PdfViewer worker', () => {
  beforeEach(() => {
    resetConfig()
    pdfjs.GlobalWorkerOptions.workerSrc = ''
  })

  it('does not set unpkg CDN worker by default', async () => {
    render(
      <PdfViewer
        pdfData={dummyPdf}
        numPages={1}
        scale={1}
        onScaleChange={noop}
        onDocumentLoadSuccess={noop}
        onPageDimensions={noop}
      />
    )

    await waitFor(() => {
      expect(pdfjs.GlobalWorkerOptions.workerSrc).not.toContain('unpkg.com')
    })
  })

  it('applies workerSrc prop', async () => {
    render(
      <PdfViewer
        workerSrc="/pdf.worker.min.mjs"
        pdfData={dummyPdf}
        numPages={1}
        scale={1}
        onScaleChange={noop}
        onDocumentLoadSuccess={noop}
        onPageDimensions={noop}
      />
    )

    await waitFor(() => {
      expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.min.mjs')
    })
  })

  it('applies configure pdfWorkerSrc when prop is unset', async () => {
    configure({ pdfWorkerSrc: '/from-config.mjs' })

    render(
      <PdfViewer
        pdfData={dummyPdf}
        numPages={1}
        scale={1}
        onScaleChange={noop}
        onDocumentLoadSuccess={noop}
        onPageDimensions={noop}
      />
    )

    await waitFor(() => {
      expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/from-config.mjs')
    })
  })

  it('workerSrc prop overrides configure pdfWorkerSrc', async () => {
    configure({ pdfWorkerSrc: '/from-config.mjs' })

    render(
      <PdfViewer
        workerSrc="/override.mjs"
        pdfData={dummyPdf}
        numPages={1}
        scale={1}
        onScaleChange={noop}
        onDocumentLoadSuccess={noop}
        onPageDimensions={noop}
      />
    )

    await waitFor(() => {
      expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/override.mjs')
    })
  })
})
