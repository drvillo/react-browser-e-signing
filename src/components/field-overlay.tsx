import { useState } from 'react'
import type { FieldPlacement, FieldType, SignatureFieldPreview } from '../types'
import type { TextLine } from '../lib/text-lines'
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
  preview: SignatureFieldPreview
  /** When true, clicking the overlay does not add new fields. */
  readOnly?: boolean
  /**
   * Text lines extracted from this page's PDF content via `groupTextLines`.
   * When provided, fields snap their value text baseline to the nearest line.
   * A red guide line (`[data-slot="snap-guide"]`) appears while snap is active.
   * Omit or pass `undefined` to disable snap. Pass `[]` to opt-in but disable at runtime.
   */
  textLines?: TextLine[]
  className?: string
}

export function FieldOverlay({
  pageIndex,
  fields,
  selectedFieldType,
  onAddField,
  onUpdateField,
  onRemoveField,
  preview,
  readOnly = false,
  textLines,
  className,
}: FieldOverlayProps) {
  const [activeGuideYPercent, setActiveGuideYPercent] = useState<number | null>(null)

  function handleOverlayPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (readOnly) return
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

  const overlayState = readOnly ? 'readonly' : selectedFieldType ? 'placing' : 'idle'

  return (
    <div
      data-slot="field-overlay"
      data-state={overlayState}
      className={cn(className)}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        cursor: readOnly ? 'default' : selectedFieldType ? 'crosshair' : 'default',
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
          preview={preview}
          textLines={textLines}
          onSnapGuide={setActiveGuideYPercent}
        />
      ))}

      {activeGuideYPercent !== null && (
        <div
          data-slot="snap-guide"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${activeGuideYPercent}%`,
            height: '1px',
            pointerEvents: 'none',
            zIndex: 30,
          }}
        />
      )}
    </div>
  )
}
