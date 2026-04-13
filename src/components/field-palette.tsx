import type { FieldType } from '../types'
import { cn } from '../lib/cn'

interface FieldPaletteProps {
  selectedFieldType: FieldType | null
  onSelectFieldType: (fieldType: FieldType | null) => void
  fieldTypes?: FieldType[]
  className?: string
}

const FIELD_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  fullName: 'Full Name',
  title: 'Title',
  date: 'Date',
  text: 'Text',
}

const DEFAULT_FIELD_TYPES: FieldType[] = ['signature', 'fullName', 'title', 'date', 'text']

export function FieldPalette({ selectedFieldType, onSelectFieldType, fieldTypes = DEFAULT_FIELD_TYPES, className }: FieldPaletteProps) {
  return (
    <div data-slot="field-palette" className={cn(className)}>
      {fieldTypes.map((fieldType) => {
        const isSelected = selectedFieldType === fieldType
        return (
          <button
            key={fieldType}
            type="button"
            data-slot="field-palette-button"
            data-state={isSelected ? 'selected' : 'idle'}
            onClick={() => onSelectFieldType(isSelected ? null : fieldType)}
            aria-pressed={isSelected}
          >
            {FIELD_LABELS[fieldType]}
          </button>
        )
      })}
    </div>
  )
}
