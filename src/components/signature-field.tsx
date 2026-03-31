import { useRef } from 'react'
import type { FieldPlacement, SignatureFieldPreview } from '../types'
import type { PointerEvent } from 'react'
import { cn } from '../lib/cn'

interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  className?: string
}

interface DragState {
  startClientX: number
  startClientY: number
  startXPercent: number
  startYPercent: number
}

interface ResizeState {
  startClientX: number
  startClientY: number
  startWidthPercent: number
  startHeightPercent: number
}

const MIN_WIDTH_PERCENT = 8
const MIN_HEIGHT_PERCENT = 3

function clampPercent(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function getFieldPreviewText(field: FieldPlacement, preview: SignatureFieldPreview): string {
  if (field.type === 'fullName') return preview.fullName
  if (field.type === 'title') return preview.title
  if (field.type === 'date') return preview.dateText
  return ''
}

export function SignatureField({ field, onUpdateField, onRemoveField, preview, className }: SignatureFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)

  function handleDragPointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.stopPropagation()
    if (event.button !== 0) return
    if (!rootRef.current?.parentElement) return

    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startXPercent: field.xPercent,
      startYPercent: field.yPercent,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleDragPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragStateRef.current) return
    const parentElement = rootRef.current?.parentElement
    if (!parentElement) return

    const deltaX = event.clientX - dragStateRef.current.startClientX
    const deltaY = event.clientY - dragStateRef.current.startClientY
    const deltaXPercent = (deltaX / parentElement.clientWidth) * 100
    const deltaYPercent = (deltaY / parentElement.clientHeight) * 100
    const maxX = 100 - field.widthPercent
    const maxY = 100 - field.heightPercent

    onUpdateField(field.id, {
      xPercent: clampPercent(Math.min(maxX, dragStateRef.current.startXPercent + deltaXPercent)),
      yPercent: clampPercent(Math.min(maxY, dragStateRef.current.startYPercent + deltaYPercent)),
    })
  }

  function handleDragPointerUp(event: PointerEvent<HTMLDivElement>): void {
    dragStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.stopPropagation()
    if (event.button !== 0) return

    resizeStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidthPercent: field.widthPercent,
      startHeightPercent: field.heightPercent,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleResizePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!resizeStateRef.current) return
    const parentElement = rootRef.current?.parentElement
    if (!parentElement) return

    const deltaX = event.clientX - resizeStateRef.current.startClientX
    const deltaY = event.clientY - resizeStateRef.current.startClientY
    const deltaWidthPercent = (deltaX / parentElement.clientWidth) * 100
    const deltaHeightPercent = (deltaY / parentElement.clientHeight) * 100

    const maxWidth = 100 - field.xPercent
    const maxHeight = 100 - field.yPercent
    const widthPercent = clampPercent(
      Math.min(maxWidth, Math.max(MIN_WIDTH_PERCENT, resizeStateRef.current.startWidthPercent + deltaWidthPercent))
    )
    const heightPercent = clampPercent(
      Math.min(maxHeight, Math.max(MIN_HEIGHT_PERCENT, resizeStateRef.current.startHeightPercent + deltaHeightPercent))
    )

    onUpdateField(field.id, { widthPercent, heightPercent })
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>): void {
    resizeStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const previewText = getFieldPreviewText(field, preview)

  return (
    <div
      ref={rootRef}
      data-slot="signature-field"
      data-field-type={field.type}
      className={cn(className)}
      style={{
        position: 'absolute',
        left: `${field.xPercent}%`,
        top: `${field.yPercent}%`,
        width: `${field.widthPercent}%`,
        height: `${field.heightPercent}%`,
        userSelect: 'none',
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
    >
      <div
        data-slot="signature-field-content"
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'stretch',
          justifyContent: 'space-between',
        }}
      >
        <div data-slot="signature-field-preview">
          <div data-slot="signature-field-label">{field.type}</div>
          {field.type === 'signature' && preview.signatureDataUrl ? (
            <img
              data-slot="signature-field-preview-image"
              src={preview.signatureDataUrl}
              alt="signature preview"
              draggable={false}
            />
          ) : (
            <div data-slot="signature-field-preview-text">{previewText || '—'}</div>
          )}
        </div>
        <button
          type="button"
          data-slot="signature-field-remove"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onRemoveField(field.id)
          }}
          aria-label="Remove field"
        >
          ×
        </button>
      </div>

      <div
        data-slot="signature-field-resize"
        style={{
          position: 'absolute',
          right: '-0.375rem',
          bottom: '-0.375rem',
          width: '0.75rem',
          height: '0.75rem',
          cursor: 'nwse-resize',
        }}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />
    </div>
  )
}
