import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FieldOverlay } from '../../src/components/field-overlay'
import type { SignatureFieldPreview } from '../../src/types'
import type { TextLine } from '../../src/lib/text-lines'
import { buildField } from '../helpers/field-factory'

const preview: SignatureFieldPreview = {
  signatureDataUrl: null,
  fullName: 'Jane Doe',
  title: '',
  dateText: '01/01/2026',
}

// Text line at 50% baseline on the page
const TEXT_LINE: TextLine = {
  baselinePercent: 50,
  yPercent: 48.5,
  heightPercent: 1.5,
}

// Overlay dimensions used in all tests
const OVERLAY_HEIGHT_PX = 800
const OVERLAY_WIDTH_PX = 600

function renderOverlay(
  textLines?: TextLine[],
  overrides?: { type?: 'fullName' | 'signature'; onUpdateField?: ReturnType<typeof vi.fn> }
) {
  const field = buildField({
    id: 'f1',
    type: overrides?.type ?? 'fullName',
    xPercent: 10,
    yPercent: 20,
    widthPercent: 25,
    heightPercent: 7,
  })

  const onUpdateField = overrides?.onUpdateField ?? vi.fn()

  return render(
    <div style={{ position: 'relative', width: OVERLAY_WIDTH_PX, height: OVERLAY_HEIGHT_PX }}>
      <FieldOverlay
        pageIndex={0}
        fields={[field]}
        selectedFieldType={null}
        onAddField={vi.fn()}
        onUpdateField={onUpdateField}
        onRemoveField={vi.fn()}
        preview={preview}
        textLines={textLines}
      />
    </div>
  )
}

/**
 * Drag math:
 *   rawYPercent = startYPercent + (deltaClientY / overlayHeight) * 100
 *
 * Snap fires when field CENTER is within 1.5% of text line baseline (50%).
 *   targetRawYPercent = baseline - height/2 = 50 - 3.5 = 46.5%
 *   deltaYPercent = 46.5 - 20 = 26.5%
 *   deltaClientY  = 26.5% * 800 = 212px
 *   targetClientY = startClientY + 212 = 160 + 212 = 372
 */
const START_CLIENT_Y = 160
const TARGET_CLIENT_Y = 372 // places field center exactly at the 50% text line

describe('FieldOverlay snap guide', () => {
  it('does not render snap-guide initially', () => {
    const { container } = renderOverlay([TEXT_LINE])
    expect(container.querySelector('[data-slot="snap-guide"]')).toBeNull()
  })

  it('does not render snap-guide when no textLines are provided', () => {
    const { container } = renderOverlay(undefined)
    const fieldEl = container.querySelector('[data-slot="signature-field"]') as HTMLElement
    fireEvent.pointerDown(fieldEl, { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(fieldEl, { clientX: 110, clientY: 115, pointerId: 1 })
    expect(container.querySelector('[data-slot="snap-guide"]')).toBeNull()
  })

  it('renders snap-guide during drag when field center is near a text line', () => {
    const { container } = renderOverlay([TEXT_LINE])

    const fieldEl = container.querySelector('[data-slot="signature-field"]') as HTMLElement
    const overlayEl = container.querySelector('[data-slot="field-overlay"]') as HTMLElement

    Object.defineProperty(overlayEl, 'clientWidth', { value: OVERLAY_WIDTH_PX, configurable: true })
    Object.defineProperty(overlayEl, 'clientHeight', { value: OVERLAY_HEIGHT_PX, configurable: true })

    fireEvent.pointerDown(fieldEl, { button: 0, clientX: 200, clientY: START_CLIENT_Y, pointerId: 1 })
    fireEvent.pointerMove(fieldEl, { clientX: 200, clientY: TARGET_CLIENT_Y, pointerId: 1 })

    const guide = container.querySelector('[data-slot="snap-guide"]')
    expect(guide).not.toBeNull()
    // Guide should be positioned at the text line baseline
    expect(guide!.getAttribute('style')).toContain('top: 50%')
  })

  it('removes snap-guide on pointer up', () => {
    const { container } = renderOverlay([TEXT_LINE])
    const fieldEl = container.querySelector('[data-slot="signature-field"]') as HTMLElement
    const overlayEl = container.querySelector('[data-slot="field-overlay"]') as HTMLElement

    Object.defineProperty(overlayEl, 'clientWidth', { value: OVERLAY_WIDTH_PX, configurable: true })
    Object.defineProperty(overlayEl, 'clientHeight', { value: OVERLAY_HEIGHT_PX, configurable: true })

    fireEvent.pointerDown(fieldEl, { button: 0, clientX: 200, clientY: START_CLIENT_Y, pointerId: 1 })
    fireEvent.pointerMove(fieldEl, { clientX: 200, clientY: TARGET_CLIENT_Y, pointerId: 1 })

    expect(container.querySelector('[data-slot="snap-guide"]')).not.toBeNull()

    fireEvent.pointerUp(fieldEl, { pointerId: 1 })

    expect(container.querySelector('[data-slot="snap-guide"]')).toBeNull()
  })

  it('signature field snaps using center (same as text fields)', () => {
    // Center-based: center = yPercent + 3.5 should land on baseline (50%)
    // target: yPercent = 50 - 3.5 = 46.5 → deltaY% = 46.5 - 20 = 26.5
    // deltaClientY = 26.5% * 800 = 212
    const sigTargetClientY = START_CLIENT_Y + 212

    const { container } = renderOverlay([TEXT_LINE], { type: 'signature' })
    const fieldEl = container.querySelector('[data-slot="signature-field"]') as HTMLElement
    const overlayEl = container.querySelector('[data-slot="field-overlay"]') as HTMLElement

    Object.defineProperty(overlayEl, 'clientWidth', { value: OVERLAY_WIDTH_PX, configurable: true })
    Object.defineProperty(overlayEl, 'clientHeight', { value: OVERLAY_HEIGHT_PX, configurable: true })

    fireEvent.pointerDown(fieldEl, { button: 0, clientX: 200, clientY: START_CLIENT_Y, pointerId: 1 })
    fireEvent.pointerMove(fieldEl, { clientX: 200, clientY: sigTargetClientY, pointerId: 1 })

    const guide = container.querySelector('[data-slot="snap-guide"]')
    expect(guide).not.toBeNull()
    expect(guide!.getAttribute('style')).toContain('top: 50%')
  })

  it('shows snap-guide during resize when field was previously snapped', () => {
    const onUpdateField = vi.fn()
    const { container } = renderOverlay([TEXT_LINE], { onUpdateField })

    const fieldEl = container.querySelector('[data-slot="signature-field"]') as HTMLElement
    const overlayEl = container.querySelector('[data-slot="field-overlay"]') as HTMLElement

    Object.defineProperty(overlayEl, 'clientWidth', { value: OVERLAY_WIDTH_PX, configurable: true })
    Object.defineProperty(overlayEl, 'clientHeight', { value: OVERLAY_HEIGHT_PX, configurable: true })

    // Drag to snap the field to the 50% text line
    fireEvent.pointerDown(fieldEl, { button: 0, clientX: 200, clientY: START_CLIENT_Y, pointerId: 1 })
    fireEvent.pointerMove(fieldEl, { clientX: 200, clientY: TARGET_CLIENT_Y, pointerId: 1 })
    expect(container.querySelector('[data-slot="snap-guide"]')).not.toBeNull()
    fireEvent.pointerUp(fieldEl, { pointerId: 1 })
    expect(container.querySelector('[data-slot="snap-guide"]')).toBeNull()

    // Now resize via the resize handle — snap guide should reappear
    const resizeHandle = container.querySelector('[data-slot="signature-field-resize"]') as HTMLElement
    fireEvent.pointerDown(resizeHandle, { button: 0, clientX: 300, clientY: 400, pointerId: 2 })
    fireEvent.pointerMove(resizeHandle, { clientX: 310, clientY: 420, pointerId: 2 })

    // onUpdateField should have been called with a yPercent adjustment
    const resizeCall = onUpdateField.mock.calls.find(
      (call: unknown[]) => (call[1] as Record<string, unknown>).heightPercent !== undefined
    )
    expect(resizeCall).toBeDefined()
    // The resize call should also include yPercent (re-snap adjustment)
    expect((resizeCall![1] as Record<string, unknown>).yPercent).toBeDefined()

    // Snap guide should be visible during resize
    expect(container.querySelector('[data-slot="snap-guide"]')).not.toBeNull()

    // Release resize — guide disappears
    fireEvent.pointerUp(resizeHandle, { pointerId: 2 })
    expect(container.querySelector('[data-slot="snap-guide"]')).toBeNull()
  })
})
