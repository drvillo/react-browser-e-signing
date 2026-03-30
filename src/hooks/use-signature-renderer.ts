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
  context.font = `${fontSize}px "${fontFamily}"`
  const metrics = context.measureText(signerName)

  canvas.width = Math.max(240, Math.ceil(metrics.width + padding * 2))
  canvas.height = 100

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.font = `${fontSize}px "${fontFamily}"`
  context.fillStyle = '#111827'
  context.textBaseline = 'middle'
  context.fillText(signerName, padding, canvas.height / 2)

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
