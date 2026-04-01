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

function buildGoogleFontsCssUrl(family: string): string {
  const encoded = family.trim().replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`
}

async function loadCssFromGoogleFonts(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Unable to load font css from ${url}`)
  return response.text()
}

function extractFontSource(cssText: string): string | null {
  const sourceMatch = cssText.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?([^'")]+)['"]?\)/i)
  if (!sourceMatch) return null
  return sourceMatch[1].replace(/['"]/g, '')
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

  const { fontMode = 'network', fontUrlResolver } = getConfig()

  if (fontMode === 'local-only') {
    loadedFonts.add(fontFamily)
    return
  }

  const tryLoadFromGoogle = async (): Promise<void> => {
    try {
      const cssUrl = buildGoogleFontsCssUrl(fontFamily)
      const cssText = await loadCssFromGoogleFonts(cssUrl)
      const fontSource = extractFontSource(cssText)
      if (!fontSource) throw new Error(`Unable to extract font source for ${fontFamily}`)
      await loadFontFaceFromUrl(fontFamily, fontSource)
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      warnFontLoad(`Google Fonts load failed for "${fontFamily}": ${detail}`)
    }
  }

  if (fontUrlResolver) {
    try {
      const resolved = fontUrlResolver(fontFamily)
      if (resolved) await loadFontFaceFromUrl(fontFamily, resolved)
      else await tryLoadFromGoogle()
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      warnFontLoad(`Custom font load failed for "${fontFamily}": ${detail}`)
      await tryLoadFromGoogle()
    }
  } else await tryLoadFromGoogle()

  loadedFonts.add(fontFamily)
}

/** @internal Clears loaded-font bookkeeping (for unit tests). */
export function resetSignatureFontCache(): void {
  loadedFonts.clear()
}

export function buildSignatureFontCssUrl(fontFamily: string): string {
  return buildGoogleFontsCssUrl(fontFamily)
}
