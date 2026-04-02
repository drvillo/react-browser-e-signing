import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'

export interface UsePdfPageVisibilityOptions {
  /** Ref to the element containing the pdf-viewer pages stack or its parent container. */
  containerRef: RefObject<HTMLElement | null>
  numPages: number
  /** IntersectionObserver threshold (0-1). Defaults to 0.5. */
  threshold?: number
}

export interface UsePdfPageVisibilityReturn {
  /** 0-based index of the most visible page. */
  currentPageIndex: number
  /** All currently visible page indices, sorted ascending. */
  visiblePageIndices: number[]
  /** Scroll a page element into view. */
  scrollToPage: (pageIndex: number) => void
}

const PAGE_SLOT_SELECTOR = '[data-slot="pdf-viewer-page"]'

function clampPageIndex(pageIndex: number, numPages: number): number {
  if (numPages <= 0) return 0
  if (pageIndex < 0) return 0
  if (pageIndex > numPages - 1) return numPages - 1
  return pageIndex
}

export function usePdfPageVisibility({
  containerRef,
  numPages,
  threshold = 0.5,
}: UsePdfPageVisibilityOptions): UsePdfPageVisibilityReturn {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [visiblePageIndices, setVisiblePageIndices] = useState<number[]>([])

  const resolvedThreshold = useMemo(() => {
    if (Number.isNaN(threshold)) return 0.5
    if (threshold < 0) return 0
    if (threshold > 1) return 1
    return threshold
  }, [threshold])

  const scrollToPage = useCallback(
    (pageIndex: number) => {
      const container = containerRef.current
      if (!container || numPages <= 0) return
      const clampedIndex = clampPageIndex(pageIndex, numPages)
      const pages = container.querySelectorAll<HTMLElement>(PAGE_SLOT_SELECTOR)
      const pageElement = pages.item(clampedIndex)
      if (!pageElement) return
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [containerRef, numPages]
  )

  useEffect(() => {
    if (numPages <= 0) {
      setCurrentPageIndex(0)
      setVisiblePageIndices([])
      return
    }

    const container = containerRef.current
    if (!container) return
    const pages = Array.from(container.querySelectorAll<HTMLElement>(PAGE_SLOT_SELECTOR))
    if (!pages.length) return

    if (typeof IntersectionObserver !== 'function') {
      setCurrentPageIndex(0)
      setVisiblePageIndices([0])
      return
    }

    const ratioByIndex = new Map<number, number>()
    for (let index = 0; index < pages.length; index += 1) ratioByIndex.set(index, 0)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = pages.indexOf(entry.target as HTMLElement)
          if (index < 0) continue
          ratioByIndex.set(index, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        const nextVisible = Array.from(ratioByIndex.entries())
          .filter(([, ratio]) => ratio > 0)
          .map(([index]) => index)
          .sort((a, b) => a - b)
        setVisiblePageIndices(nextVisible)

        let maxRatio = -1
        let mostVisibleIndex = 0
        for (const [index, ratio] of ratioByIndex.entries()) {
          if (ratio > maxRatio) {
            maxRatio = ratio
            mostVisibleIndex = index
          }
        }

        setCurrentPageIndex(clampPageIndex(mostVisibleIndex, numPages))
      },
      { threshold: [0, resolvedThreshold, 1] }
    )

    for (const pageElement of pages) observer.observe(pageElement)

    return () => {
      observer.disconnect()
    }
  }, [containerRef, numPages, resolvedThreshold])

  return {
    currentPageIndex: clampPageIndex(currentPageIndex, numPages),
    visiblePageIndices,
    scrollToPage,
  }
}
