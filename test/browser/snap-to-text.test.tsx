import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { page } from 'vitest/browser'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../demo/App'
import { createSyntheticContractPdf } from '../fixtures/synthetic-contract'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function uploadContractPdf(): Promise<void> {
  const { fileName, pdfBytes } = await createSyntheticContractPdf()
  const normalizedPdfBytes = Uint8Array.from(pdfBytes)
  const file = new File([normalizedPdfBytes], fileName, { type: 'application/pdf' })
  await page.getByLabelText('Upload PDF').first().upload(file)
}

async function waitForOverlay(): Promise<HTMLElement> {
  await waitFor(
    () => {
      const overlay = document.querySelector('[aria-label="Field overlay page 1"]')
      expect(overlay).not.toBeNull()
    },
    { timeout: 5000 }
  )
  // Allow PDF.js text extraction to complete after render
  await new Promise((resolve) => setTimeout(resolve, 1800))
  return document.querySelector('[aria-label="Field overlay page 1"]') as HTMLElement
}

/**
 * Simulate a drag on a DOM element using synthetic PointerEvents.
 * Mocks setPointerCapture/releasePointerCapture to avoid "No active pointer" errors.
 */
function simulateDrag(
  el: HTMLElement,
  startClientX: number,
  startClientY: number,
  endClientX: number,
  endClientY: number,
  pointerId = 99
): void {
  el.setPointerCapture = () => undefined
  el.releasePointerCapture = () => undefined

  el.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: startClientX, clientY: startClientY, pointerId })
  )
  el.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, clientX: endClientX, clientY: endClientY, pointerId })
  )
}

function simulateDragEnd(el: HTMLElement, pointerId = 99): void {
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId }))
}

describe('snap-to-text alignment', () => {
  it('shows snap-guide while dragging near a text line and hides it on pointer-up', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:signed-pdf')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    render(<App />)

    await uploadContractPdf()
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Place a fullName field via palette + overlay click
    await page.getByRole('button', { name: 'Full Name' }).click()
    const overlay = await waitForOverlay()
    const overlayRect = overlay.getBoundingClientRect()

    // Guard: overlay must have non-trivial height for coordinate math to be valid
    expect(overlayRect.height).toBeGreaterThan(200)

    // Place field at 50% down the page
    overlay.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: overlayRect.left + overlayRect.width * 0.25,
        clientY: overlayRect.top + overlayRect.height * 0.5,
      })
    )

    await waitFor(
      () => expect(document.querySelector('[data-slot="signature-field"]')).not.toBeNull(),
      { timeout: 2000 }
    )
    await new Promise((resolve) => setTimeout(resolve, 100))

    const fieldEl = document.querySelector('[data-slot="signature-field"]') as HTMLElement
    const fieldRect = fieldEl.getBoundingClientRect()

    // The field's drag handler:
    //   deltaYPercent = (moveClientY - downClientY) / overlay.clientHeight * 100
    //   newYPercent = startYPercent + deltaYPercent
    //
    // Field was placed at startYPercent ≈ 50%, height = 7%.
    // Snap fires when field CENTER (fieldTop + 3.5%) is within 1.5% of a text baseline.
    //
    // "1. Parties:" clause baseline ≈ (792-674)/792*100 ≈ 14.9% from top.
    // fieldTop for snap = baseline - height/2 = 14.9 - 3.5 = 11.4%.
    // deltaYPercent = 11.4 - 50 = -38.6%
    // downClientY = field center = fieldRect.top + fieldRect.height/2
    // moveClientY = downClientY - 0.386 * overlayHeight
    const downClientY = fieldRect.top + fieldRect.height / 2
    const moveClientY = downClientY - overlayRect.height * 0.386

    simulateDrag(
      fieldEl,
      fieldRect.left + fieldRect.width / 2,
      downClientY,
      fieldRect.left + fieldRect.width / 2,
      moveClientY
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    const snapGuide = document.querySelector('[data-slot="snap-guide"]')
    expect(snapGuide).not.toBeNull()
    // Guide sits at the text line baseline. "1. Parties:" ≈ 14.9%, but accept a
    // generous range since rendering variance affects exact line positions.
    const guideTopPercent = parseFloat((snapGuide as HTMLElement).style.top)
    expect(guideTopPercent).toBeGreaterThan(5)
    expect(guideTopPercent).toBeLessThan(30)

    // Release — guide must disappear
    simulateDragEnd(fieldEl)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(document.querySelector('[data-slot="snap-guide"]')).toBeNull()
  })

  it('field top style reflects snapped position when snap activates', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:signed-pdf')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    render(<App />)

    await uploadContractPdf()
    await new Promise((resolve) => setTimeout(resolve, 800))

    await page.getByRole('button', { name: 'Full Name' }).click()
    const overlay = await waitForOverlay()
    const overlayRect = overlay.getBoundingClientRect()

    expect(overlayRect.height).toBeGreaterThan(200)

    // Place field in the lower portion of the page
    overlay.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: overlayRect.left + overlayRect.width * 0.25,
        clientY: overlayRect.top + overlayRect.height * 0.8,
      })
    )

    await waitFor(
      () => expect(document.querySelector('[data-slot="signature-field"]')).not.toBeNull(),
      { timeout: 2000 }
    )
    await new Promise((resolve) => setTimeout(resolve, 100))

    const fieldEl = document.querySelector('[data-slot="signature-field"]') as HTMLElement
    const fieldRect = fieldEl.getBoundingClientRect()

    // Clause "1. Parties:" baseline ≈ 14.9% from top.
    // Snap: field CENTER (fieldTop + 3.5%) = 14.9% → fieldTop ≈ 11.4%.
    // startYPercent ≈ 80%
    // deltaYPercent = 11.4 - 80 = -68.6%
    const downClientY = fieldRect.top + fieldRect.height / 2
    const moveClientY = downClientY - overlayRect.height * 0.686

    simulateDrag(
      fieldEl,
      fieldRect.left + fieldRect.width / 2,
      downClientY,
      fieldRect.left + fieldRect.width / 2,
      moveClientY
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Field should have moved significantly upward from its 80% starting position
    const snappedTop = parseFloat(fieldEl.style.top)
    expect(snappedTop).toBeLessThan(80)
    // And it should be near where clauses start (within a generous window)
    expect(snappedTop).toBeGreaterThan(5)
    expect(snappedTop).toBeLessThan(25)

    simulateDragEnd(fieldEl)
  })
})
