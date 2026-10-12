import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700 active:bg-brand-800 shadow-xs',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-surface-muted hover:border-ink-faint active:bg-surface-sunken shadow-xs',
  outline: 'bg-transparent text-ink-secondary border border-line hover:bg-surface-muted hover:text-ink',
  ghost: 'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-muted hover:text-ink',
  subtle: 'bg-surface-muted text-ink border border-transparent hover:bg-surface-sunken hover:border-line',
  danger: 'bg-state-critical-600 text-white border border-state-critical-600 hover:bg-state-critical-700 active:bg-state-critical-900',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-sm',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-base gap-2 rounded-lg',
}

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-4.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loadingText?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    loadingText,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', ICON_SIZE_CLASSES[size])} aria-hidden="true" />
      ) : (
        leadingIcon && <span className={cn('flex shrink-0', ICON_SIZE_CLASSES[size])} aria-hidden="true">{leadingIcon}</span>
      )}
      {isLoading && loadingText ? loadingText : children}
      {!isLoading && trailingIcon && (
        <span className={cn('flex shrink-0', ICON_SIZE_CLASSES[size])} aria-hidden="true">{trailingIcon}</span>
      )}
    </button>
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string
}

const ICON_BUTTON_SIZE: Record<ButtonSize, string> = {
  xs: 'size-7',
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', label, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        ICON_BUTTON_SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
