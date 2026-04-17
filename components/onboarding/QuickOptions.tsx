'use client'

interface Props {
  options: string[]
  onSelect: (option: string) => void
}

export function QuickOptions({ options, onSelect }: Props) {
  if (!options.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 500 }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="btn btn-glass"
          style={{ textAlign: 'left', justifyContent: 'flex-start' }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
