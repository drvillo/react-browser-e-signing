import { useEffect, useRef, useState } from 'react'
import type { FieldPlacement, SignatureFieldPreview } from '../types'
import type { KeyboardEvent, PointerEvent } from 'react'
import { cn } from '../lib/cn'

interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  onUpdateCustomValue?: (label: string, value: string) => void
  onCustomFieldRenamed?: (oldLabel: string, newLabel: string) => void
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

type EditMode = 'idle' | 'label' | 'value'

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
  if (field.type === 'custom' && field.label) return preview.customFields?.[field.label] ?? ''
  return ''
}

export function SignatureField({
  field,
  onUpdateField,
  onRemoveField,
  preview,
  onUpdateCustomValue,
  onCustomFieldRenamed,
  className,
}: SignatureFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const labelInputRef = useRef<HTMLInputElement | null>(null)
  const valueInputRef = useRef<HTMLInputElement | null>(null)
  // Tracks intended next mode after label blur (Tab/Enter → 'value', blur/Escape → 'idle')
  const nextLabelModeRef = useRef<EditMode>('idle')

  const isCustom = field.type === 'custom'

  const [editMode, setEditMode] = useState<EditMode>(
    isCustom && !field.label ? 'label' : 'idle'
  )
  const [labelDraft, setLabelDraft] = useState(field.label ?? '')
  const [valueDraft, setValueDraft] = useState('')

  useEffect(() => {
    if (editMode !== 'label') return
    const id = setTimeout(() => labelInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [editMode])

  useEffect(() => {
    if (editMode !== 'value') return
    const id = setTimeout(() => valueInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [editMode])

  // Sync label draft when field.label is set externally
  useEffect(() => {
    if (editMode === 'idle') setLabelDraft(field.label ?? '')
  }, [field.label, editMode])

  function handleLabelKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      nextLabelModeRef.current = onUpdateCustomValue ? 'value' : 'idle'
      labelInputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      nextLabelModeRef.current = 'idle'
      setLabelDraft(field.label ?? '')
      labelInputRef.current?.blur()
    }
  }

  function handleLabelBlur(): void {
    const trimmed = labelDraft.trim()
    if (trimmed) {
      onUpdateField(field.id, { label: trimmed })
      if (field.label && trimmed !== field.label) {
        onCustomFieldRenamed?.(field.label, trimmed)
      }
    } else {
      setLabelDraft(field.label ?? '')
    }

    const next = nextLabelModeRef.current
    nextLabelModeRef.current = 'idle'

    if (next === 'value') {
      setValueDraft(preview.customFields?.[trimmed || field.label || ''] ?? '')
    }
    setEditMode(next)
  }

  function handleValueKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault()
      valueInputRef.current?.blur()
    }
  }

  function handleValueBlur(): void {
    if (field.label && onUpdateCustomValue) onUpdateCustomValue(field.label, valueDraft)
    setEditMode('idle')
  }

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
    onUpdateField(field.id, {
      widthPercent: clampPercent(Math.min(maxWidth, Math.max(MIN_WIDTH_PERCENT, resizeStateRef.current.startWidthPercent + deltaWidthPercent))),
      heightPercent: clampPercent(Math.min(maxHeight, Math.max(MIN_HEIGHT_PERCENT, resizeStateRef.current.startHeightPercent + deltaHeightPercent))),
    })
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>): void {
    resizeStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const previewText = getFieldPreviewText(field, preview)
  const fieldLabel = isCustom && field.label ? field.label : field.type

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
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div data-slot="signature-field-preview">
          {isCustom && editMode === 'label' ? (
            <input
              ref={labelInputRef}
              data-slot="signature-field-label-input"
              value={labelDraft}
              placeholder="Field name…"
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              data-slot="signature-field-label"
              title={isCustom ? 'Click to rename' : undefined}
              style={{ cursor: isCustom ? 'text' : undefined }}
              onClick={isCustom ? () => { setLabelDraft(field.label ?? ''); setEditMode('label') } : undefined}
            >
              {fieldLabel}
            </div>
          )}

          {field.type === 'signature' && preview.signatureDataUrl ? (
            <img
              data-slot="signature-field-preview-image"
              src={preview.signatureDataUrl}
              alt="signature preview"
              draggable={false}
            />
          ) : isCustom && editMode === 'value' ? (
            <input
              ref={valueInputRef}
              data-slot="signature-field-value-input"
              value={valueDraft}
              placeholder="Value…"
              onChange={(e) => setValueDraft(e.target.value)}
              onBlur={handleValueBlur}
              onKeyDown={handleValueKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              data-slot="signature-field-preview-text"
              style={{ cursor: isCustom && editMode === 'idle' ? 'text' : undefined }}
              onClick={isCustom && editMode === 'idle'
                ? () => { setValueDraft(preview.customFields?.[field.label ?? ''] ?? ''); setEditMode('value') }
                : undefined}
            >
              {previewText || '—'}
            </div>
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
