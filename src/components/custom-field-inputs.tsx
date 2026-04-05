import { cn } from '../lib/cn'

interface CustomFieldInputsProps {
  labels: string[]
  values: Record<string, string>
  onValuesChange: (nextValues: Record<string, string>) => void
  className?: string
}

export function CustomFieldInputs({ labels, values, onValuesChange, className }: CustomFieldInputsProps) {
  if (labels.length === 0) return null

  function handleChange(label: string, value: string): void {
    onValuesChange({ ...values, [label]: value })
  }

  const uniqueLabels = [...new Set(labels)]

  return (
    <div data-slot="custom-field-inputs" className={cn(className)}>
      {uniqueLabels.map((label) => (
        <div key={label} data-slot="custom-field-inputs-field">
          <label data-slot="custom-field-inputs-label" htmlFor={`custom-field-${label}`}>
            {label}
          </label>
          <input
            data-slot="custom-field-inputs-input"
            id={`custom-field-${label}`}
            type="text"
            value={values[label] ?? ''}
            onChange={(event) => handleChange(label, event.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
