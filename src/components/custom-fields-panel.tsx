import type { FieldPlacement } from '../types'
import { cn } from '../lib/cn'

interface CustomFieldsPanelProps {
  fields: FieldPlacement[]
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
  isPlacingField: boolean
  onTogglePlacing: () => void
  className?: string
}

export function CustomFieldsPanel({
  fields,
  values,
  onValuesChange,
  isPlacingField,
  onTogglePlacing,
  className,
}: CustomFieldsPanelProps) {
  const seen = new Set<string>()
  const uniqueLabels: string[] = []
  for (const f of fields) {
    if (f.type === 'custom' && f.label && !seen.has(f.label)) {
      seen.add(f.label)
      uniqueLabels.push(f.label)
    }
  }

  function handleChange(label: string, value: string): void {
    onValuesChange({ ...values, [label]: value })
  }

  return (
    <div data-slot="custom-fields-panel" className={cn(className)}>
      <h2 data-slot="custom-fields-panel-heading">Custom Fields</h2>

      {uniqueLabels.map((label) => (
        <label key={label} data-slot="custom-fields-panel-label">
          {label}
          <input
            data-slot="custom-fields-panel-input"
            value={values[label] ?? ''}
            onChange={(e) => handleChange(label, e.target.value)}
          />
        </label>
      ))}

      <button
        type="button"
        data-slot="custom-fields-panel-add-button"
        data-state={isPlacingField ? 'placing' : 'idle'}
        onClick={onTogglePlacing}
      >
        {isPlacingField ? 'Click on the PDF to place…' : '+ New field'}
      </button>
    </div>
  )
}
