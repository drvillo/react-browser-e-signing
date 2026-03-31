import { useEffect, useMemo, useState } from 'react'
import { loadSignatureFont } from '../lib/signature-fonts'
import type { SignatureStyle } from '../types'

interface UseSignatureRendererInput {
  signerName: string
  style: SignatureStyle
}

function buildCanvas(): HTMLCanvasElement {
  return document.createElement('canvas')
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface GlyphLayout {
  char: string
  width: number
  rotation: number
  gapAfter: number
}

function layoutTypedGlyphs({
  signerName,
  fontFamily,
  fontSize,
  context,
}: {
  signerName: string
  fontFamily: string
  fontSize: number
  context: CanvasRenderingContext2D
}): GlyphLayout[] {
  const rng = mulberry32(hashString(`${signerName}\0${fontFamily}`))
  context.font = `${fontSize}px "${fontFamily}"`
  const chars = Array.from(signerName)
  const layouts: GlyphLayout[] = []
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const width = context.measureText(char).width
    const rotation = (rng() * 2 - 1) * 0.07
    const gapAfter = i < chars.length - 1 ? (rng() * 2 - 1) * 1.25 : 0
    layouts.push({ char, width, rotation, gapAfter })
  }
  return layouts
}

function drawTypedSignature({
  signerName,
  fontFamily,
}: {
  signerName: string
  fontFamily: string
}): string {
  const canvas = buildCanvas()
  const context = canvas.getContext('2d')
  if (!context) return ''

  const padding = 16
  const fontSize = 56
  const baselineY = 50

  const glyphs = layoutTypedGlyphs({ signerName, fontFamily, fontSize, context })
  const textWidth = glyphs.reduce((sum, g) => sum + g.width + g.gapAfter, 0)

  canvas.width = Math.max(240, Math.ceil(textWidth + padding * 2))
  canvas.height = 100

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.font = `${fontSize}px "${fontFamily}"`
  context.fillStyle = '#111827'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  let x = padding
  for (const glyph of glyphs) {
    const { char, width, rotation, gapAfter } = glyph
    const cx = x + width / 2
    context.save()
    context.translate(cx, baselineY)
    context.rotate(rotation)
    context.fillText(char, 0, 0)
    context.restore()
    x += width + gapAfter
  }

  return canvas.toDataURL('image/png')
}

export function useSignatureRenderer({ signerName, style }: UseSignatureRendererInput) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  const normalizedName = useMemo(() => signerName.trim(), [signerName])

  useEffect(() => {
    if (!normalizedName) {
      setSignatureDataUrl(null)
      return
    }

    if (style.mode === 'drawn') {
      setSignatureDataUrl(style.dataUrl || null)
      return
    }

    let isActive = true
    setIsRendering(true)

    loadSignatureFont(style.fontFamily)
      .then(() => {
        if (!isActive) return
        const dataUrl = drawTypedSignature({ signerName: normalizedName, fontFamily: style.fontFamily })
        setSignatureDataUrl(dataUrl || null)
      })
      .catch(() => {
        if (!isActive) return
        setSignatureDataUrl(null)
      })
      .finally(() => {
        if (!isActive) return
        setIsRendering(false)
      })

    return () => {
      isActive = false
    }
  }, [normalizedName, style])

  return {
    signatureDataUrl,
    isRendering,
  }
}
