import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FieldOverlay } from '../../src/components/field-overlay'
import type { SignatureFieldPreview } from '../../src/types'

const preview: SignatureFieldPreview = {
  signatureDataUrl: null,
  fullName: '',
  title: '',
  dateText: '',
}

describe('FieldOverlay', () => {
  it('readOnly prevents onAddField when clicking overlay', () => {
    const onAddField = vi.fn()
    const { container } = render(
      <div style={{ position: 'relative', width: 400, height: 600 }}>
        <FieldOverlay
          pageIndex={0}
          fields={[]}
          selectedFieldType="signature"
          onAddField={onAddField}
          onUpdateField={vi.fn()}
          onRemoveField={vi.fn()}
          preview={preview}
          readOnly
        />
      </div>
    )
    const overlay = container.querySelector('[data-slot="field-overlay"]')
    expect(overlay?.getAttribute('data-state')).toBe('readonly')
    fireEvent.pointerDown(overlay!, { button: 0, clientX: 200, clientY: 300 })
    expect(onAddField).not.toHaveBeenCalled()
  })

  it('calls onAddField when not readOnly and field type selected', () => {
    const onAddField = vi.fn()
    const { container } = render(
      <div style={{ position: 'relative', width: 400, height: 600 }}>
        <FieldOverlay
          pageIndex={0}
          fields={[]}
          selectedFieldType="signature"
          onAddField={onAddField}
          onUpdateField={vi.fn()}
          onRemoveField={vi.fn()}
          preview={preview}
        />
      </div>
    )
    const overlay = container.querySelector('[data-slot="field-overlay"]')
    expect(overlay?.getAttribute('data-state')).toBe('placing')
    fireEvent.pointerDown(overlay!, { button: 0, clientX: 200, clientY: 300 })
    expect(onAddField).toHaveBeenCalledTimes(1)
    expect(onAddField).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 0, type: 'signature' })
    )
  })
})
