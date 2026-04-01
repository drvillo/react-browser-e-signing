export function getPdfWorkerSrc() {
  return new URL('./pdf.worker.min.mjs', import.meta.url).href
}
