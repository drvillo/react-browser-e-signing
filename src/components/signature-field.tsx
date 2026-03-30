import { useRef } from 'react'
import type { FieldPlacement, SignatureFieldPreview } from '../types'
import type { PointerEvent } from 'react'

interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
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

export function SignatureField({ field, onUpdateField, onRemoveField, preview }: SignatureFieldProps) {
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
      className="absolute rounded border-2 border-blue-500 bg-blue-50/80 shadow-sm select-none"
      style={{
        left: `${field.xPercent}%`,
        top: `${field.yPercent}%`,
        width: `${field.widthPercent}%`,
        height: `${field.heightPercent}%`,
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
    >
      <div className="flex h-full w-full items-start justify-between gap-2 p-1.5 text-[11px] text-slate-800">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="truncate font-semibold capitalize">{field.type}</div>
          {field.type === 'signature' && preview.signatureDataUrl ? (
            <img
              src={preview.signatureDataUrl}
              alt="signature preview"
              className="mt-1 h-[calc(100%-18px)] max-h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="truncate text-slate-600">{previewText || '—'}</div>
          )}
        </div>
        <button
          type="button"
          className="rounded bg-white/80 px-1 text-xs text-red-600 hover:bg-white"
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
        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-full bg-blue-600"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />
    </div>
  )
}
