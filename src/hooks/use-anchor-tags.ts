import { useEffect, useRef, useState } from 'react'
import type { FieldPlacement } from '../types'

const ANCHOR_TAG_REGEX = /\{\{\s*(\w+)\s*\}\}/g

interface TextItemWithBounds {
  str: string
  transform: number[]
  width: number
  height: number
}

interface AnchorTagMatch {
  label: string
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

function buildFieldId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `anchor-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function matchToFieldPlacement(match: AnchorTagMatch, locked: boolean): FieldPlacement {
  const xPercent = (match.x / match.pageWidth) * 100
  const yPercent = ((match.pageHeight - match.y - match.height) / match.pageHeight) * 100
  const widthPercent = (match.width / match.pageWidth) * 100
  const heightPercent = (match.height / match.pageHeight) * 100

  return {
    id: buildFieldId(),
    type: 'custom',
    pageIndex: match.pageIndex,
    xPercent,
    yPercent,
    widthPercent,
    heightPercent,
    locked,
    label: match.label,
  }
}

/**
 * Pure function that scans PDF text content items for `{{ fieldName }}` anchor tags
 * and returns FieldPlacement objects. This does not depend on React.
 */
export async function scanAnchorTags(
  pdfData: ArrayBuffer,
  options?: { locked?: boolean }
): Promise<FieldPlacement[]> {
  const locked = options?.locked ?? true
  const pdfjsLib = await import('pdfjs-dist')
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise
  const matches: AnchorTagMatch[] = []

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const pdfPage = await pdfDocument.getPage(pageNum)
    const viewport = pdfPage.getViewport({ scale: 1 })
    const textContent = await pdfPage.getTextContent()
    const pageIndex = pageNum - 1

    for (const rawItem of textContent.items) {
      const item = rawItem as TextItemWithBounds
      if (!item.str) continue

      ANCHOR_TAG_REGEX.lastIndex = 0
      let regexMatch: RegExpExecArray | null

      while ((regexMatch = ANCHOR_TAG_REGEX.exec(item.str)) !== null) {
        const label = regexMatch[1].trim()
        if (!label) continue

        const transform = item.transform
        const x = transform[4]
        const y = transform[5]
        const height = item.height || Math.abs(transform[3]) || 12
        const width = item.width || height * label.length * 0.6

        matches.push({
          label,
          pageIndex,
          x,
          y,
          width,
          height,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
        })
      }
    }
  }

  return matches.map((m) => matchToFieldPlacement(m, locked))
}

export interface UseAnchorTagsOptions {
  locked?: boolean
}

export interface UseAnchorTagsReturn {
  fields: FieldPlacement[]
  isScanning: boolean
  error: string | null
}

/**
 * React hook that scans PDF data for `{{ fieldName }}` anchor tags and returns
 * FieldPlacement objects for use with useFieldPlacement.
 */
export function useAnchorTags(
  pdfData: ArrayBuffer | null,
  options?: UseAnchorTagsOptions
): UseAnchorTagsReturn {
  const [fields, setFields] = useState<FieldPlacement[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousDataRef = useRef<ArrayBuffer | null>(null)

  useEffect(() => {
    if (pdfData === previousDataRef.current) return
    previousDataRef.current = pdfData

    if (!pdfData) {
      setFields([])
      setIsScanning(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsScanning(true)
    setError(null)

    scanAnchorTags(pdfData, { locked: options?.locked ?? true })
      .then((result) => {
        if (cancelled) return
        setFields(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Text layer unavailable'
        setError(message)
        setFields([])
      })
      .finally(() => {
        if (cancelled) return
        setIsScanning(false)
      })

    return () => {
      cancelled = true
    }
  }, [pdfData, options?.locked])

  return { fields, isScanning, error }
}
