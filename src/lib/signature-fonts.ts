import { getConfig } from './config'

const loadedFonts = new Set<string>()

export const SIGNATURE_FONTS = [
  'Caveat',
  'Homemade Apple',
  'Reenie Beanie',
  'Mr Dafoe',
  'Pacifico',
  'Qwitcher Grypen',
] as const

/** Latin-400 woff2 shipped under `dist/fonts/` (copied from @fontsource at build time). */
const BUNDLED_FONT_FILES: Record<(typeof SIGNATURE_FONTS)[number], string> = {
  Caveat: 'caveat.woff2',
  'Homemade Apple': 'homemade-apple.woff2',
  'Reenie Beanie': 'reenie-beanie.woff2',
  'Mr Dafoe': 'mr-dafoe.woff2',
  Pacifico: 'pacifico.woff2',
  'Qwitcher Grypen': 'qwitcher-grypen.woff2',
}

function resolveFontMode(
  mode: ReturnType<typeof getConfig>['fontMode'],
): 'bundled' | 'local-only' {
  if (mode === 'local-only') return 'local-only'
  return 'bundled'
}

function getBundledFontUrl(fontFamily: string): string | null {
  if (!(fontFamily in BUNDLED_FONT_FILES)) return null
  const file = BUNDLED_FONT_FILES[fontFamily as keyof typeof BUNDLED_FONT_FILES]
  return new URL(`./fonts/${file}`, import.meta.url).href
}

function warnFontLoad(message: string): void {
  try {
    getConfig().onWarning?.({ code: 'FONT_LOAD_FAILED', message })
  } catch {
    // never throw from observability hook
  }
}

async function loadFontFaceFromUrl(fontFamily: string, url: string): Promise<void> {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return
  const fontFace = new FontFace(fontFamily, `url(${url})`)
  await fontFace.load()
  const fontSet = document.fonts as unknown as { add: (font: FontFace) => void }
  fontSet.add(fontFace)
}

export async function loadSignatureFont(fontFamily: string): Promise<void> {
  if (loadedFonts.has(fontFamily)) return
  if (typeof document === 'undefined') return
  if (typeof FontFace === 'undefined') return

  const { fontMode, fontUrlResolver } = getConfig()
  const resolvedMode = resolveFontMode(fontMode)

  if (resolvedMode === 'local-only') {
    loadedFonts.add(fontFamily)
    return
  }

  const tryLoadBundled = async (): Promise<void> => {
    const url = getBundledFontUrl(fontFamily)
    if (!url) throw new Error(`No bundled font for "${fontFamily}"`)
    await loadFontFaceFromUrl(fontFamily, url)
  }

  if (fontUrlResolver) {
    try {
      const resolved = fontUrlResolver(fontFamily)
      if (resolved) await loadFontFaceFromUrl(fontFamily, resolved)
      else await tryLoadBundled()
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      warnFontLoad(`Custom font load failed for "${fontFamily}": ${detail}`)
      try {
        await tryLoadBundled()
      } catch (bundledError: unknown) {
        const bundledDetail = bundledError instanceof Error ? bundledError.message : String(bundledError)
        warnFontLoad(`Bundled font load failed for "${fontFamily}": ${bundledDetail}`)
      }
    }
  } else {
    try {
      await tryLoadBundled()
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      warnFontLoad(`Bundled font load failed for "${fontFamily}": ${detail}`)
    }
  }

  loadedFonts.add(fontFamily)
}

/** @internal Clears loaded-font bookkeeping (for unit tests). */
export function resetSignatureFontCache(): void {
  loadedFonts.clear()
}
