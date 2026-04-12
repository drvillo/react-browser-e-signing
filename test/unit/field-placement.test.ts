import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FieldPlacement } from '../../src/types'
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

  it('pre-populates from initialFields', () => {
    const initial: FieldPlacement[] = [
      {
        id: 'a',
        type: 'signature',
        pageIndex: 0,
        xPercent: 5,
        yPercent: 10,
        widthPercent: 20,
        heightPercent: 6,
      },
    ]
    const { result } = renderHook(() => useFieldPlacement({ initialFields: initial }))

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0]).toEqual(initial[0])
  })

  it('appends addField after initialFields', () => {
    const initial: FieldPlacement[] = [
      {
        id: 'initial-1',
        type: 'fullName',
        pageIndex: 0,
        xPercent: 1,
        yPercent: 2,
        widthPercent: 30,
        heightPercent: 5,
      },
    ]
    const { result } = renderHook(() => useFieldPlacement({ initialFields: initial }))

    act(() => {
      result.current.addField({
        pageIndex: 0,
        type: 'date',
        xPercent: 50,
        yPercent: 50,
      })
    })

    expect(result.current.fields).toHaveLength(2)
    expect(result.current.fields[0]?.id).toBe('initial-1')
    expect(result.current.fields[1]?.type).toBe('date')
  })

  it('clearFields removes all fields including initial ones', () => {
    const { result } = renderHook(() =>
      useFieldPlacement({
        initialFields: [
          {
            id: 'x',
            type: 'title',
            pageIndex: 0,
            xPercent: 0,
            yPercent: 0,
            widthPercent: 10,
            heightPercent: 5,
          },
        ],
      })
    )

    act(() => {
      result.current.clearFields()
    })
    expect(result.current.fields).toHaveLength(0)
  })

  it('updateField and removeField work on any field', () => {
    const { result } = renderHook(() =>
      useFieldPlacement({
        initialFields: [
          {
            id: 'field-id',
            type: 'signature',
            pageIndex: 0,
            xPercent: 10,
            yPercent: 10,
            widthPercent: 25,
            heightPercent: 5,
          },
        ],
      })
    )

    act(() => {
      result.current.updateField('field-id', { xPercent: 33 })
    })
    expect(result.current.fields[0]?.xPercent).toBe(33)

    act(() => {
      result.current.removeField('field-id')
    })
    expect(result.current.fields).toHaveLength(0)
  })

  it('addField with type custom produces a custom field', () => {
    const { result } = renderHook(() => useFieldPlacement())

    act(() => {
      result.current.addField({
        pageIndex: 0,
        type: 'custom',
        xPercent: 15,
        yPercent: 25,
      })
    })

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0]?.type).toBe('custom')
  })

  it('initialFields with custom type preserves label', () => {
    const initial: FieldPlacement[] = [
      {
        id: 'custom-1',
        type: 'custom',
        pageIndex: 0,
        xPercent: 10,
        yPercent: 20,
        widthPercent: 30,
        heightPercent: 5,
        label: 'companyName',
      },
    ]
    const { result } = renderHook(() => useFieldPlacement({ initialFields: initial }))

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.fields[0]).toEqual(initial[0])
    expect(result.current.fields[0]?.type).toBe('custom')
    expect(result.current.fields[0]?.label).toBe('companyName')
  })

  it('does not reset when initialFields option reference changes after mount', () => {
    const initialA: FieldPlacement[] = [
      {
        id: 'one',
        type: 'date',
        pageIndex: 0,
        xPercent: 1,
        yPercent: 1,
        widthPercent: 10,
        heightPercent: 5,
      },
    ]
    const initialB: FieldPlacement[] = [
      {
        id: 'two',
        type: 'title',
        pageIndex: 0,
        xPercent: 2,
        yPercent: 2,
        widthPercent: 10,
        heightPercent: 5,
      },
    ]

    const { result, rerender } = renderHook(
      ({ initialFields }: { initialFields: FieldPlacement[] }) => useFieldPlacement({ initialFields }),
      { initialProps: { initialFields: initialA } }
    )

    expect(result.current.fields[0]?.id).toBe('one')

    rerender({ initialFields: initialB })
    expect(result.current.fields[0]?.id).toBe('one')
  })
})
