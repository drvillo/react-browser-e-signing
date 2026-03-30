import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePdfDocument } from '../../src/hooks/use-pdf-document'

describe('usePdfDocument', () => {
  it('converts Uint8Array input into ArrayBuffer data', async () => {
    const input = new Uint8Array([1, 2, 3, 4])
    const { result } = renderHook(() => usePdfDocument(input))

    await waitFor(() => {
      expect(result.current.pdfData).not.toBeNull()
      expect(result.current.hasPdf).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    const pdfData = result.current.pdfData
    expect(pdfData).toBeInstanceOf(ArrayBuffer)
    expect(Array.from(new Uint8Array(pdfData!))).toEqual([1, 2, 3, 4])
  })

  it('returns an empty state for null input', () => {
    const { result } = renderHook(() => usePdfDocument(null))
    expect(result.current.pdfData).toBeNull()
    expect(result.current.hasPdf).toBe(false)
    expect(result.current.numPages).toBe(0)
    expect(result.current.pageDimensions).toEqual([])
    expect(result.current.errorMessage).toBeNull()
  })

  it('exposes user-friendly errors when input conversion fails', async () => {
    const invalidInput = {
      arrayBuffer: async () => {
        throw new Error('Bad file content')
      },
    } as unknown as Blob

    const { result } = renderHook(() => usePdfDocument(invalidInput))

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Bad file content')
      expect(result.current.pdfData).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('sorts and filters page dimensions based on loaded pages', () => {
    const input = new Uint8Array([5, 6, 7])
    const { result } = renderHook(() => usePdfDocument(input))

    act(() => {
      result.current.setPageDimension(2, 300, 400)
      result.current.setPageDimension(0, 600, 800)
      result.current.setPageDimension(1, 500, 700)
    })

    expect(result.current.pageDimensions.map((entry) => entry.pageIndex)).toEqual([0, 1, 2])

    act(() => {
      result.current.handleDocumentLoadSuccess(2)
    })

    expect(result.current.numPages).toBe(2)
    expect(result.current.pageDimensions.map((entry) => entry.pageIndex)).toEqual([0, 1])
  })
})
