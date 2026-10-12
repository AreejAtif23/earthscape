import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DropdownProps {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  widthClassName?: string
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', widthClassName = 'w-56', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) setIsOpen(false)
      }}
    >
      {trigger({ isOpen, toggle: () => setIsOpen((open) => !open) })}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.13, ease: [0.25, 1, 0.5, 1] }}
          className={cn(
            'absolute top-full z-30 mt-1 overflow-hidden rounded-md border border-line bg-surface p-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            widthClassName,
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  icon,
  destructive = false,
  disabled = false,
  description,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  description?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left text-xs transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        destructive
          ? 'text-state-critical-600 hover:bg-state-critical-50 dark:text-state-critical-200 dark:hover:bg-state-critical-900/40'
          : 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
      )}
    >
      {icon && <span className="mt-px shrink-0 text-ink-faint">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{children}</span>
        {description && <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{description}</span>}
      </span>
    </button>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{children}</p>
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-line" role="separator" />
}

export function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  label,
  icon,
  align = 'right',
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  label: string
  icon?: ReactNode
  align?: 'left' | 'right'
}) {
  const current = options.find((option) => option.value === value)

  return (
    <Dropdown
      align={align}
      trigger={({ isOpen, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
        >
          {icon}
          <span className="max-w-[10rem] truncate">{current?.label ?? label}</span>
          <ChevronDown className={cn('size-3.5 text-ink-faint transition-transform duration-150', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
      )}
    >
      <div role="listbox" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors',
              option.value === value
                ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100'
                : 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
            )}
          >
            <span className="truncate">{option.label}</span>
            {option.value === value && <span className="size-1.5 rounded-full bg-brand-600" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </Dropdown>
  )
}
