import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configure, resetConfig } from '../../src/lib/config'
import { loadSignatureFont, resetSignatureFontCache } from '../../src/lib/signature-fonts'

describe('signature fonts', () => {
  beforeEach(() => {
    resetConfig()
    resetSignatureFontCache()
    vi.restoreAllMocks()
  })

  it('loads bundled font via FontFace', async () => {
    const addMock = vi.fn()
    const loadMock = vi.fn().mockResolvedValue(undefined)

    vi.stubGlobal(
      'FontFace',
      class {
        family: string
        source: string
        constructor(name: string, source: string) {
          this.family = name
          this.source = source
        }
        load = loadMock
      }
    )

    Object.defineProperty(document, 'fonts', {
      value: { add: addMock },
      configurable: true,
    })

    await loadSignatureFont('Caveat')
    expect(loadMock).toHaveBeenCalled()
    expect(addMock).toHaveBeenCalled()
  })

  it('local-only mode does not call FontFace.load', async () => {
    configure({ fontMode: 'local-only' })

    const loadMock = vi.fn()
    vi.stubGlobal(
      'FontFace',
      class {
        constructor(_name: string, _source: string) {}
        load = loadMock
      }
    )

    await loadSignatureFont('Caveat')

    expect(loadMock).not.toHaveBeenCalled()
  })

  it('bundled mode invokes onWarning when FontFace.load fails', async () => {
    const onWarning = vi.fn()
    configure({ onWarning })

    vi.stubGlobal(
      'FontFace',
      class {
        constructor(_name: string, _source: string) {}
        load = vi.fn().mockRejectedValue(new Error('load failed'))
      }
    )

    Object.defineProperty(document, 'fonts', {
      value: { add: vi.fn() },
      configurable: true,
    })

    await expect(loadSignatureFont('Caveat')).resolves.toBeUndefined()
    expect(onWarning).toHaveBeenCalled()
    expect(onWarning.mock.calls[0][0].code).toBe('FONT_LOAD_FAILED')
  })
})
