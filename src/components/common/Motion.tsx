import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

/** Shared easing so every transition in the platform feels identical. */
export const EASE_OUT = [0.25, 1, 0.5, 1] as const

export const DURATION = {
  fast: 0.14,
  base: 0.2,
  slow: 0.34,
} as const

export const fadeIn: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.99, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}

export function staggerContainer(stagger = 0.045): Variants {
  return {
    initial: {},
    animate: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
  }
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
      transition={{ duration: shouldReduceMotion ? 0 : DURATION.base, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGroup({
  children,
  className,
  stagger = 0.045,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div variants={staggerContainer(stagger)} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  )
}

/** Counts up to `value` once scrolled into view. Respects reduced motion. */
export function AnimatedNumber({
  value,
  decimals = 1,
  suffix = '',
  prefix = '',
  durationMs = 850,
  className,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  durationMs?: number
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value)
      return
    }
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setDisplay(value)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, value, durationMs, shouldReduceMotion])

  return (
    <span ref={ref} className={cn('tabular-nums', className)} data-numeric>
      {prefix}
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
