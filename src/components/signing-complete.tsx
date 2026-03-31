import { cn } from '../lib/cn'

interface SigningCompleteProps {
  signerName: string
  fieldCount: number
  signedAt: string
  documentHash: string
  downloadUrl: string
  fileName?: string
  onReset: () => void
  className?: string
}

export function SigningComplete({
  signerName,
  fieldCount,
  signedAt,
  documentHash,
  downloadUrl,
  fileName = 'signed-document.pdf',
  onReset,
  className,
}: SigningCompleteProps) {
  return (
    <div data-slot="signing-complete" className={cn(className)}>
      <h2 data-slot="signing-complete-heading">Document Signed</h2>
      <div data-slot="signing-complete-details">
        <p>Signer: {signerName || 'Unknown'}</p>
        <p>Fields applied: {fieldCount}</p>
        <p>Signed at: {signedAt}</p>
      </div>

      <div data-slot="signing-complete-hash">
        <p data-slot="signing-complete-hash-label">SHA-256</p>
        <p data-slot="signing-complete-hash-value">{documentHash}</p>
      </div>

      <div data-slot="signing-complete-actions">
        <a
          href={downloadUrl}
          download={fileName}
          data-slot="signing-complete-download"
        >
          Download Signed PDF
        </a>
        <button
          type="button"
          data-slot="signing-complete-reset"
          onClick={onReset}
        >
          Sign Another
        </button>
      </div>
    </div>
  )
}
