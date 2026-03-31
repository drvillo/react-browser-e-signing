import { useMemo } from 'react'
import { SIGNATURE_FONTS } from '../lib/signature-fonts'
import type { SignatureStyle } from '../types'
import { SignaturePad } from './signature-pad'
import { cn } from '../lib/cn'

interface SignaturePreviewProps {
  signerName: string
  style: SignatureStyle
  signatureDataUrl: string | null
  isRendering: boolean
  onStyleChange: (nextStyle: SignatureStyle) => void
  className?: string
}

export function SignaturePreview({
  signerName,
  style,
  signatureDataUrl,
  isRendering,
  onStyleChange,
  className,
}: SignaturePreviewProps) {
  const canShowPreview = useMemo(() => signerName.trim().length > 0, [signerName])

  return (
    <div data-slot="signature-preview" className={cn(className)}>
      <h2 data-slot="signature-preview-heading">Signature</h2>

      <div data-slot="signature-preview-mode-toggle">
        <button
          type="button"
          data-slot="signature-preview-mode-button"
          data-mode="typed"
          data-state={style.mode === 'typed' ? 'active' : 'idle'}
          onClick={() => onStyleChange({ mode: 'typed', fontFamily: style.mode === 'typed' ? style.fontFamily : SIGNATURE_FONTS[0] })}
        >
          Typed
        </button>
        <button
          type="button"
          data-slot="signature-preview-mode-button"
          data-mode="drawn"
          data-state={style.mode === 'drawn' ? 'active' : 'idle'}
          onClick={() => onStyleChange({ mode: 'drawn', dataUrl: style.mode === 'drawn' ? style.dataUrl : '' })}
        >
          Drawn
        </button>
      </div>

      {style.mode === 'typed' ? (
        <label data-slot="signature-preview-font-label">
          Font
          <select
            data-slot="signature-preview-font-select"
            value={style.fontFamily}
            onChange={(event) => onStyleChange({ mode: 'typed', fontFamily: event.target.value })}
          >
            {SIGNATURE_FONTS.map((fontFamily) => (
              <option key={fontFamily} value={fontFamily}>
                {fontFamily}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <SignaturePad onDrawn={(dataUrl) => onStyleChange({ mode: 'drawn', dataUrl })} />
      )}

      <div
        data-slot="signature-preview-display"
        data-state={
          !canShowPreview ? 'empty' : isRendering ? 'rendering' : signatureDataUrl ? 'ready' : 'missing-signature'
        }
      >
        {!canShowPreview ? (
          <p data-slot="signature-preview-placeholder">Enter signer first and last name to render a signature.</p>
        ) : isRendering ? (
          <p data-slot="signature-preview-placeholder">Rendering signature...</p>
        ) : signatureDataUrl ? (
          <img data-slot="signature-preview-image" src={signatureDataUrl} alt="Signature preview" />
        ) : (
          <p data-slot="signature-preview-placeholder">No signature available yet.</p>
        )}
      </div>
    </div>
  )
}
