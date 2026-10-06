import { useId } from 'react'
import { inputCx, labelCx } from '../lib/ui'

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email'
  required?: boolean
}

/** Label + input pair used by every auth form. */
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  required = true,
}: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={labelCx}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        className={inputCx}
      />
    </div>
  )
}
