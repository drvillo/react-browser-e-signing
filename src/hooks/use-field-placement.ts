import { useCallback, useMemo, useState } from 'react'
import type { FieldPlacement, FieldType } from '../types'

interface UseFieldPlacementOptions {
  defaultWidthPercent?: number
  defaultHeightPercent?: number
  initialFields?: FieldPlacement[]
}

interface AddFieldInput {
  pageIndex: number
  type: FieldType
  xPercent: number
  yPercent: number
  label?: string
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function buildFieldId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `field-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useFieldPlacement(options: UseFieldPlacementOptions = {}) {
  const defaultWidthPercent = options.defaultWidthPercent ?? 25
  const defaultHeightPercent = options.defaultHeightPercent ?? 5
  const [fields, setFields] = useState<FieldPlacement[]>(options.initialFields ?? [])

  const addField = useCallback(
    ({ pageIndex, type, xPercent, yPercent, label }: AddFieldInput) => {
      const field: FieldPlacement = {
        id: buildFieldId(),
        pageIndex,
        type,
        xPercent: clampPercent(xPercent),
        yPercent: clampPercent(yPercent),
        widthPercent: clampPercent(defaultWidthPercent),
        heightPercent: clampPercent(defaultHeightPercent),
        ...(label !== undefined && { label }),
      }
      setFields((previousFields) => [...previousFields, field])
      return field
    },
    [defaultHeightPercent, defaultWidthPercent]
  )

  const appendFields = useCallback((nextFields: FieldPlacement[]) => {
    if (!nextFields.length) return
    setFields((previousFields) => {
      const existingIds = new Set(previousFields.map((field) => field.id))
      const uniqueNextFields = nextFields.filter((field) => !existingIds.has(field.id))
      if (!uniqueNextFields.length) return previousFields
      return [...previousFields, ...uniqueNextFields]
    })
  }, [])

  const updateField = useCallback((id: string, partial: Partial<FieldPlacement>) => {
    setFields((previousFields) =>
      previousFields.map((field) => {
        if (field.id !== id) return field
        return {
          ...field,
          ...partial,
          xPercent: partial.xPercent === undefined ? field.xPercent : clampPercent(partial.xPercent),
          yPercent: partial.yPercent === undefined ? field.yPercent : clampPercent(partial.yPercent),
          widthPercent:
            partial.widthPercent === undefined ? field.widthPercent : clampPercent(partial.widthPercent),
          heightPercent:
            partial.heightPercent === undefined ? field.heightPercent : clampPercent(partial.heightPercent),
        }
      })
    )
  }, [])

  const removeField = useCallback((id: string) => {
    setFields((previousFields) => previousFields.filter((field) => field.id !== id))
  }, [])

  const clearFields = useCallback(() => {
    setFields([])
  }, [])

  const fieldActions = useMemo(
    () => ({
      addField,
      appendFields,
      updateField,
      removeField,
      clearFields,
    }),
    [addField, appendFields, clearFields, removeField, updateField]
  )

  return {
    fields,
    ...fieldActions,
  }
}
