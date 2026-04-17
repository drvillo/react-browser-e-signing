import { pdfjs } from 'react-pdf'

export interface SignatureFontWarning {
  code: string
  message: string
}

export interface ESigningConfig {
  /** PDF.js worker script URL (e.g. self-hosted `/pdf.worker.min.mjs`). When set via `configure`, applied synchronously to `pdfjs.GlobalWorkerOptions.workerSrc`. */
  pdfWorkerSrc?: string
  /**
   * `bundled` (default): load Latin woff2 files shipped with the package (no remote fetch).
   * `local-only`: do not register `@font-face`; the browser uses installed/system fonts only.
   * `network`: deprecated; treated the same as `bundled`.
   */
  fontMode?: 'bundled' | 'local-only' | 'network'
  /** Return a woff/woff2 URL for a font family, or `null` to use the bundled file for that family (when `fontMode` is bundled). */
  fontUrlResolver?: (fontFamily: string) => string | null
  /** Non-throwing callback for recoverable issues (font/worker setup). */
  onWarning?: (warning: SignatureFontWarning) => void
}

let _config: ESigningConfig = {}
let _appliedWorkerSrc: string | null = null

/**
 * Apply a workerSrc to `pdfjs.GlobalWorkerOptions` synchronously.
 *
 * Safe to call repeatedly: a per-module guard skips redundant writes.
 * No-op during SSR. Failures are reported via `onWarning` instead of throwing,
 * since some pdfjs builds may seal `GlobalWorkerOptions`.
 */
export function setPdfWorkerSrc(src: string | undefined): void {
  if (!src) return
  if (typeof window === 'undefined') return
  if (_appliedWorkerSrc === src) return
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = src
    _appliedWorkerSrc = src
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to set pdfjs.GlobalWorkerOptions.workerSrc'
    _config.onWarning?.({ code: 'WORKER_SETUP_FAILED', message })
  }
}

export function configure(options: ESigningConfig): void {
  _config = { ..._config, ...options }
  if (options.pdfWorkerSrc) setPdfWorkerSrc(options.pdfWorkerSrc)
}

export function getConfig(): Readonly<ESigningConfig> {
  return _config
}

/** @internal Reset for tests */
export function resetConfig(): void {
  _config = {}
  _appliedWorkerSrc = null
}
