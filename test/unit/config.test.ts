import { beforeEach, describe, expect, it } from 'vitest'
import { pdfjs } from 'react-pdf'
import { configure, getConfig, resetConfig, setPdfWorkerSrc } from '../../src/lib/config'

describe('configure', () => {
  beforeEach(() => {
    resetConfig()
    pdfjs.GlobalWorkerOptions.workerSrc = ''
  })

  it('stores and retrieves options', () => {
    configure({ pdfWorkerSrc: '/pdf.worker.min.mjs', fontMode: 'local-only' })
    expect(getConfig().pdfWorkerSrc).toBe('/pdf.worker.min.mjs')
    expect(getConfig().fontMode).toBe('local-only')
  })

  it('merges subsequent configure calls', () => {
    configure({ pdfWorkerSrc: '/a.mjs' })
    configure({ fontMode: 'bundled' })
    expect(getConfig().pdfWorkerSrc).toBe('/a.mjs')
    expect(getConfig().fontMode).toBe('bundled')
  })

  it('resetConfig clears state', () => {
    configure({ pdfWorkerSrc: '/x.mjs' })
    resetConfig()
    expect(getConfig().pdfWorkerSrc).toBeUndefined()
  })

  it('applies pdfWorkerSrc synchronously to pdfjs.GlobalWorkerOptions', () => {
    configure({ pdfWorkerSrc: '/sync.mjs' })
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/sync.mjs')
  })

  it('does not overwrite GlobalWorkerOptions when pdfWorkerSrc is omitted', () => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/preexisting.mjs'
    configure({ fontMode: 'bundled' })
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/preexisting.mjs')
  })
})

describe('setPdfWorkerSrc', () => {
  beforeEach(() => {
    resetConfig()
    pdfjs.GlobalWorkerOptions.workerSrc = ''
  })

  it('is a no-op for empty values', () => {
    setPdfWorkerSrc(undefined)
    setPdfWorkerSrc('')
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('')
  })

  it('skips redundant writes', () => {
    setPdfWorkerSrc('/once.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = '/external.mjs'
    setPdfWorkerSrc('/once.mjs')
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/external.mjs')
  })

  it('reports failures via onWarning instead of throwing', () => {
    const warnings: { code: string; message: string }[] = []
    configure({ onWarning: (w) => warnings.push(w) })
    const original = Object.getOwnPropertyDescriptor(pdfjs.GlobalWorkerOptions, 'workerSrc')
    Object.defineProperty(pdfjs.GlobalWorkerOptions, 'workerSrc', {
      configurable: true,
      get: () => '',
      set: () => {
        throw new Error('sealed')
      },
    })
    try {
      expect(() => setPdfWorkerSrc('/seal.mjs')).not.toThrow()
      expect(warnings.some((w) => w.code === 'WORKER_SETUP_FAILED')).toBe(true)
    } finally {
      if (original) Object.defineProperty(pdfjs.GlobalWorkerOptions, 'workerSrc', original)
    }
  })
})
