import { beforeEach, describe, expect, it } from 'vitest'
import { configure, getConfig, resetConfig } from '../../src/lib/config'

describe('configure', () => {
  beforeEach(() => {
    resetConfig()
  })

  it('stores and retrieves options', () => {
    configure({ pdfWorkerSrc: '/pdf.worker.min.mjs', fontMode: 'local-only' })
    expect(getConfig().pdfWorkerSrc).toBe('/pdf.worker.min.mjs')
    expect(getConfig().fontMode).toBe('local-only')
  })

  it('merges subsequent configure calls', () => {
    configure({ pdfWorkerSrc: '/a.mjs' })
    configure({ fontMode: 'network' })
    expect(getConfig().pdfWorkerSrc).toBe('/a.mjs')
    expect(getConfig().fontMode).toBe('network')
  })

  it('resetConfig clears state', () => {
    configure({ pdfWorkerSrc: '/x.mjs' })
    resetConfig()
    expect(getConfig().pdfWorkerSrc).toBeUndefined()
  })
})
