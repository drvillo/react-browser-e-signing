import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configure, resetConfig } from '../../src/lib/config'
import {
  buildSignatureFontCssUrl,
  loadSignatureFont,
  resetSignatureFontCache,
} from '../../src/lib/signature-fonts'

describe('signature fonts', () => {
  beforeEach(() => {
    resetConfig()
    resetSignatureFontCache()
    vi.restoreAllMocks()
  })

  it('builds google fonts css url', () => {
    expect(buildSignatureFontCssUrl('Caveat')).toContain('family=Caveat')
  })

  it('loads font from css definition', async () => {
    const addMock = vi.fn()
    const loadMock = vi.fn().mockResolvedValue(undefined)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(`
          @font-face {
            font-family: "Caveat";
            src: url(https://fonts.gstatic.com/s/test.woff2) format('woff2');
          }
        `),
      })
    )

    vi.stubGlobal(
      'FontFace',
      class {
        constructor(_name: string, _source: string) {}
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

  it('local-only mode does not call fetch', async () => {
    configure({ fontMode: 'local-only' })

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await loadSignatureFont('Caveat')

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('network mode handles fetch failure without throwing and invokes onWarning', async () => {
    const onWarning = vi.fn()
    configure({ onWarning })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    await expect(loadSignatureFont('Caveat')).resolves.toBeUndefined()
    expect(onWarning).toHaveBeenCalled()
    expect(onWarning.mock.calls[0][0].code).toBe('FONT_LOAD_FAILED')
  })
})
