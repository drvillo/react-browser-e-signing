import { useEffect, useRef, useState } from 'react'
import type { FieldPlacement, FieldType, SignatureFieldPreview } from '../types'
import type { KeyboardEvent, PointerEvent } from 'react'
import { cn } from '../lib/cn'
import type { TextLine } from '../lib/text-lines'
import { snapToTextLine } from '../lib/snap'

interface SignatureFieldProps {
  field: FieldPlacement
  onUpdateField: (fieldId: string, partial: Partial<FieldPlacement>) => void
  onRemoveField: (fieldId: string) => void
  preview: SignatureFieldPreview
  /**
   * Text lines for this page, used to snap the field's value text baseline to a
   * nearby text line while dragging. Omit to disable snap.
   */
  textLines?: TextLine[]
  /**
   * Called during drag with the active snap guide's baseline percent,
   * or null when snap is not active / drag ends.
   */
  onSnapGuide?: (lineBaselinePercent: number | null) => void
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

const FIELD_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  fullName: 'Full Name',
  title: 'Title',
  date: 'Date',
  text: 'Text',
}

function clampPercent(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function getFieldPreviewText(field: FieldPlacement, preview: SignatureFieldPreview): string {
  if (field.value) {
    if (field.type === 'signature') return ''
    return field.value
  }
  if (field.type === 'fullName') return preview.fullName
  if (field.type === 'title') return preview.title
  if (field.type === 'date') return preview.dateText
  if (field.type === 'text') return ''
  return ''
}

export function SignatureField({
  field,
  onUpdateField,
  onRemoveField,
  preview,
  textLines,
  onSnapGuide,
  className,
}: SignatureFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  /** Tracks the text line baseline the field is currently snapped to (persists across drag/resize). */
  const snappedToBaselineRef = useRef<number | null>(null)
  /** Cached ratio (0..1) of where the value content's visual center sits within the field height. */
  const valueCenterRatioRef = useRef<number>(0.5)
  const labelInputRef = useRef<HTMLInputElement | null>(null)
  const valueInputRef = useRef<HTMLInputElement | null>(null)
  const nextLabelModeRef = useRef<EditMode>('idle')

  const isText = field.type === 'text'
  const isLocked = field.locked === true

  const [editMode, setEditMode] = useState<EditMode>(
    isText && !field.label ? 'label' : 'idle'
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

  useEffect(() => {
    if (editMode === 'idle') setLabelDraft(field.label ?? '')
  }, [field.label, editMode])

  function handleLabelKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      nextLabelModeRef.current = isText ? 'value' : 'idle'
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
    if (trimmed) onUpdateField(field.id, { label: trimmed })
    else setLabelDraft(field.label ?? '')

    const next = nextLabelModeRef.current
    nextLabelModeRef.current = 'idle'

    if (next === 'value') setValueDraft(field.value ?? '')
    setEditMode(next)
  }

  function handleValueKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault()
      valueInputRef.current?.blur()
    }
  }

  function handleValueBlur(): void {
    onUpdateField(field.id, { value: valueDraft })
    setEditMode('idle')
  }

  /**
   * Measures where the value content's visual center sits within the field,
   * as a fraction of field height from the top (0 = top, 1 = bottom).
   * Falls back to 0.5 (geometric center) when DOM measurement isn't possible.
   */
  function measureValueCenterRatio(): number {
    const fieldEl = rootRef.current
    if (!fieldEl) return 0.5
    const fieldRect = fieldEl.getBoundingClientRect()
    if (fieldRect.height === 0) return 0.5

    const valueEl =
      fieldEl.querySelector('[data-slot="signature-field-preview-image"]') ??
      fieldEl.querySelector('[data-slot="signature-field-preview-text"]')
    if (!valueEl) return 0.5

    const valueRect = valueEl.getBoundingClientRect()
    const valueCenterFromTop = valueRect.top + valueRect.height / 2 - fieldRect.top
    return Math.max(0, Math.min(1, valueCenterFromTop / fieldRect.height))
  }

  function handleDragPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (isLocked) return
    event.stopPropagation()
    if (event.button !== 0) return
    if (!rootRef.current?.parentElement) return
    valueCenterRatioRef.current = measureValueCenterRatio()
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

    const rawYPercent = clampPercent(Math.min(maxY, dragStateRef.current.startYPercent + deltaYPercent))

    const { yPercent, snappedLineBaselinePercent } =
      textLines && textLines.length > 0
        ? snapToTextLine({
            candidateYPercent: rawYPercent,
            fieldHeightPercent: field.heightPercent,
            textLines,
            valueCenterRatio: valueCenterRatioRef.current,
          })
        : { yPercent: rawYPercent, snappedLineBaselinePercent: null }

    snappedToBaselineRef.current = snappedLineBaselinePercent

    onUpdateField(field.id, {
      xPercent: clampPercent(Math.min(maxX, dragStateRef.current.startXPercent + deltaXPercent)),
      yPercent,
    })

    onSnapGuide?.(snappedLineBaselinePercent)
  }

  function handleDragPointerUp(event: PointerEvent<HTMLDivElement>): void {
    dragStateRef.current = null
    onSnapGuide?.(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (isLocked) return
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
    const newWidthPercent = clampPercent(
      Math.min(maxWidth, Math.max(MIN_WIDTH_PERCENT, resizeStateRef.current.startWidthPercent + deltaWidthPercent))
    )
    const newHeightPercent = clampPercent(
      Math.min(
        maxHeight,
        Math.max(MIN_HEIGHT_PERCENT, resizeStateRef.current.startHeightPercent + deltaHeightPercent)
      )
    )

    const baseline = snappedToBaselineRef.current
    if (baseline !== null) {
      const ratio = valueCenterRatioRef.current
      const newYPercent = baseline - newHeightPercent * ratio
      const clampedYPercent = Math.max(0, Math.min(100 - newHeightPercent, newYPercent))

      onUpdateField(field.id, {
        widthPercent: newWidthPercent,
        heightPercent: newHeightPercent,
        yPercent: clampedYPercent,
      })
      onSnapGuide?.(baseline)
    } else {
      onUpdateField(field.id, {
        widthPercent: newWidthPercent,
        heightPercent: newHeightPercent,
      })
    }
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>): void {
    resizeStateRef.current = null
    onSnapGuide?.(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const previewText = getFieldPreviewText(field, preview)
  const displayLabel = field.label ?? FIELD_LABELS[field.type] ?? field.type

  const signaturePreviewSrc =
    field.type === 'signature' && field.value
      ? field.value
      : field.type === 'signature'
        ? preview.signatureDataUrl
        : null

  const hasValue = Boolean(field.value)

  return (
    <div
      ref={rootRef}
      data-slot="signature-field"
      data-field-type={field.type}
      data-locked={isLocked ? 'true' : 'false'}
      data-has-value={hasValue ? 'true' : 'false'}
      className={cn(className)}
      style={{
        position: 'absolute',
        left: `${field.xPercent}%`,
        top: `${field.yPercent}%`,
        width: `${field.widthPercent}%`,
        height: `${field.heightPercent}%`,
        userSelect: 'none',
        cursor: isLocked ? 'default' : undefined,
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
          {isText && editMode === 'label' ? (
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
              title={isText ? 'Click to rename' : undefined}
              style={{ cursor: isText ? 'text' : undefined }}
              onClick={
                isText
                  ? () => {
                      setLabelDraft(field.label ?? '')
                      setEditMode('label')
                    }
                  : undefined
              }
            >
              {displayLabel}
            </div>
          )}

          {field.type === 'signature' && signaturePreviewSrc ? (
            <img
              data-slot="signature-field-preview-image"
              src={signaturePreviewSrc}
              alt="signature preview"
              draggable={false}
            />
          ) : isText && editMode === 'value' ? (
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
              style={{ cursor: isText && editMode === 'idle' ? 'text' : undefined }}
              onClick={
                isText && editMode === 'idle'
                  ? () => {
                      setValueDraft(field.value ?? '')
                      setEditMode('value')
                    }
                  : undefined
              }
            >
              {previewText || '—'}
            </div>
          )}
        </div>

        {!isLocked ? (
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
        ) : null}
      </div>

      {!isLocked ? (
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
      ) : null}
    </div>
  )
}
