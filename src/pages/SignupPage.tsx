import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Check, KeyRound, Mail, UserPlus, UserRound } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/common/Button'
import { Checkbox, Input, PasswordInput } from '@/components/common/Form'
import { ROLE_DESCRIPTIONS } from '@/data/operations'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'
import type { SignupPayload, UserRole } from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { id: 'mixed', label: 'Upper and lowercase letters', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { id: 'digit', label: 'At least one number', test: (value: string) => /\d/.test(value) },
  { id: 'symbol', label: 'At least one symbol', test: (value: string) => /[^\w\s]/.test(value) },
]

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'analyst', ...ROLE_DESCRIPTIONS.analyst },
  { value: 'researcher', ...ROLE_DESCRIPTIONS.researcher },
  { value: 'administrator', ...ROLE_DESCRIPTIONS.administrator },
]

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  organisation?: string
  acceptTerms?: string
  form?: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [role, setRole] = useState<UserRole>('analyst')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const strength = useMemo(() => {
    const passed = PASSWORD_RULES.filter((rule) => rule.test(password))
    const score = passed.length
    return {
      score,
      label: score === 0 ? 'Empty' : score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Strong' : 'Excellent',
      tone: score <= 1 ? 'critical' : score === 2 ? 'warning' : score === 3 ? 'normal' : 'brand',
      percent: (score / PASSWORD_RULES.length) * 100,
    } as const
  }, [password])

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {}
    if (!name.trim()) nextErrors.name = 'Enter your full name.'
    else if (name.trim().length < 3) nextErrors.name = 'Name must be at least 3 characters.'
    if (!email.trim()) nextErrors.email = 'Enter your work email address.'
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!organisation.trim()) nextErrors.organisation = 'Enter your organisation.'
    if (!password) nextErrors.password = 'Choose a password.'
    else {
      const failed = PASSWORD_RULES.filter((rule) => !rule.test(password))
      if (failed.length > 0) nextErrors.password = `Password must satisfy: ${failed.map((rule) => rule.label).join(', ')}.`
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Re-enter your password.'
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.'
    if (!acceptTerms) nextErrors.acceptTerms = 'You must accept the platform terms to continue.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})
    try {
      const payload: SignupPayload = {
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
        organisation: organisation.trim(),
        acceptTerms,
      }
      const activationRequired = await signup(payload)
      if (activationRequired) {
        toast.success('Account request submitted', 'Check your inbox for the activation link.')
      } else {
        toast.success('Account created', `Signed in as a ${role}. Enter your password to continue.`)
      }
      navigate(ROUTES.login, {
        replace: true,
        state: { email: payload.email.trim().toLowerCase() },
      })
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Registration failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Create your EarthScape account</h1>
          <p className="text-sm text-ink-muted">
            Access is role-scoped. Select the role that matches your responsibilities.
          </p>
        </header>

        {errors.form && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-state-critical-200 bg-state-critical-50 px-3 py-2.5 dark:border-state-critical-700 dark:bg-state-critical-900/30"
          >
            <AlertCircle className="mt-px size-4 shrink-0 text-state-critical-600 dark:text-state-critical-200" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-state-critical-700 dark:text-state-critical-200">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Amina Rahman"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
              leadingIcon={<UserRound className="size-4" />}
              required
              disabled={isSubmitting}
            />
            <Input
              label="Organisation"
              name="organisation"
              autoComplete="organization"
              placeholder="EarthScape Climate Agency"
              value={organisation}
              onChange={(event) => setOrganisation(event.target.value)}
              error={errors.organisation}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Work email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@organisation.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            leadingIcon={<Mail className="size-4" />}
            required
            disabled={isSubmitting}
          />

          <fieldset disabled={isSubmitting}>
            <legend className="mb-2 text-xs font-medium text-ink-secondary">Access role</legend>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => {
                const isSelected = role === option.value
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-line hover:border-line-strong hover:bg-surface-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setRole(option.value)}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-ink">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">
                        {option.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            leadingIcon={<KeyRound className="size-4" />}
            required
            disabled={isSubmitting}
          />

          {password.length > 0 && (
            <div className="space-y-2 rounded-md border border-line bg-surface-muted p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-ink-secondary">Password strength</span>
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    strength.tone === 'critical' && 'text-state-critical-600 dark:text-state-critical-200',
                    strength.tone === 'warning' && 'text-state-warning-700 dark:text-state-warning-200',
                    strength.tone === 'normal' && 'text-state-normal-700 dark:text-state-normal-200',
                    strength.tone === 'brand' && 'text-brand-700 dark:text-brand-200',
                  )}
                  aria-live="polite"
                >
                  {strength.label}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Password strength"
                aria-valuenow={Math.round(strength.percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    strength.tone === 'critical' && 'bg-state-critical-500',
                    strength.tone === 'warning' && 'bg-state-warning-500',
                    strength.tone === 'normal' && 'bg-state-normal-500',
                    strength.tone === 'brand' && 'bg-brand-500',
                  )}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password)
                  return (
                    <li
                      key={rule.id}
                      className={cn(
                        'flex items-center gap-1.5 text-[11px]',
                        passed ? 'text-state-normal-700 dark:text-state-normal-200' : 'text-ink-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-3.5 shrink-0 items-center justify-center rounded-full',
                          passed ? 'bg-state-normal-500 text-white' : 'border border-line-strong',
                        )}
                        aria-hidden="true"
                      >
                        {passed && <Check className="size-2.5" strokeWidth={3} />}
                      </span>
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            leadingIcon={<KeyRound className="size-4" />}
            required
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <Checkbox
              label="I accept the platform terms and data-handling policy"
              description="Climate records are retained for 36 months and archived thereafter."
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              error={errors.acceptTerms}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Creating accountâ€¦"
            leadingIcon={<UserPlus className="size-4" />}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          Already have access?{' '}
          <Link to={ROUTES.login} className="font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200">
            Sign in instead
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
