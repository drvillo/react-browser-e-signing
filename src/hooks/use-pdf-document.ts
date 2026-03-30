import { useEffect, useMemo, useState } from 'react'
import type { PdfPageDimensions } from '../types'

export type PdfInput = File | Blob | ArrayBuffer | Uint8Array | null

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer
}

function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}

async function convertPdfInputToArrayBuffer(pdfInput: Exclude<PdfInput, null>): Promise<ArrayBuffer> {
  if (isArrayBuffer(pdfInput)) return pdfInput
  if (isUint8Array(pdfInput)) {
    const copy = new Uint8Array(pdfInput.byteLength)
    copy.set(pdfInput)
    return copy.buffer
  }
  return pdfInput.arrayBuffer()
}

export function usePdfDocument(pdfInput: PdfInput) {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [pageDimensions, setPageDimensions] = useState<PdfPageDimensions[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!pdfInput) {
      setPdfData(null)
      setNumPages(0)
      setPageDimensions([])
      setErrorMessage(null)
      return
    }

    let isMounted = true

    setIsLoading(true)
    setErrorMessage(null)
    convertPdfInputToArrayBuffer(pdfInput)
      .then((arrayBuffer) => {
        if (!isMounted) return
        setPdfData(arrayBuffer)
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        const message = error instanceof Error ? error.message : 'Unable to read PDF data'
        setErrorMessage(message)
        setPdfData(null)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [pdfInput])

  function handleDocumentLoadSuccess(loadedPages: number): void {
    setNumPages(loadedPages)
    setPageDimensions((previousDimensions) =>
      previousDimensions
        .filter((dimension) => dimension.pageIndex < loadedPages)
        .sort((left, right) => left.pageIndex - right.pageIndex)
    )
  }

  function setPageDimension(pageIndex: number, widthPt: number, heightPt: number): void {
    setPageDimensions((previousDimensions) => {
      const nextDimensions = previousDimensions.filter((entry) => entry.pageIndex !== pageIndex)
      nextDimensions.push({ pageIndex, widthPt, heightPt })
      nextDimensions.sort((left, right) => left.pageIndex - right.pageIndex)
      return nextDimensions
    })
  }

  const hasPdf = useMemo(() => pdfData !== null, [pdfData])

  return {
    pdfData,
    numPages,
    scale,
    setScale,
    pageDimensions,
    setPageDimension,
    handleDocumentLoadSuccess,
    hasPdf,
    isLoading,
    errorMessage,
  }
}
