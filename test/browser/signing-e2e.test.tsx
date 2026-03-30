import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { page } from 'vitest/browser'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../demo/App'
import { createSyntheticContractPdf } from '../fixtures/synthetic-contract'
import { getPageXObjectCount } from '../helpers/pdf-helpers'

async function uploadContractPdf(): Promise<void> {
  const { fileName, pdfBytes } = await createSyntheticContractPdf()
  const normalizedPdfBytes = Uint8Array.from(pdfBytes)
  const file = new File([normalizedPdfBytes], fileName, { type: 'application/pdf' })
  await page.getByLabelText('Upload PDF').upload(file)
}

describe('browser signing flow', () => {
  it('generates and embeds signature image end to end', async () => {
    let signedBlob: Blob | null = null

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((source: Blob | MediaSource) => {
      if (!(source instanceof Blob)) return 'blob:signed-pdf'

      signedBlob = source
      return 'blob:signed-pdf'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    render(<App />)

    await uploadContractPdf()
    await new Promise((resolve) => setTimeout(resolve, 500))

    await page.getByLabelText('First Name').fill('Jane')
    await page.getByLabelText('Last Name').fill('Doe')

    await expect
      .element(page.getByAltText('Signature preview'))
      .toBeInTheDocument()

    await page.getByRole('button', { name: 'Signature' }).click()
    await waitFor(() => {
      const overlay = document.querySelector('[aria-label="Field overlay page 1"]')
      expect(overlay).not.toBeNull()
    })
    const overlay = document.querySelector('[aria-label="Field overlay page 1"]') as HTMLElement
    overlay.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 24,
        clientY: 24,
      })
    )
    await page.getByRole('button', { name: 'Sign Document' }).click()

    await expect
      .element(page.getByRole('heading', { name: 'Document Signed' }))
      .toBeInTheDocument()

    expect(signedBlob).not.toBeNull()
    const signedBytes = new Uint8Array(await signedBlob!.arrayBuffer())
    expect(await getPageXObjectCount(signedBytes, 0)).toBeGreaterThan(0)
  })
})
