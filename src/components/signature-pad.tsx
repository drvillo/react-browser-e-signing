import SignaturePadLibrary from 'signature_pad'
import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn'

interface SignaturePadProps {
  onDrawn: (signatureDataUrl: string) => void
  className?: string
}

export function SignaturePad({ onDrawn, className }: SignaturePadProps) {
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
    <div data-slot="signature-pad" className={cn(className)}>
      <canvas data-slot="signature-pad-canvas" ref={canvasRef} width={420} height={140} />
      <div data-slot="signature-pad-actions">
        <button
          type="button"
          data-slot="signature-pad-clear"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
