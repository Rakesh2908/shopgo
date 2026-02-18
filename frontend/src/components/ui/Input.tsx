import type { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type InputRegister = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  ref: (instance: HTMLInputElement | null) => void
  name: string
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  placeholder?: string
  type?: string
  register?: InputRegister
  className?: string
}

/**
 * Styled text input with optional label and error message.
 * Use with react-hook-form by passing the return of register().
 */
export function Input({
  label,
  error,
  placeholder,
  type = 'text',
  register,
  className,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? (register ? register.name : undefined)
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-primary"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border border-slate-200 px-3 py-2 text-primary placeholder-slate-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-50',
          className,
        )}
        {...(register ?? {})}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
