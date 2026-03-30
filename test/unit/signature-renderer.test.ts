import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSignatureRenderer } from '../../src/hooks/use-signature-renderer'

vi.mock('../../src/lib/signature-fonts', () => ({
  loadSignatureFont: vi.fn().mockResolvedValue(undefined),
}))

const originalCreateElement = document.createElement.bind(document)

function mockCanvasForTypedRendering(): void {
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    if (tagName !== 'canvas') return originalCreateElement(tagName)

    const context = {
      font: '',
      fillStyle: '',
      textBaseline: '',
      measureText: () => ({ width: 220 }),
      clearRect: () => undefined,
      fillText: () => undefined,
    }

    return {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: () => 'data:image/png;base64,mocked-typed-signature',
    } as unknown as HTMLCanvasElement
  }) as typeof document.createElement)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSignatureRenderer', () => {
  it('generates PNG data URL for typed signatures', async () => {
    mockCanvasForTypedRendering()

    const { result } = renderHook(() =>
      useSignatureRenderer({
        signerName: 'Jane Doe',
        style: { mode: 'typed', fontFamily: 'Dancing Script' },
      })
    )

    await waitFor(() => {
      expect(result.current.signatureDataUrl).toBe('data:image/png;base64,mocked-typed-signature')
      expect(result.current.isRendering).toBe(false)
    })
  })

  it('returns drawn data URL directly when style mode is drawn', async () => {
    const drawnDataUrl = 'data:image/png;base64,abc123'
    const { result } = renderHook(() =>
      useSignatureRenderer({
        signerName: 'Jane Doe',
        style: { mode: 'drawn', dataUrl: drawnDataUrl },
      })
    )

    await waitFor(() => {
      expect(result.current.signatureDataUrl).toBe(drawnDataUrl)
      expect(result.current.isRendering).toBe(false)
    })
  })

  it('returns null signature when signer name is empty', async () => {
    const { result } = renderHook(() =>
      useSignatureRenderer({
        signerName: '   ',
        style: { mode: 'typed', fontFamily: 'Dancing Script' },
      })
    )

    await waitFor(() => {
      expect(result.current.signatureDataUrl).toBeNull()
      expect(result.current.isRendering).toBe(false)
    })
  })
})
