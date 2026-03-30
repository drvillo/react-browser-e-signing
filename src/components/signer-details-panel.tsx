import type { SignerInfo } from '../types'

interface SignerDetailsPanelProps {
  signerInfo: SignerInfo
  onSignerInfoChange: (nextSignerInfo: SignerInfo) => void
}

export function SignerDetailsPanel({ signerInfo, onSignerInfoChange }: SignerDetailsPanelProps) {
  function handleInputChange(fieldName: keyof SignerInfo, fieldValue: string): void {
    onSignerInfoChange({
      ...signerInfo,
      [fieldName]: fieldValue,
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Signer Details</h2>

      <label className="block text-sm text-slate-700">
        First Name
        <input
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          value={signerInfo.firstName}
          onChange={(event) => handleInputChange('firstName', event.target.value)}
        />
      </label>

      <label className="block text-sm text-slate-700">
        Last Name
        <input
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          value={signerInfo.lastName}
          onChange={(event) => handleInputChange('lastName', event.target.value)}
        />
      </label>

      <label className="block text-sm text-slate-700">
        Title
        <input
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          value={signerInfo.title}
          onChange={(event) => handleInputChange('title', event.target.value)}
        />
      </label>
    </div>
  )
}
