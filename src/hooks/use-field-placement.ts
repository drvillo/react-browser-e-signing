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
  const defaultHeightPercent = options.defaultHeightPercent ?? 7
  const [fields, setFieldsState] = useState<FieldPlacement[]>(options.initialFields ?? [])

  const setFields = useCallback((nextFields: FieldPlacement[]) => {
    setFieldsState(nextFields)
  }, [])

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
      setFieldsState((previousFields) => [...previousFields, field])
      return field
    },
    [defaultHeightPercent, defaultWidthPercent]
  )

  const appendFields = useCallback((nextFields: FieldPlacement[]) => {
    if (!nextFields.length) return
    setFieldsState((previousFields) => {
      const existingIds = new Set(previousFields.map((field) => field.id))
      const uniqueNextFields = nextFields.filter((field) => !existingIds.has(field.id))
      if (!uniqueNextFields.length) return previousFields
      return [...previousFields, ...uniqueNextFields]
    })
  }, [])

  const updateField = useCallback((id: string, partial: Partial<FieldPlacement>) => {
    setFieldsState((previousFields) =>
      previousFields.map((field) => {
        if (field.id !== id) return field

        let effectivePartial: Partial<FieldPlacement> = { ...partial }
        if (field.locked) {
          delete effectivePartial.xPercent
          delete effectivePartial.yPercent
          delete effectivePartial.widthPercent
          delete effectivePartial.heightPercent
        }
        if (Object.keys(effectivePartial).length === 0) return field

        return {
          ...field,
          ...effectivePartial,
          xPercent:
            effectivePartial.xPercent === undefined ? field.xPercent : clampPercent(effectivePartial.xPercent),
          yPercent:
            effectivePartial.yPercent === undefined ? field.yPercent : clampPercent(effectivePartial.yPercent),
          widthPercent:
            effectivePartial.widthPercent === undefined
              ? field.widthPercent
              : clampPercent(effectivePartial.widthPercent),
          heightPercent:
            effectivePartial.heightPercent === undefined
              ? field.heightPercent
              : clampPercent(effectivePartial.heightPercent),
        }
      })
    )
  }, [])

  const removeField = useCallback((id: string) => {
    setFieldsState((previousFields) =>
      previousFields.filter((field) => field.id !== id || field.locked)
    )
  }, [])

  const clearFields = useCallback(() => {
    setFieldsState([])
  }, [])

  const fieldActions = useMemo(
    () => ({
      addField,
      appendFields,
      updateField,
      removeField,
      clearFields,
      setFields,
    }),
    [addField, appendFields, clearFields, removeField, setFields, updateField]
  )

  return {
    fields,
    ...fieldActions,
  }
}
