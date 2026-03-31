import type { SignerInfo } from '../types'
import { cn } from '../lib/cn'

interface SignerDetailsPanelProps {
  signerInfo: SignerInfo
  onSignerInfoChange: (nextSignerInfo: SignerInfo) => void
  className?: string
}

export function SignerDetailsPanel({ signerInfo, onSignerInfoChange, className }: SignerDetailsPanelProps) {
  function handleInputChange(fieldName: keyof SignerInfo, fieldValue: string): void {
    onSignerInfoChange({
      ...signerInfo,
      [fieldName]: fieldValue,
    })
  }

  return (
    <div data-slot="signer-panel" className={cn(className)}>
      <h2 data-slot="signer-panel-heading">Signer Details</h2>

      <label data-slot="signer-panel-label">
        First Name
        <input
          data-slot="signer-panel-input"
          value={signerInfo.firstName}
          onChange={(event) => handleInputChange('firstName', event.target.value)}
        />
      </label>

      <label data-slot="signer-panel-label">
        Last Name
        <input
          data-slot="signer-panel-input"
          value={signerInfo.lastName}
          onChange={(event) => handleInputChange('lastName', event.target.value)}
        />
      </label>

      <label data-slot="signer-panel-label">
        Title
        <input
          data-slot="signer-panel-input"
          value={signerInfo.title}
          onChange={(event) => handleInputChange('title', event.target.value)}
        />
      </label>
    </div>
  )
}
