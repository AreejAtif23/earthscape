import { useEffect, useState } from 'react'
import {
  Bell,
  Contrast,
  Gauge,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Sliders,
  Sun,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input, SegmentedControl, Switch } from '@/components/common/Form'
import { ReadOnlyRow } from '@/components/account/ReadOnlyRow'
import { useAppearance } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { env } from '@/services'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'
import type { AlertThresholdPreference, AppearancePreference, NotificationPreference, UserSettings } from '@/types'

const DEFAULT_SETTINGS: UserSettings = {
  notification: { email: true, push: true, sms: false, digestFrequency: 'hourly' },
  thresholds: { temperatureHigh: 38, rainfallHeavy: 120, windSevere: 22, humidityLow: 25 },
  appearance: { theme: 'system', density: 'comfortable', reduceMotion: false },
}

const THRESHOLD_FIELDS: Array<{
  key: keyof AlertThresholdPreference
  label: string
  unit: string
  step: number
  hint: string
}> = [
  {
    key: 'temperatureHigh',
    label: 'High temperature',
    unit: '°C',
    step: 0.5,
    hint: 'Raise a high alert when a station reports above this value',
  },
  {
    key: 'rainfallHeavy',
    label: 'Heavy rainfall',
    unit: 'mm / 24 h',
    step: 5,
    hint: 'Accumulated rainfall over a rolling 24-hour window',
  },
  {
    key: 'windSevere',
    label: 'Severe wind',
    unit: 'm/s',
    step: 0.5,
    hint: 'Sustained wind speed at the ten-minute mean',
  },
  {
    key: 'humidityLow',
    label: 'Low humidity',
    unit: '%',
    step: 1,
    hint: 'Dry-condition warning, common during desert dust events',
  },
]

const DIGEST_OPTIONS: Array<{ value: NotificationPreference['digestFrequency']; label: string }> = [
  { value: 'realtime', label: 'Real time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

const THEME_OPTIONS: Array<{
  value: AppearancePreference['theme']
  label: string
  icon: React.ReactNode
}> = [
  { value: 'light', label: 'Light', icon: <Sun className="size-3.5" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="size-3.5" /> },
  { value: 'system', label: 'System', icon: <Monitor className="size-3.5" /> },
]

export function SettingsPage() {
  const toast = useToast()
  const { settings, updateSettings, user } = useAuth()
  const { resolvedTheme, setAppearance } = useAppearance()

  const [draft, setDraft] = useState<UserSettings>(settings ?? DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (settings) setDraft(settings)
  }, [settings])

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings ?? DEFAULT_SETTINGS)

  const patchNotification = (updates: Partial<NotificationPreference>) =>
    setDraft((current) => ({ ...current, notification: { ...current.notification, ...updates } }))

  const patchThreshold = (key: keyof AlertThresholdPreference, value: number) =>
    setDraft((current) => ({ ...current, thresholds: { ...current.thresholds, [key]: value } }))

  const patchAppearance = (updates: Partial<AppearancePreference>) => {
    const next = { ...draft.appearance, ...updates }
    setDraft((current) => ({ ...current, appearance: next }))
    setAppearance(next)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateSettings(draft)
      setSavedAt(new Date().toISOString())
      toast.success('Preferences saved', 'Your workspace settings are up to date.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The preferences could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setDraft(DEFAULT_SETTINGS)
    setAppearance(DEFAULT_SETTINGS.appearance)
    setSaveError(null)
    toast.info('Defaults restored', 'Review the changes and save to apply them to your account.')
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Personal preferences for this workspace. Changes apply to your account only and do not alter shared station data."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Settings' }]}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<RotateCcw className="size-4" />}
              onClick={handleReset}
              disabled={isSaving}
            >
              Restore defaults
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
              Save changes
            </Button>
          </>
        }
        meta={
          <>
            <MetaItem label="Account" value={user?.email ?? '—'} />
            <MetaItem label="Unsaved changes" value={isDirty ? 'Yes' : 'None'} />
            <MetaItem label="Environment" value={env.useMockApi ? 'Mock data' : 'Live API'} />
          </>
        }
      />

      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-state-critical-200 bg-state-critical-50 px-3 py-2.5 text-xs text-state-critical-700 dark:border-state-critical-700 dark:bg-state-critical-900/30 dark:text-state-critical-200"
        >
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Notifications"
            description="How the platform reaches you when an alert fires"
            as="h3"
            icon={<Bell className="size-3.5" />}
            badge={<Badge tone="outline">Account scope</Badge>}
          />
          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              <Switch
                label="Email"
                description="Alert summaries and anomaly digests to your registered address"
                checked={draft.notification.email}
                onCheckedChange={(value) => patchNotification({ email: value })}
                disabled={isSaving}
              />
              <Switch
                label="Browser push"
                description="Desktop notifications while the workspace is open in this browser"
                checked={draft.notification.push}
                onCheckedChange={(value) => patchNotification({ push: value })}
                disabled={isSaving}
              />
              <Switch
                label="SMS"
                description="Reserved for critical and urgent severities"
                checked={draft.notification.sms}
                onCheckedChange={(value) => patchNotification({ sms: value })}
                disabled={isSaving}
              />
            </div>

            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium text-ink-secondary">Digest frequency</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Controls how non-urgent notifications are batched. Critical alerts are always delivered immediately.
              </p>
              <SegmentedControl
                label="Digest frequency"
                size="sm"
                className="mt-2"
                value={draft.notification.digestFrequency}
                onChange={(value) => patchNotification({ digestFrequency: value })}
                options={DIGEST_OPTIONS}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Alert thresholds"
            description="Values used by your personal threshold rules"
            as="h3"
            icon={<Gauge className="size-3.5" />}
            badge={<Badge tone="outline">4 rules</Badge>}
          />
          <div className="mt-4 space-y-3">
            {THRESHOLD_FIELDS.map((field) => (
              <Input
                key={field.key}
                type="number"
                label={field.label}
                value={String(draft.thresholds[field.key])}
                step={field.step}
                min={0}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  if (Number.isFinite(parsed)) patchThreshold(field.key, parsed)
                }}
                hint={field.hint}
                trailingSlot={
                  <span className="pr-1 text-[11px] text-ink-muted">{field.unit}</span>
                }
                containerClassName="max-w-[15rem]"
                disabled={isSaving}
              />
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
            Workspace administrators publish the official threshold rules. These personal values only affect the rules
            you create yourself, and are recorded in the alert audit trail alongside each notification.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Appearance"
            description="Theme, density and motion preferences for this device"
            as="h3"
            icon={<Contrast className="size-3.5" />}
            badge={<Badge tone="brand">Applied now</Badge>}
          />
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-ink-secondary">Colour theme</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const isActive = draft.appearance.theme === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patchAppearance({ theme: option.value })}
                      aria-pressed={isActive}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                        isActive
                          ? 'border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-900/30 dark:text-brand-100'
                          : 'border-line bg-surface text-ink-secondary hover:bg-surface-muted',
                      )}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-ink-muted">
                Currently rendering in {resolvedTheme} mode
                {draft.appearance.theme === 'system' ? ' because the system preference is set' : ''}.
              </p>
            </div>

            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium text-ink-secondary">Table density</p>
              <p className="mt-0.5 text-xs text-ink-muted">Compact fits roughly a third more rows per screen.</p>
              <SegmentedControl
                label="Table density"
                size="sm"
                className="mt-2"
                value={draft.appearance.density}
                onChange={(value) => patchAppearance({ density: value })}
                options={[
                  { value: 'comfortable' as const, label: 'Comfortable' },
                  { value: 'compact' as const, label: 'Compact' },
                ]}
              />
            </div>

            <div className="border-t border-line pt-3">
              <Switch
                label="Reduce motion"
                description="Disable chart animation and page transitions. Your operating system setting is always respected."
                checked={draft.appearance.reduceMotion}
                onCheckedChange={(value) => patchAppearance({ reduceMotion: value })}
                disabled={isSaving}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Data and session"
            description="How this browser talks to the platform"
            as="h3"
            icon={<Sliders className="size-3.5" />}
          />
          <dl className="mt-4 space-y-3">
            <ReadOnlyRow label="Data source" value={env.useMockApi ? 'Local mock transport' : env.apiBaseUrl} />
            <ReadOnlyRow label="Request timeout" value={`${env.requestTimeoutMs} ms`} />
            <ReadOnlyRow label="Session storage" value="Browser local storage, cleared on sign out" />
            <ReadOnlyRow
              label="Last saved"
              value={savedAt ? new Date(savedAt).toLocaleString() : isDirty ? 'Unsaved changes on this device' : 'No changes in this session'}
            />
          </dl>

          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs font-medium text-ink-secondary">Danger zone</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-muted px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">Clear cached workspace data</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Removes cached responses and the session token from this browser. Datasets on the server are
                  untouched.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leadingIcon={<Loader2 className="size-4" />}
                onClick={() => {
                  toast.info('Nothing to clear in mock mode', 'Disable mock mode to manage real cached responses.')
                }}
              >
                Clear cache
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div
        className={cn(
          'sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-md transition-opacity',
          isDirty ? 'border-brand-300 bg-surface opacity-100' : 'border-line bg-surface opacity-0 pointer-events-none',
        )}
        aria-hidden={!isDirty}
      >
        <p className="text-xs text-ink-secondary">
          You have unsaved preference changes on this device.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={isSaving}>
            Discard
          </Button>
          <Button
            size="sm"
            variant="primary"
            leadingIcon={<Save className="size-4" />}
            onClick={() => void handleSave()}
            isLoading={isSaving}
            loadingText="Saving…"
          >
            Save changes
          </Button>
        </div>
      </div>
    </>
  )
}


