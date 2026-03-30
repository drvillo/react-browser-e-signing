interface SigningCompleteProps {
  signerName: string
  fieldCount: number
  signedAt: string
  documentHash: string
  downloadUrl: string
  fileName?: string
  onReset: () => void
}

export function SigningComplete({
  signerName,
  fieldCount,
  signedAt,
  documentHash,
  downloadUrl,
  fileName = 'signed-document.pdf',
  onReset,
}: SigningCompleteProps) {
  return (
    <div className="space-y-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
      <h2 className="text-base font-semibold text-emerald-900">Document Signed</h2>
      <div className="space-y-1 text-sm text-emerald-900">
        <p>Signer: {signerName || 'Unknown'}</p>
        <p>Fields applied: {fieldCount}</p>
        <p>Signed at: {signedAt}</p>
      </div>

      <div className="rounded border border-emerald-200 bg-white p-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">SHA-256</p>
        <p className="break-all font-mono text-xs text-slate-800">{documentHash}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={downloadUrl}
          download={fileName}
          className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800"
        >
          Download Signed PDF
        </a>
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={onReset}
        >
          Sign Another
        </button>
      </div>
    </div>
  )
}
