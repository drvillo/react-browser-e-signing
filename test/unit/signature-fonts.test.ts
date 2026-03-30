import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSignatureFontCssUrl, loadSignatureFont } from '../../src/lib/signature-fonts'

describe('signature fonts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('builds google fonts css url', () => {
    expect(buildSignatureFontCssUrl('Dancing Script')).toContain('family=Dancing+Script')
  })

  it('loads font from css definition', async () => {
    const addMock = vi.fn()
    const loadMock = vi.fn().mockResolvedValue(undefined)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(`
          @font-face {
            font-family: "Dancing Script";
            src: url(https://fonts.gstatic.com/s/test.woff2) format('woff2');
          }
        `),
    }))

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

    await loadSignatureFont('Dancing Script')
    expect(loadMock).toHaveBeenCalled()
    expect(addMock).toHaveBeenCalled()
  })
})
