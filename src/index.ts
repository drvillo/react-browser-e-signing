import { loadSignatureFont, SIGNATURE_FONTS } from './lib/signature-fonts'

export { configure } from './lib/config'
export type { ESigningConfig, SignatureFontWarning } from './lib/config'

export { PdfViewer } from './components/pdf-viewer'
export { PdfPageNavigator } from './components/pdf-page-navigator'
export { FieldOverlay } from './components/field-overlay'
export { SignatureField } from './components/signature-field'
export { FieldPalette } from './components/field-palette'
export { SignerDetailsPanel } from './components/signer-details-panel'
export { SignaturePreview } from './components/signature-preview'
export { SignaturePad } from './components/signature-pad'
export { SigningComplete } from './components/signing-complete'
export { CustomFieldInputs } from './components/custom-field-inputs'

export { usePdfDocument } from './hooks/use-pdf-document'
export { usePdfPageVisibility } from './hooks/use-pdf-page-visibility'
export { useFieldPlacement } from './hooks/use-field-placement'
export { useSignatureRenderer } from './hooks/use-signature-renderer'
export { useAnchorTags, scanAnchorTags } from './hooks/use-anchor-tags'

export type { UsePdfPageVisibilityOptions, UsePdfPageVisibilityReturn } from './hooks/use-pdf-page-visibility'

export { modifyPdf } from './lib/pdf-modifier'
export { mapToPoints, mapFromPoints } from './lib/coordinate-mapper'
export { loadSignatureFont, SIGNATURE_FONTS }
export { sha256 } from './lib/hash'
export { SLOTS } from './lib/slots'

export type {
  FieldPlacement,
  FieldType,
  SignerInfo,
  SignatureStyle,
  SigningResult,
  PdfPageDimensions,
  SignatureFieldPreview,
} from './types'

export const defaults = {
  SIGNATURE_FONTS: [...SIGNATURE_FONTS],
  DEFAULT_FIELD_WIDTH_PERCENT: 25,
  DEFAULT_FIELD_HEIGHT_PERCENT: 5,
} as const
