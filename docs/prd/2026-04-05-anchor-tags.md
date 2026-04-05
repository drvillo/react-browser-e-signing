# PRD: Anchor Tags & Custom Fields

## 1. Context

### Problem

Users of this library who want to sign PDFs typically create their document templates in Word or Google Docs. To leave space for signature fields they must manually insert blank lines or white space, then export to PDF and upload. This workflow is error-prone (fields may not align with the blank areas) and requires the template author to understand the signing library's coordinate-based field placement model.

The industry standard solution (used by DocuSign, HelloSign/Dropbox Sign, BoldSign, OneSpan) is **anchor tags**: text markers embedded in the source document that the signing platform detects and replaces with form fields automatically.

### Why now

The library already supports locked `initialFields` for template mode, coordinate-based field placement, and PDF.js-powered rendering. Adding anchor tag scanning is a natural extension that bridges the gap between document authoring and field placement without requiring PDF content editing or reflow — techniques that are disproportionately complex and fragile.

### Assumptions

- PDF.js `page.getTextContent()` provides reliable text items with bounding box data for text-based (non-scanned) PDFs.
- The `{{ fieldName }}` marker syntax is sufficient for the target use cases; no structured attribute syntax (e.g., signer assignment, validation rules) is needed in v1.
- Anchor tags always produce custom text fields. The four built-in types (`signature`, `fullName`, `title`, `date`) remain manually placed.
- Anchor-tag fields are always positionally locked (the document author controls placement).

## 2. Goals

- Allow document authors to embed `{{ fieldName }}` markers in source documents so that fields are auto-created when the PDF is loaded.
- Introduce a `custom` field type for arbitrary signer-supplied text, extending the existing four built-in types.
- Provide both a hook and an optional UI component so clients can surface custom-field inputs with minimal code.
- Erase anchor tag text in the exported PDF by drawing a white rectangle before stamping the field value.
- Expose per-field vertical position metadata so clients can build "scroll to next field" UX.

### Non-goals

- Structured anchor syntax (signer roles, validation, required/optional) — deferred to a future iteration.
- Support for non-text-based (scanned/image) PDFs.
- Built-in field types via anchor tags (e.g., `{{ signature }}` creating a signature field).
- PDF content reflow or text editing.
- Configurable tag delimiters (only `{{ }}` is supported).

## 3. Users & Use Cases

### Personas

- **Template Author**: Creates contract/agreement templates in Word, Google Docs, or any tool that exports PDF. Embeds `{{ fieldName }}` markers where signer input is needed.
- **Integrator (Developer)**: Consumes the library to build a signing UI. Wants anchor-tag fields to appear automatically with minimal wiring.
- **Signer**: Fills in fields and signs. Should never see raw `{{ }}` markers.

### User stories

1. As a **template author**, I add `{{ companyName }}` and `{{ agreementDate }}` in my Word document, export to PDF, and upload. The signing UI shows labelled text fields for "companyName" and "agreementDate" at the correct positions.
2. As a **developer**, I call `useAnchorTags(pdfData)` and get back a list of detected fields with positions. I pass them as `initialFields` to `useFieldPlacement` and the overlay renders them automatically.
3. As a **developer**, I optionally render `<CustomFieldInputs>` in my sidebar, and the signer sees text inputs for each custom field alongside the existing signer details.
4. As a **signer**, I see labelled fields on the PDF at the positions the template author intended, fill them in, and sign. The exported PDF has my values stamped cleanly over the original marker text.
5. As a **developer**, I read `field.yPercent` and `field.pageIndex` from the field list to implement a "next field" button that scrolls to the next unfilled field.

## 4. Functional requirements

### 4.1 Anchor tag scanning

1. **Must** provide a new hook `useAnchorTags(pdfData, options?)` that extracts text content from each page using PDF.js `page.getTextContent()`, scans for `{{ fieldName }}` patterns, and returns a list of `FieldPlacement` objects.
2. **Must** use strict `{{ fieldName }}` syntax: double curly braces, field name trimmed of surrounding whitespace, case-preserved.
3. **Must** handle multi-page documents — scan all pages and return fields with correct `pageIndex`.
4. **Must** compute each field's position (`xPercent`, `yPercent`, `widthPercent`, `heightPercent`) from the text item's bounding box as reported by PDF.js, converted to percent-of-page coordinates.
5. **Must** return a stable result (same PDF bytes produce the same field list, same order).
6. **Should** deduplicate: if the same `{{ fieldName }}` appears multiple times, each occurrence creates a separate field but they share the same `label`.
7. **Should** expose scanning state: `{ fields, isScanning, error }`.
8. **Must** gracefully handle PDFs with no anchor tags (return empty array, no error).
9. **Should** gracefully handle PDFs where text extraction fails (scanned docs, encrypted) — return empty array and surface a non-fatal warning.

### 4.2 Custom field type

10. **Must** extend `FieldType` to include `'custom'`.
11. **Must** extend `FieldPlacement` with an optional `label?: string` property. Anchor-tag fields use this for their display name (the text inside `{{ }}`).
12. **Must** extend `SignerInfo` with `customFields?: Record<string, string>` where keys correspond to field labels and values are signer-supplied text.
13. **Must** set `locked: true` on all anchor-tag-generated fields.

### 4.3 Custom field inputs (optional UI component)

14. **Should** export a new `CustomFieldInputs` component that accepts the list of detected custom field labels and renders a text input for each, wired to `SignerInfo.customFields`.
15. **Should** group these inputs logically (either within `SignerDetailsPanel` or as a sibling component).
16. **Must** remain style-agnostic (use `data-slot` attributes, no hard-coded styles beyond the demo theme).

### 4.4 PDF export (modifyPdf)

17. **Must** handle `field.type === 'custom'`: resolve the text value from `signer.customFields[field.label]`.
18. **Must** draw a white filled rectangle covering the anchor tag's bounding box **before** drawing the field value text on top — so the original `{{ fieldName }}` text is fully erased in the output PDF.
19. **Should** use the same Helvetica font and sizing logic as existing text fields.

### 4.5 Field position metadata

20. **Must** ensure `FieldPlacement` objects returned by `useAnchorTags` include accurate `pageIndex`, `xPercent`, `yPercent` so clients can compute scroll targets.
21. **Should** document how to use `scrollToPage` from `usePdfPageVisibility` combined with field `yPercent` for "scroll to next field" UX.

### 4.6 Demo integration

22. **Must** update the demo `App.tsx` to demonstrate anchor tag detection when a PDF with `{{ }}` markers is uploaded.
23. **Must** show custom field inputs in the demo sidebar (using the new component or manual wiring).
24. **Should** add a "Next field" button to the demo that scrolls to the next unfilled field.

## 5. User experience

### Key flows

- **Template author flow**: Author types `{{ clientName }}` in Word -> exports PDF -> uploads in the signing app -> sees a locked "clientName" field at the correct position -> signer fills in "Acme Corp" in the sidebar -> signs -> exported PDF shows "Acme Corp" where `{{ clientName }}` was.
- **No-anchor flow (unchanged)**: Author uploads a plain PDF -> manually places fields via FieldPalette -> signs as before. Zero regression.
- **Mixed flow**: A PDF with some `{{ }}` markers also allows manual placement of built-in fields (signature, date, etc.) alongside the auto-detected custom fields.

### Edge cases

- Anchor tag text spans a line break (PDF.js may split it into multiple text items) — scanner should attempt to join adjacent items or skip unrecognizable fragments with a warning.
- Very long field names (`{{ thisIsAnExtremelyLongFieldNameThatExceedsReasonableBounds }}`) — truncate label display in UI, preserve full name in data.
- Duplicate field names (`{{ amount }}` appearing twice on the same page) — both get fields; both share the same signer input value; both render the same value at export.
- PDF with `{{ }}` inside actual content (e.g., mustache template documentation) — accepted risk in v1; the strict syntax minimizes false positives.
- Empty field name `{{ }}` — skip, do not create a field.

### Error states

- PDF text extraction fails entirely: `useAnchorTags` returns `{ fields: [], isScanning: false, error: 'Text layer unavailable' }`. The UI proceeds without anchor fields.
- No anchor tags found: not an error. `fields` is `[]`.

### Accessibility

- Custom field inputs must have associated `<label>` elements.
- Locked anchor-tag fields should have `aria-readonly="true"` in their overlay.

## 6. Technical considerations

### Proposed approach (high level)

```
PDF bytes
  |
  v
useAnchorTags(pdfData)
  |  internally: pdfjs.getDocument(pdfData) -> for each page: page.getTextContent()
  |  regex scan for /\{\{\s*(\w+)\s*\}\}/g on concatenated text items
  |  map matched text item bounds to FieldPlacement (percent coordinates)
  |
  v
FieldPlacement[] (type: 'custom', label: 'ABC', locked: true, pageIndex, x/y/w/h %)
  |
  v
useFieldPlacement({ initialFields: anchorFields })
  |
  v
FieldOverlay renders locked custom fields alongside any manual fields
  |
  v
modifyPdf() at export: for custom fields, draw white rect + text value
```

### Data / schema changes

**`types.ts`**:
- `FieldType`: add `'custom'` to the union.
- `FieldPlacement`: add optional `label?: string`.
- `SignerInfo`: add optional `customFields?: Record<string, string>`.

**New file**: `src/hooks/use-anchor-tags.ts` — the scanning hook.

**New file**: `src/components/custom-field-inputs.tsx` — optional UI component.

**Modified**: `src/lib/pdf-modifier.ts` — handle `type === 'custom'`, draw white rect erasure.

**Modified**: `src/components/signature-field.tsx` — render label for custom fields.

**Modified**: `src/components/field-palette.tsx` — no change needed (custom fields are not manually placeable via palette).

**Modified**: `demo/App.tsx` — integrate `useAnchorTags`, render `CustomFieldInputs`, add "next field" button.

### API changes / contracts

New public exports from `src/index.ts`:
- `useAnchorTags` (hook)
- `CustomFieldInputs` (component)
- Updated type exports: `FieldType` now includes `'custom'`, `FieldPlacement` has `label`, `SignerInfo` has `customFields`

No breaking changes to existing API surface. Existing consumers who don't use anchor tags see no behavioral change.

### INTEGRATION_GUIDELINES.md updates

`INTEGRATION_GUIDELINES.md` is the single source of truth for the library's public API surface, composition patterns, and consumer wiring. It **must** be updated as part of this feature to remain accurate. Specific changes:

**Section 2.2 Hooks** — add the `useAnchorTags` hook signature:

```ts
function useAnchorTags(
  pdfData: ArrayBuffer | null,
  options?: { locked?: boolean }
): {
  fields: FieldPlacement[]
  isScanning: boolean
  error: string | null
}
```

**Section 2.1 Components** — add the `CustomFieldInputs` component signature:

```ts
interface CustomFieldInputsProps {
  labels: string[]
  values: Record<string, string>
  onValuesChange: (nextValues: Record<string, string>) => void
  className?: string
}
```

**Section 2.3 Types** — update the type definitions:
- `FieldType`: change to `'signature' | 'fullName' | 'title' | 'date' | 'custom'`
- `FieldPlacement`: add `label?: string`
- `SignerInfo`: add `customFields?: Record<string, string>`
- `SignatureFieldPreview`: add `customFields?: Record<string, string>`

**Section 2.5 Constants** — add new SLOTS entries for custom field inputs (e.g., `customFieldInputs`, `customFieldInputsLabel`, `customFieldInputsInput`).

**Section 4** — add a new wiring example showing anchor tag integration:

```tsx
const { fields: anchorFields, isScanning } = useAnchorTags(pdfData)
const { fields, addField, updateField, removeField, clearFields } = useFieldPlacement({
  initialFields: anchorFields,
})
```

**Section 5** — add a new `PatternF_anchorTagTemplate` composition pattern showing the recommended integration: upload PDF with markers, auto-detect fields, render `CustomFieldInputs` alongside `SignerDetailsPanel`, and use field positions for scroll navigation.

**Section 6** — extend the field placement data flow to document the anchor tag path (PDF load -> text extraction -> regex scan -> auto-created locked fields) as an alternative to the manual palette-based flow.

**Section 8** — add a consumer responsibility note: when using anchor tags, the consumer must wire `useAnchorTags` results to `useFieldPlacement.initialFields` and manage custom field values via `SignerInfo.customFields`.

### Security / permissions

- PDF.js text extraction runs entirely in-browser. No data leaves the client.
- Anchor tag field names are user-controlled strings from the PDF. They must be treated as untrusted for display (no `dangerouslySetInnerHTML`). Standard React rendering handles this.

### Performance / scalability

- `page.getTextContent()` is called once per page on load. For a 100-page PDF this may take 1-2 seconds. The hook should be async with `isScanning` state.
- Text scanning is O(n) per page where n = text items. Regex matching on concatenated strings is lightweight.
- The hook should memoize results — re-scanning only when `pdfData` reference changes.

### Observability

- `useAnchorTags` returns `error` for failed extractions.
- The hook could optionally accept an `onWarning` callback for non-fatal issues (e.g., text items that look like partial anchor tags but couldn't be parsed).

## 7. Rollout plan

### Feature flagging

Not applicable — this is an additive library feature. Consumers opt in by calling `useAnchorTags`. Existing behavior is untouched.

### Migration / backfill

None. No existing data formats change. `FieldType = 'custom'` is additive to the union. `label` and `customFields` are optional properties.

### Staged rollout & rollback

1. Merge to `main` behind a minor version bump.
2. If issues arise, consumers stop calling `useAnchorTags`; no code removal needed.

## 8. Analytics & success metrics

### KPIs

- Number of anchor tags detected across test PDFs (validation of parser accuracy).
- Custom field coverage: all detected `{{ }}` markers produce correctly positioned fields.

### Guardrail metrics

- Zero regressions in existing field placement and PDF export tests.
- No performance degradation for PDFs without anchor tags (scanning should short-circuit quickly).

## 9. Testing plan

### Test fixtures

**New fixture**: `test/fixtures/synthetic-anchor-contract.ts` — extends the existing `createSyntheticContractPdf` pattern. Creates a multi-page PDF with `{{ fieldName }}` markers drawn at known coordinates using pdf-lib `drawText`. This fixture must:
- Include at least three anchor tags across two pages (e.g., `{{ companyName }}` and `{{ role }}` on page 1, `{{ agreementDate }}` on the signature page).
- Use known x/y/font-size values so tests can assert position accuracy.
- Include a page with zero anchor tags (to test selective scanning).
- Optionally include edge-case variants: `{{ }}` (empty), `{{   spacedName   }}` (extra whitespace), and regular text containing `{` or `}` that is not a valid anchor tag.

**Updated factory**: `test/helpers/field-factory.ts` — the `buildField` and `buildSigner` helpers must support the new `type: 'custom'`, `label`, and `customFields` properties.

### Unit tests

**New file: `test/unit/anchor-tags.test.ts`** — tests for the `scanAnchorTags` pure function (the non-React scanning logic extracted from `useAnchorTags`):

| Test case | Description |
|-----------|-------------|
| single tag on one page | `{{ companyName }}` at known coordinates produces one `FieldPlacement` with `type: 'custom'`, `label: 'companyName'`, `locked: true`, and correct `xPercent`/`yPercent`/`widthPercent`/`heightPercent` within tolerance |
| multiple tags on one page | Two tags produce two fields in document order |
| tags across pages | Tags on page 0 and page 1 have correct `pageIndex` values |
| extra whitespace | `{{   foo   }}` produces `label: 'foo'` |
| empty name skipped | `{{ }}` produces no field |
| nested braces | `{{{ foo }}}` — only the inner `{{ foo }}` match produces a field |
| no tags | Plain PDF returns empty array |
| duplicate labels | Two `{{ amount }}` tags produce two separate `FieldPlacement` objects with different ids but same label |
| position accuracy | Fields from the synthetic fixture with known coordinates match expected percent values within +/- 1% tolerance |
| stable ordering | Same PDF bytes produce the same field array on repeated calls |

**New file: `test/unit/use-anchor-tags.test.ts`** — React hook tests using `renderHook`:

| Test case | Description |
|-----------|-------------|
| returns fields when pdfData has tags | Hook returns correct `fields` array after scanning completes |
| isScanning lifecycle | `isScanning` is `true` during scan, `false` after |
| null pdfData returns empty | `useAnchorTags(null)` returns `{ fields: [], isScanning: false, error: null }` |
| error on corrupt data | Malformed PDF bytes produce `error` string, `fields: []` |
| re-scans on pdfData change | Changing `pdfData` triggers a new scan and returns updated fields |
| memoization | Same `pdfData` reference does not re-trigger scanning |

**Updated file: `test/unit/pdf-modifier.single-page.test.ts`** — add tests in a new `describe('modifyPdf custom fields')` block:

| Test case | Description |
|-----------|-------------|
| draws custom field value | A `type: 'custom'` field with `label: 'companyName'` and `signer.customFields.companyName = 'Acme Corp'` produces output text containing `'Acme Corp'` |
| erases anchor tag text | Output PDF for a custom field draws a white rectangle — verified by checking content stream operators for a filled rect (`re f`) before the text draw |
| missing custom field value | `signer.customFields` has no entry for the label — white rect is still drawn (erasing the marker), no text drawn |
| custom + built-in fields coexist | A mix of `signature`, `fullName`, `date`, and `custom` fields all render correctly in the same output |
| empty customFields map | `signer.customFields = {}` — custom fields get white rect erasure only, no crash |

**Updated file: `test/unit/field-placement.test.ts`** — add tests for custom field type:

| Test case | Description |
|-----------|-------------|
| addField with type custom | `addField({ type: 'custom', ... })` produces a field with `type: 'custom'` |
| initialFields with custom type | Custom fields passed as `initialFields` are preserved with `label` and `locked` |

**Existing tests (regression)**: all existing tests in `test/unit/pdf-modifier.single-page.test.ts`, `test/unit/pdf-modifier.multi-page.test.ts`, `test/unit/field-placement.test.ts`, `test/unit/coordinate-mapper.test.ts` must continue to pass without modification. The type extensions (`label?: string`, `customFields?: Record<string, string>`) are optional and backward-compatible.

### E2E tests (browser)

**Updated file: `test/browser/signing-e2e.test.tsx`** — add a new test case in the existing describe block:

| Test case | Description |
|-----------|-------------|
| anchor tag signing flow | Upload the synthetic anchor contract PDF -> verify custom field inputs appear in the sidebar -> fill `companyName` and `role` values -> place a manual signature field -> sign -> verify the output PDF contains the custom field values and a signature image, and does not contain raw `{{ }}` marker text |

This test follows the existing pattern: render `<App />`, upload via `page.getByLabelText('Upload PDF').upload(file)`, fill inputs, click sign, assert on the signed blob bytes.

### Test helpers updates

**`test/helpers/field-factory.ts`**:
- `buildField` must accept `type: 'custom'` and `label` in overrides, forwarding `label` to the output when present.
- `buildSigner` must accept `customFields` in overrides, forwarding it to the output when present.

**`test/helpers/pdf-helpers.ts`**:
- Add a `extractPageRects` helper (or extend `extractPageText`) to verify white rectangle drawing in the output content stream (look for `re f` operators in the content stream at expected coordinates).

### Acceptance criteria checklist

- [ ] `{{ fieldName }}` markers in uploaded PDFs produce locked custom fields at correct positions.
- [ ] Custom field inputs appear in the demo sidebar for each detected field.
- [ ] Exported PDF has field values stamped over erased anchor tag text.
- [ ] PDFs without anchor tags behave identically to current behavior.
- [ ] `useAnchorTags` hook is exported and documented.
- [ ] `CustomFieldInputs` component is exported and documented.
- [ ] All existing tests pass without modification.
- [ ] New tests cover scanning, positioning, export, and edge cases.
- [ ] `INTEGRATION_GUIDELINES.md` is updated with new hook, component, type, SLOTS, wiring, and composition pattern documentation.
- [ ] `test/helpers/field-factory.ts` supports `type: 'custom'`, `label`, and `customFields`.
- [ ] A synthetic anchor contract PDF fixture exists and is used by both unit and E2E tests.

## 10. Milestones

### M1: Core scanning (2-3 days)

- Implement `scanAnchorTags` pure function (PDF.js text extraction + regex + coordinate mapping).
- Implement `useAnchorTags` hook wrapping the scanner with React state.
- Create `test/fixtures/synthetic-anchor-contract.ts` fixture.
- Unit tests: `test/unit/anchor-tags.test.ts` (pure function) and `test/unit/use-anchor-tags.test.ts` (hook).

### M2: Type system & custom fields (1 day)

- Extend `FieldType`, `FieldPlacement`, `SignerInfo` in `types.ts`.
- Update `test/helpers/field-factory.ts`: `buildField` supports `type: 'custom'` + `label`; `buildSigner` supports `customFields`.
- Add field-placement unit tests for custom type.
- Ensure all existing tests still compile and pass.

### M3: Export pipeline (1-2 days)

- Update `modifyPdf` to handle `type === 'custom'` with white rect + text draw.
- Add `extractPageRects` helper to `test/helpers/pdf-helpers.ts` for white rect verification.
- Unit tests in `test/unit/pdf-modifier.single-page.test.ts`: custom field value draw, white rect erasure, missing value, coexistence with built-in types.

### M4: UI components (1-2 days)

- Build `CustomFieldInputs` component.
- Update `SignatureField` to display label for custom fields.
- Add `data-slot` attributes and theme support.

### M5: Demo integration (1 day)

- Wire `useAnchorTags` into demo `App.tsx`.
- Render `CustomFieldInputs` in the sidebar.
- Add "Next field" scroll navigation.
- Create a sample test PDF with anchor tags for the demo.

### M6: Documentation, testing & polish (1-2 days)

- Update `INTEGRATION_GUIDELINES.md`: new hook signature (section 2.2), new component signature (section 2.1), updated types (section 2.3), new SLOTS (section 2.5), anchor tag wiring example (section 4), `PatternF_anchorTagTemplate` composition pattern (section 5), extended field placement data flow (section 6), consumer responsibilities note (section 8).
- E2E test in `test/browser/signing-e2e.test.tsx`: anchor tag signing flow.
- Edge case hardening.
- README updates.

### Dependencies

- PDF.js text layer API (`page.getTextContent()`) — already available via `react-pdf` / `pdfjs-dist`.
- No new npm dependencies required.

### Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PDF.js text item bounding boxes are inaccurate for some fonts/encodings | Medium | Field misalignment | Add padding/tolerance to bounding box calculations; allow manual position adjustment as fallback |
| Anchor tag text spans multiple text items (line breaks, font changes) | Medium | Missed tags | Implement text item joining heuristic for adjacent items on the same line; log warning for partial matches |
| False positives (`{{ }}` in document content that isn't an anchor tag) | Low | Unwanted fields | Strict syntax + documentation; future: allow a tag prefix like `{{ field:name }}` |
| Performance on very large PDFs (100+ pages) | Low | Slow initial load | Lazy/progressive scanning with `isScanning` state; scan visible pages first |

### Open questions

- Should a future version support structured anchor syntax for signer assignment (e.g., `{{ signer1:companyName }}`)?
- Should the library provide a utility to generate sample PDFs with anchor tags for testing?
- Should there be a maximum number of anchor tags per document (guard against abuse)?
