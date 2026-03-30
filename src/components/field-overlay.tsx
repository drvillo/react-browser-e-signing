import type { FieldPlacement, FieldType, SignatureFieldPreview } from '../types'
import { SignatureField } from './signature-field'
import type { PointerEvent } from 'react'

interface FieldOverlayProps {
  pageIndex: number
  fields: FieldPlacement[]
  selectedFieldType: FieldType | null
  onAddField: (input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }) => void
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
}

export function FieldOverlay({
  pageIndex,
  fields,
  selectedFieldType,
  onAddField,
  onUpdateField,
  onRemoveField,
  preview,
}: FieldOverlayProps) {
  function handleOverlayPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (!selectedFieldType) return
    if (event.button !== 0) return
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100
    onAddField({
      pageIndex,
      type: selectedFieldType,
      xPercent,
      yPercent,
    })
  }

  const pageFields = fields.filter((field) => field.pageIndex === pageIndex)

  return (
    <div
      className={`absolute inset-0 z-20 rounded ${selectedFieldType ? 'cursor-crosshair' : 'cursor-default'}`}
      onPointerDown={handleOverlayPointerDown}
      aria-label={`Field overlay page ${pageIndex + 1}`}
    >
      {pageFields.map((field) => (
        <SignatureField
          key={field.id}
          field={field}
          onUpdateField={onUpdateField}
          onRemoveField={onRemoveField}
          preview={preview}
        />
      ))}
    </div>
  )
}
