import type { FieldPlacement, FieldType, SignatureFieldPreview } from '../types'
import { SignatureField } from './signature-field'
import type { PointerEvent } from 'react'
import { cn } from '../lib/cn'

interface FieldOverlayProps {
  pageIndex: number
  fields: FieldPlacement[]
  selectedFieldType: FieldType | null
  onAddField: (input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }) => void
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  onUpdateCustomValue?: (label: string, value: string) => void
  onCustomFieldRenamed?: (oldLabel: string, newLabel: string) => void
  preview: SignatureFieldPreview
  className?: string
}

export function FieldOverlay({
  pageIndex,
  fields,
  selectedFieldType,
  onAddField,
  onUpdateField,
  onRemoveField,
  onUpdateCustomValue,
  onCustomFieldRenamed,
  preview,
  className,
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
      data-slot="field-overlay"
      data-state={selectedFieldType ? 'placing' : 'idle'}
      className={cn(className)}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        cursor: selectedFieldType ? 'crosshair' : 'default',
      }}
      onPointerDown={handleOverlayPointerDown}
      aria-label={`Field overlay page ${pageIndex + 1}`}
    >
      {pageFields.map((field) => (
        <SignatureField
          key={field.id}
          field={field}
          onUpdateField={onUpdateField}
          onRemoveField={onRemoveField}
          onUpdateCustomValue={onUpdateCustomValue}
          onCustomFieldRenamed={onCustomFieldRenamed}
          preview={preview}
        />
      ))}
    </div>
  )
}
