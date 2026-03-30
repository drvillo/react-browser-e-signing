import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFieldPlacement } from '../../src/hooks/use-field-placement'

describe('useFieldPlacement', () => {
  it('adds, updates, removes and clears fields', () => {
    const { result } = renderHook(() => useFieldPlacement())

    let fieldId = ''
    act(() => {
      const field = result.current.addField({
        pageIndex: 0,
        type: 'signature',
        xPercent: 10,
        yPercent: 20,
      })
      fieldId = field.id
    })

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0]?.xPercent).toBe(10)

    act(() => {
      result.current.updateField(fieldId, { xPercent: 44 })
    })
    expect(result.current.fields[0]?.xPercent).toBe(44)

    act(() => {
      result.current.removeField(fieldId)
    })
    expect(result.current.fields).toHaveLength(0)

    act(() => {
      result.current.addField({
        pageIndex: 1,
        type: 'title',
        xPercent: 2,
        yPercent: 2,
      })
      result.current.clearFields()
    })
    expect(result.current.fields).toHaveLength(0)
  })

  it('applies custom default dimensions for new fields', () => {
    const { result } = renderHook(() =>
      useFieldPlacement({ defaultWidthPercent: 40, defaultHeightPercent: 12 })
    )

    act(() => {
      result.current.addField({
        pageIndex: 0,
        type: 'signature',
        xPercent: 5,
        yPercent: 5,
      })
    })

    const createdField = result.current.fields[0]
    expect(createdField?.widthPercent).toBe(40)
    expect(createdField?.heightPercent).toBe(12)
  })

  it('clamps coordinates and dimensions during add and update', () => {
    const { result } = renderHook(() => useFieldPlacement())

    let fieldId = ''
    act(() => {
      const field = result.current.addField({
        pageIndex: 0,
        type: 'signature',
        xPercent: -20,
        yPercent: 150,
      })
      fieldId = field.id
    })

    expect(result.current.fields[0]?.xPercent).toBe(0)
    expect(result.current.fields[0]?.yPercent).toBe(100)

    act(() => {
      result.current.updateField(fieldId, {
        xPercent: 180,
        widthPercent: -5,
      })
    })

    expect(result.current.fields[0]?.xPercent).toBe(100)
    expect(result.current.fields[0]?.widthPercent).toBe(0)
    expect(result.current.fields[0]?.yPercent).toBe(100)
  })
})
