export interface SignatureFontWarning {
  code: string
  message: string
}

export interface ESigningConfig {
  /** PDF.js worker script URL (e.g. self-hosted `/pdf.worker.min.mjs`). When unset, `PdfViewer` does not set `GlobalWorkerOptions.workerSrc`. */
  pdfWorkerSrc?: string
  /** `network`: fetch Google Fonts when loading typed signature fonts (default). `local-only`: no fetches; browser uses available/system fonts. */
  fontMode?: 'network' | 'local-only'
  /** Return a woff/woff2 URL for a font family, or `null` to fall back to Google Fonts (when `fontMode` is `network`). */
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
