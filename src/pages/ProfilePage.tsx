import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Building2,
  Check,
  Copy,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input, Select } from '@/components/common/Form'
import { ReadOnlyRow } from '@/components/account/ReadOnlyRow'
import { EarthScapeLogo } from '@/components/common/Brand'
import { useAuth } from '@/hooks/useAuth'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useToast } from '@/hooks/useToast'
import { env } from '@/services'
import { ROUTES } from '@/routes/paths'
import { formatDate, formatDateTime, relativeTime } from '@/utils/date'
import { initialsOf, titleCase } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { ProfileUpdatePayload, UserRole } from '@/types'

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrator: 'Full access including thresholds, dataset ingestion and user administration.',
  analyst: 'May run analyses, acknowledge alerts and generate reports. Cannot change thresholds.',
  researcher: 'Read access to ingested data, forecasts and reports. Cannot acknowledge alerts.',
}

const ROLE_TONE: Record<UserRole, 'brand' | 'info' | 'neutral'> = {
  administrator: 'brand',
  analyst: 'info',
  researcher: 'neutral',
}

const TIMEZONES = [
  'UTC',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
]

export function ProfilePage() {
  const toast = useToast()
  const { user, updateProfile, logout, settings } = useAuth()
  const { copied, copy } = useCopyToClipboard()

  const [form, setForm] = useState<ProfileUpdatePayload>({
    name: user?.name ?? '',
    jobTitle: user?.jobTitle ?? '',
    organisation: user?.organisation ?? '',
    timezone: 'Europe/Lisbon',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileUpdatePayload, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      name: user.name,
      jobTitle: user.jobTitle,
      organisation: user.organisation,
    }))
  }, [user])

  const isDirty = useMemo(() => {
    if (!user) return false
    return (
      form.name !== user.name ||
      form.jobTitle !== user.jobTitle ||
      form.organisation !== user.organisation
    )
  }, [form, user])

  const validate = () => {
    const next: Partial<Record<keyof ProfileUpdatePayload, string>> = {}
    if (form.name.trim().length < 2) next.name = 'Enter the name colleagues will recognise.'
    if (form.organisation.trim().length < 2) next.organisation = 'Enter your organisation.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    setSaveError(null)
    if (!validate()) return
    setIsSaving(true)
    try {
      await updateProfile({
        ...form,
        name: form.name.trim(),
        jobTitle: form.jobTitle.trim(),
        organisation: form.organisation.trim(),
      })
      toast.success('Profile updated', 'Your details were saved to the workspace account.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await logout()
      toast.info('Signed out', 'Your session token was cleared from this browser.')
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-ink-secondary">Loading your profile…</p>
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your workspace identity, role and preferences. Contact an administrator to change your organisation or role."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Profile' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<LogOut className="size-4" />}
            onClick={() => void handleSignOut()}
            isLoading={isSigningOut}
            loadingText="Signing out…"
          >
            Sign out
          </Button>
        }
        meta={
          <>
            <MetaItem label="Role" value={titleCase(user.role)} />
            <MetaItem label="Member since" value={formatDate(user.memberSince)} />
            <MetaItem label="Last sign-in" value={relativeTime(user.lastLoginAt)} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-base font-semibold text-white">
                {user.avatarInitials || initialsOf(user.name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-ink">{user.name}</h2>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{user.jobTitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={ROLE_TONE[user.role]} size="sm" dot>
                    {titleCase(user.role)}
                  </Badge>
                  <Badge tone="outline" size="sm">
                    {user.id}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-line pt-3">
              <ReadOnlyRow label="Email" value={user.email} icon={<Mail className="size-3.5" />} />
              <ReadOnlyRow label="Organisation" value={user.organisation} icon={<Building2 className="size-3.5" />} />
              <ReadOnlyRow label="User ID" value={user.id} icon={<UserRound className="size-3.5" />} />
              <ReadOnlyRow label="Member since" value={formatDate(user.memberSince)} />
              <ReadOnlyRow label="Last sign-in" value={formatDateTime(user.lastLoginAt)} />
            </dl>

            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-3"
              leadingIcon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              onClick={() => {
                void copy(user.email).then((ok) => {
                  if (ok) toast.success('Email copied', user.email)
                  else toast.error('Clipboard unavailable', 'Select the address and copy it manually.')
                })
              }}
            >
              {copied ? 'Copied to clipboard' : 'Copy email address'}
            </Button>
          </Card>

          <Card>
            <CardHeader
              title="Role permissions"
              description="What this role can do"
              as="h3"
              icon={<ShieldCheck className="size-3.5" />}
            />
            <ul className="mt-4 space-y-2.5">
              {(Object.keys(ROLE_DESCRIPTIONS) as UserRole[]).map((role) => {
                const isCurrent = role === user.role
                return (
                  <li
                    key={role}
                    className={cn(
                      'rounded-md border px-3 py-2.5',
                      isCurrent ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/30' : 'border-line bg-surface-muted',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-medium', isCurrent ? 'text-brand-900 dark:text-brand-100' : 'text-ink')}>
                        {titleCase(role)}
                      </p>
                      {isCurrent && <Badge tone="brand" size="sm">Your role</Badge>}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{ROLE_DESCRIPTIONS[role]}</p>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
              Role changes are recorded in the workspace audit log. Raise a support request if your permissions do not
              match your responsibilities.
            </p>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Personal details"
              description="Shown on generated reports and audit entries"
              as="h3"
              icon={<UserRound className="size-3.5" />}
              badge={isDirty ? <Badge tone="warning" size="sm" dot>Unsaved</Badge> : undefined}
            />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                error={errors.name}
                required
                disabled={isSaving}
              />
              <Input
                label="Job title"
                value={form.jobTitle}
                onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
                placeholder="Climate data analyst"
                disabled={isSaving}
              />
              <Input
                label="Organisation"
                value={form.organisation}
                onChange={(event) => setForm((current) => ({ ...current, organisation: event.target.value }))}
                error={errors.organisation}
                required
                disabled={isSaving}
              />
              <Select
                label="Reporting timezone"
                value={form.timezone}
                onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
                hint="All timestamps in the workspace are displayed in this zone"
                disabled={isSaving}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </Select>
              <Input
                label="Email"
                value={user.email}
                readOnly
                disabled
                hint="Contact an administrator to change the registered address"
                containerClassName="sm:col-span-2"
              />
            </div>

            {saveError && (
              <p
                role="alert"
                className="mt-3 rounded-md border border-state-critical-200 bg-state-critical-50 px-3 py-2 text-xs text-state-critical-700 dark:border-state-critical-700 dark:bg-state-critical-900/30 dark:text-state-critical-200"
              >
                {saveError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForm({
                    name: user.name,
                    jobTitle: user.jobTitle,
                    organisation: user.organisation,
                    timezone: form.timezone,
                  })
                  setErrors({})
                  setSaveError(null)
                }}
                disabled={isSaving || !isDirty}
              >
                Discard changes
              </Button>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<Save className="size-4" />}
                onClick={() => void handleSave()}
                isLoading={isSaving}
                loadingText="Saving…"
                disabled={!isDirty}
              >
                Save profile
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Your notification preferences"
                description="Currently applied to this account"
                as="h3"
                icon={<Activity className="size-3.5" />}
                actions={
                  <Link
                    to={ROUTES.settings}
                    className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-200"
                  >
                    Edit
                  </Link>
                }
              />
              {settings ? (
                <ul className="mt-4 space-y-2.5">
                  <PreferenceRow label="Email" enabled={settings.notification.email} />
                  <PreferenceRow label="Browser push" enabled={settings.notification.push} />
                  <PreferenceRow label="SMS" enabled={settings.notification.sms} />
                  <PreferenceRow
                    label="Digest frequency"
                    enabled
                    value={titleCase(settings.notification.digestFrequency)}
                  />
                </ul>
              ) : (
                <p className="mt-4 text-xs text-ink-muted">Preferences are still loading.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Platform details" description="Build and environment information" as="h3" />
              <dl className="mt-4 space-y-2.5">
                <ReadOnlyRow label="Platform" value="EarthScape Climate Intelligence" />
                <ReadOnlyRow label="Workspace mode" value={env.useMockApi ? 'Mock data transport' : env.apiBaseUrl} />
                <ReadOnlyRow label="Timezone" value={form.timezone} />
              </dl>
              <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3">
                <EarthScapeLogo className="size-6 text-brand-600" />
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  Figures shown in this workspace are deterministic fixtures for interface review. Connect the Python
                  backend and set <code className="font-mono">VITE_USE_MOCK_API=false</code> for live data.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function PreferenceRow({ label, enabled, value }: { label: string; enabled: boolean; value?: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-ink-secondary">{label}</span>
      {value ? (
        <span className="font-medium text-ink">{value}</span>
      ) : (
        <Badge tone={enabled ? 'normal' : 'neutral'} size="sm" dot={enabled}>
          {enabled ? 'On' : 'Off'}
        </Badge>
      )}
    </li>
  )
}
