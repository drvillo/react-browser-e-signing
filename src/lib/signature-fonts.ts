const loadedFonts = new Set<string>()

export const SIGNATURE_FONTS = ['Dancing Script', 'Great Vibes', 'Sacramento', 'Alex Brush'] as const

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

export async function loadSignatureFont(fontFamily: string): Promise<void> {
  if (loadedFonts.has(fontFamily)) return
  if (typeof document === 'undefined') return
  if (typeof FontFace === 'undefined') return

  const cssUrl = buildGoogleFontsCssUrl(fontFamily)
  const cssText = await loadCssFromGoogleFonts(cssUrl)
  const fontSource = extractFontSource(cssText)
  if (!fontSource) throw new Error(`Unable to extract font source for ${fontFamily}`)

  const fontFace = new FontFace(fontFamily, `url(${fontSource})`)
  await fontFace.load()
  const fontSet = document.fonts as unknown as { add: (font: FontFace) => void }
  fontSet.add(fontFace)
  loadedFonts.add(fontFamily)
}

export function buildSignatureFontCssUrl(fontFamily: string): string {
  return buildGoogleFontsCssUrl(fontFamily)
}
