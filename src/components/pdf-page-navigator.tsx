import { cn } from '../lib/cn'

interface PdfPageNavigatorProps {
  currentPageIndex: number
  numPages: number
  onPageChange: (pageIndex: number) => void
  className?: string
}

function clampPageIndex(pageIndex: number, numPages: number): number {
  if (numPages <= 0) return 0
  if (pageIndex < 0) return 0
  if (pageIndex > numPages - 1) return numPages - 1
  return pageIndex
}

export function PdfPageNavigator({ currentPageIndex, numPages, onPageChange, className }: PdfPageNavigatorProps) {
  const resolvedPageIndex = clampPageIndex(currentPageIndex, numPages)
  const isEmpty = numPages <= 0

  function handlePreviousPage(): void {
    if (isEmpty) return
    onPageChange(clampPageIndex(resolvedPageIndex - 1, numPages))
  }

  function handleNextPage(): void {
    if (isEmpty) return
    onPageChange(clampPageIndex(resolvedPageIndex + 1, numPages))
  }

  return (
    <div data-slot="pdf-page-navigator" className={cn(className)}>
      <button
        type="button"
        data-slot="pdf-page-navigator-button"
        disabled={isEmpty || resolvedPageIndex <= 0}
        onClick={handlePreviousPage}
        aria-label="Previous page"
      >
        &lt;
      </button>
      <span data-slot="pdf-page-navigator-label">
        {isEmpty ? '0 / 0' : `${resolvedPageIndex + 1} / ${numPages}`}
      </span>
      <button
        type="button"
        data-slot="pdf-page-navigator-button"
        disabled={isEmpty || resolvedPageIndex >= numPages - 1}
        onClick={handleNextPage}
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  )
}
