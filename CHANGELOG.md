# Changelog

## 0.1.3

### Changed

- **PDF worker:** removed hardcoded unpkg CDN URL. Worker source is now configurable via `configure({ pdfWorkerSrc })` or `<PdfViewer workerSrc />`. When unset, the package does not inject a worker URL (no mandatory third-party fetch).
- **Signature fonts:** `fontMode` supports `'network'` (default, Google Fonts) and `'local-only'` (no fetches; browser uses available/system fonts). Google Fonts loading is wrapped in try/catch; failures call `onWarning` and degrade without throwing.
- **Typed signatures:** `useSignatureRenderer` still produces a PNG when font loading fails (fallback font rendering).

### Added

- `configure()` for global package options (`pdfWorkerSrc`, `fontMode`, `fontUrlResolver`, `onWarning`).
- `ESigningConfig` and `SignatureFontWarning` type exports.
- `PdfViewer` prop `workerSrc` for per-instance worker URL override.
- README **Production hardening** section (self-hosted worker, CSP, local-only fonts, migration from previous defaults).
