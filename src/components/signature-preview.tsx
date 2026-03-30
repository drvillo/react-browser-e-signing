import { useMemo } from 'react'
import { SIGNATURE_FONTS } from '../lib/signature-fonts'
import type { SignatureStyle } from '../types'
import { SignaturePad } from './signature-pad'

interface SignaturePreviewProps {
  signerName: string
  style: SignatureStyle
  signatureDataUrl: string | null
  isRendering: boolean
  onStyleChange: (nextStyle: SignatureStyle) => void
}

export function SignaturePreview({
  signerName,
  style,
  signatureDataUrl,
  isRendering,
  onStyleChange,
}: SignaturePreviewProps) {
  const canShowPreview = useMemo(() => signerName.trim().length > 0, [signerName])

  return (
    <div className="space-y-3 rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Signature</h2>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`rounded border px-2 py-1 text-xs ${style.mode === 'typed' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-slate-50 text-slate-700'}`}
          onClick={() => onStyleChange({ mode: 'typed', fontFamily: style.mode === 'typed' ? style.fontFamily : SIGNATURE_FONTS[0] })}
        >
          Typed
        </button>
        <button
          type="button"
          className={`rounded border px-2 py-1 text-xs ${style.mode === 'drawn' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-slate-50 text-slate-700'}`}
          onClick={() => onStyleChange({ mode: 'drawn', dataUrl: style.mode === 'drawn' ? style.dataUrl : '' })}
        >
          Drawn
        </button>
      </div>

      {style.mode === 'typed' ? (
        <label className="block text-sm text-slate-700">
          Font
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
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

      <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3">
        {!canShowPreview ? (
          <p className="text-xs text-slate-500">Enter signer first and last name to render a signature.</p>
        ) : isRendering ? (
          <p className="text-xs text-slate-500">Rendering signature...</p>
        ) : signatureDataUrl ? (
          <img src={signatureDataUrl} alt="Signature preview" className="h-24 w-full object-contain" />
        ) : (
          <p className="text-xs text-slate-500">No signature available yet.</p>
        )}
      </div>
    </div>
  )
}
