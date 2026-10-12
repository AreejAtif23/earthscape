import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/common/Button'
import { Checkbox, Input, PasswordInput } from '@/components/common/Form'
import { Badge } from '@/components/common/Badge'
import { DEMO_CREDENTIALS } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/routes/paths'
import { formatDateTime } from '@/utils/date'
import type { LoginCredentials } from '@/types'

interface FieldErrors {
  email?: string
  password?: string
  form?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()

  // Arriving from sign-up, the field is pre-filled with the new address.
  const [email, setEmail] = useState(
    () => (location.state as { email?: string } | null)?.email ?? DEMO_CREDENTIALS.email,
  )
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetSent, setIsResetSent] = useState(false)
  const [sessionIssuedAt, setSessionIssuedAt] = useState<string | null>(null)

  useEffect(() => {
    setSessionIssuedAt(new Date().toISOString())
  }, [])

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from
    return from && from !== ROUTES.login ? from : ROUTES.dashboard
  }, [location.state])

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = 'Enter the email address for your account.'
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    else if (password.length < 8) nextErrors.password = 'Passwords must be at least 8 characters.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})
    try {
      const credentials: LoginCredentials = { email: email.trim(), password, rememberMe }
      const user = await login(credentials)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`, 'Your workspace is ready.')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Sign-in failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setErrors({})
    toast.info('Demo credentials filled', 'Sign in with the pre-filled analyst account.')
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in to EarthScape</h1>
          <p className="text-sm text-ink-muted">
            Access the climate intelligence workspace for your monitoring network.
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
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@organisation.org"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
            }}
            error={errors.email}
            leadingIcon={<Mail className="size-4" />}
            required
            disabled={isSubmitting}
          />

          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
            }}
            error={errors.password}
            leadingIcon={<KeyRound className="size-4" />}
            required
            disabled={isSubmitting}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Checkbox
              label="Remember this device"
              description="Keeps you signed in for 30 days"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setIsResetSent(true)}
              disabled={isSubmitting}
              className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 disabled:opacity-60 dark:text-brand-200"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Signing inâ€¦"
            leadingIcon={<LogIn className="size-4" />}
          >
            Sign in
          </Button>
        </form>

        {isResetSent && (
          <div
            role="status"
            className="rounded-md border border-state-info-200 bg-state-info-50 px-3 py-2.5 text-xs leading-relaxed text-state-info-700 dark:border-state-info-700 dark:bg-state-info-900/30 dark:text-state-info-200"
          >
            A password reset link would be emailed to <span className="font-medium">{email || 'your address'}</span>.
            Connect the authentication service to activate this flow.
          </div>
        )}

        <div className="rounded-lg border border-line bg-surface-muted p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <ShieldCheck className="size-3.5 text-brand-600" aria-hidden="true" />
                Demonstration access
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                No backend is connected. Use the analyst account to explore every screen.
              </p>
            </div>
            <Badge tone="brand" size="sm">
              Mock mode
            </Badge>
          </div>
          <dl className="mt-3 space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Email</dt>
              <dd className="truncate text-ink-secondary">{DEMO_CREDENTIALS.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Password</dt>
              <dd className="text-ink-secondary">{DEMO_CREDENTIALS.password}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Session issued</dt>
              <dd className="text-ink-secondary">
                {sessionIssuedAt ? formatDateTime(sessionIssuedAt) : 'â€”'}
              </dd>
            </div>
          </dl>
          <Button variant="subtle" size="sm" fullWidth className="mt-3" onClick={handleUseDemoCredentials}>
            Fill demonstration credentials
          </Button>
        </div>

        <p className="text-center text-xs text-ink-muted">
          Need an account?{' '}
          <Link to={ROUTES.signup} className="font-medium text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-200">
            Request access
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
