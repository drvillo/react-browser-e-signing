import SignaturePadLibrary from 'signature_pad'
import { useEffect, useRef } from 'react'

interface SignaturePadProps {
  onDrawn: (signatureDataUrl: string) => void
}

export function SignaturePad({ onDrawn }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const signaturePadRef = useRef<SignaturePadLibrary | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const signaturePad = new SignaturePadLibrary(canvasRef.current, {
      minWidth: 1,
      maxWidth: 2.5,
      penColor: '#111827',
      backgroundColor: 'rgba(255,255,255,0)',
    })

    signaturePadRef.current = signaturePad

    function emitSignatureIfNotEmpty(): void {
      if (signaturePad.isEmpty()) return
      onDrawn(signaturePad.toDataURL('image/png'))
    }

    signaturePad.addEventListener('endStroke', emitSignatureIfNotEmpty)

    return () => {
      signaturePad.removeEventListener('endStroke', emitSignatureIfNotEmpty)
      signaturePad.off()
      signaturePadRef.current = null
    }
  }, [onDrawn])

  function handleClear(): void {
    signaturePadRef.current?.clear()
    onDrawn('')
  }

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} width={420} height={140} className="w-full rounded border border-slate-300 bg-white" />
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
