import type { FieldType } from '../types'

interface FieldPaletteProps {
  selectedFieldType: FieldType | null
  onSelectFieldType: (fieldType: FieldType | null) => void
}

const FIELD_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  fullName: 'Full Name',
  title: 'Title',
  date: 'Date',
}

const FIELD_TYPES: FieldType[] = ['signature', 'fullName', 'title', 'date']

export function FieldPalette({ selectedFieldType, onSelectFieldType }: FieldPaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2">
      {FIELD_TYPES.map((fieldType) => {
        const isSelected = selectedFieldType === fieldType
        return (
          <button
            key={fieldType}
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
              isSelected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
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
