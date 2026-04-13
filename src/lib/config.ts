export interface SignatureFontWarning {
  code: string
  message: string
}

export interface ESigningConfig {
  /** PDF.js worker script URL (e.g. self-hosted `/pdf.worker.min.mjs`). When unset, `PdfViewer` does not set `GlobalWorkerOptions.workerSrc`. */
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

export function configure(options: ESigningConfig): void {
  _config = { ..._config, ...options }
}

export function getConfig(): Readonly<ESigningConfig> {
  return _config
}

/** @internal Reset for tests */
export function resetConfig(): void {
  _config = {}
}
