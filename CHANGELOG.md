# Changelog

## 0.4.1

### Changed

- **Typed signature fonts:** Latin **woff2** files for `SIGNATURE_FONTS` are **bundled** in the published package (`dist/fonts/`, copied from devDependency `@fontsource/*` at build). `loadSignatureFont` no longer fetches Google Fonts at runtime. `fontMode` defaults to bundled behavior; use `'local-only'` to skip registering those faces. The value `'network'` is deprecated and treated like `'bundled'`.
- **`fontUrlResolver`:** returning `null` falls back to the **bundled** file for that family (not Google Fonts).

### Added

- Package export `./fonts/*` pointing at `dist/fonts/*` for advanced bundler setups.
- **`scripts/sync-fonts-to-src.mjs`:** copies the same woff2 files into `src/lib/fonts/` (gitignored). `pnpm demo` / `pnpm demo:build` run this before Vite so the demo — which imports from `src/` — resolves `./fonts/*.woff2` next to `signature-fonts.ts` via `import.meta.url`.

### Fixed

- **Demo:** typed signature font selection had no effect when font files were missing beside `signature-fonts.ts` during dev (all faces fell back identically).

## 0.3.0

### Added

- **`usePdfPageVisibility`:** IntersectionObserver-based hook for current/visible page indices and `scrollToPage(pageIndex)`.
- **`PdfPageNavigator`:** Prev/next + page label controls (slot-styled).
- **`PdfViewer`:** `pageMode: 'scroll' | 'single'` and `currentPageIndex` for single-page rendering; `renderToolbarContent` for composable toolbar injection.
- **Slots/styles:** `pdf-viewer-toolbar-content`, `pdf-page-navigator*` in `SLOTS` and default `styles.css`.
- **`INTEGRATION_GUIDELINES.md`:** Agent-oriented integration reference (included in published package).

### Changed

- Demo: sticky sidebar, toolbar placement controls, responsive scroll/single mode, and UX Controls Lab toggles.

## 0.2.0

### Added

- **Bundled PDF.js worker:** `pdf.worker.min.mjs` is shipped under `dist/` and included in the published package (same `pdfjs-dist` build as `react-pdf`).
- **`getPdfWorkerSrc()`** via subpath export `@drvillo/react-browser-e-signing/worker` — returns a bundler-safe URL using `new URL('./pdf.worker.min.mjs', import.meta.url)`.
- Subpath export `./pdf.worker.min.mjs` for direct raw-file access (e.g. `?url` imports).
- `verify:worker` script and `prepublishOnly` hook to assert the worker exists and `devDependency` `pdfjs-dist` matches `react-pdf`’s `pdfjs-dist` version.
- Build copies assets after tsup (`scripts/copy-dist-assets.mjs`) so `dist/worker.d.mts` and `pdf.worker.min.mjs` are present in the tarball; demo runs `sync-worker-to-dev.mjs` before Vite so `worker/pdf.worker.min.mjs` sits next to `worker/index.mjs` locally.

### Changed

- README: bundled worker is the primary integration path; CSP, versioning, SSR/Next.js, manual copy fallback, and advanced `?url` import documented.

### Notes

- **Non-breaking:** `configure()` without `pdfWorkerSrc` still does not inject a worker URL; consumers must opt in via `getPdfWorkerSrc()` or another URL.

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
