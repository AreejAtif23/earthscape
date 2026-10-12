import { forwardRef, useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

const CONTROL_BASE =
  'w-full rounded-md border bg-surface text-sm text-ink transition-colors duration-150 placeholder:text-ink-faint ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint'

const CONTROL_STATE = (invalid?: boolean) =>
  invalid
    ? 'border-state-critical-500 focus:border-state-critical-600 focus:ring-state-critical-500/25'
    : 'border-line-strong focus:border-brand-500 focus:ring-brand-500/25'

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
  action,
}: {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || action) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="text-xs font-medium text-ink-secondary">
              {label}
              {required && (
                <span className="ml-0.5 text-state-critical-600 dark:text-state-critical-200" aria-hidden="true">
                  *
                </span>
              )}
              {required && <span className="sr-only"> (required)</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="flex items-start gap-1 text-xs text-state-critical-600 dark:text-state-critical-200" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leadingIcon, trailingSlot, containerClassName, className, id, required, ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            CONTROL_BASE,
            CONTROL_STATE(Boolean(error)),
            'h-9 px-3',
            leadingIcon && 'pl-9',
            trailingSlot && 'pr-10',
            className,
          )}
          {...rest}
        />
        {trailingSlot && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailingSlot}</span>}
      </div>
    </Field>
  )
})

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showLabel?: string
  hideLabel?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { showLabel = 'Show password', hideLabel = 'Hide password', ...rest },
  ref,
) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={isVisible ? 'text' : 'password'}
      trailingSlot={
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? hideLabel : showLabel}
          aria-pressed={isVisible}
          className="flex size-7 items-center justify-center rounded text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
        >
          {isVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
      {...rest}
    />
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  selectSize?: 'sm' | 'md'
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, selectSize = 'md', containerClassName, className, id, required, children, ...rest },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <Field label={label} htmlFor={selectId} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            CONTROL_BASE,
            CONTROL_STATE(Boolean(error)),
            'cursor-pointer appearance-none pr-9',
            selectSize === 'sm' ? 'h-8 pl-2.5 text-xs' : 'h-9 pl-3',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, containerClassName, className, id, required, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <Field label={label} htmlFor={textareaId} error={error} hint={hint} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={cn(CONTROL_BASE, CONTROL_STATE(Boolean(error)), 'resize-y px-3 py-2 leading-relaxed', className)}
        {...rest}
      />
    </Field>
  )
})

export function Checkbox({
  label,
  description,
  error,
  id,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: string; error?: string }) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? `${checkboxId}-description` : undefined}
          className="peer size-4 cursor-pointer appearance-none rounded-[3px] border border-line-strong bg-surface transition-colors checked:border-brand-600 checked:bg-brand-600 indeterminate:border-brand-600 indeterminate:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        <Check
          className="pointer-events-none absolute size-3 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0">
        <label htmlFor={checkboxId} className="cursor-pointer text-xs font-medium text-ink-secondary select-none">
          {label}
        </label>
        {description && (
          <p id={`${checkboxId}-description`} className="mt-0.5 text-xs leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
        {error && (
          <p className="mt-0.5 text-xs text-state-critical-600 dark:text-state-critical-200" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export function Switch({
  label,
  description,
  id,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: ReactNode
  description?: string
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <span id={`${switchId}-label`} className="text-sm font-medium text-ink">
          {label}
        </span>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>}
      </div>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${switchId}-label`}
          aria-label={typeof label === 'string' ? label : undefined}
          disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-brand-600 bg-brand-600' : 'border-line-strong bg-surface-sunken',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute size-3.5 rounded-full bg-white shadow-xs transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; icon?: ReactNode }>
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors duration-150',
              size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs',
              isActive
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
