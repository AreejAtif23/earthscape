import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  LifeBuoy,
  Mail,
  MessageSquarePlus,
  Phone,
  Send,
  Star,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input, SegmentedControl, Select, Textarea } from '@/components/common/Form'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/Skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supportService } from '@/services'
import { ROUTES } from '@/routes/paths'
import { relativeTime } from '@/utils/date'
import { formatInteger, pluralise, titleCase } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { FaqItem, SupportRequestPayload, SupportTicket, TicketPriority, TicketStatus } from '@/types'

const FAQ_CATEGORIES: Array<{ value: FaqItem['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All topics' },
  { value: 'getting-started', label: 'Getting started' },
  { value: 'data', label: 'Data' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'predictions', label: 'Predictions' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'billing', label: 'Billing' },
]

const CATEGORY_LABELS: Record<SupportTicket['category'], string> = {
  technical: 'Technical fault',
  'data-quality': 'Data quality',
  access: 'Access and permissions',
  feedback: 'Feedback',
  other: 'Other',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  'waiting-on-you': 'Waiting on you',
  resolved: 'Resolved',
}

const STATUS_TONES: Record<TicketStatus, 'info' | 'warning' | 'neutral' | 'normal'> = {
  open: 'info',
  'in-progress': 'warning',
  'waiting-on-you': 'warning',
  resolved: 'normal',
}

const PRIORITY_TONES: Record<TicketPriority, 'neutral' | 'info' | 'warning' | 'critical'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'critical',
}

const PRIORITIES: Array<{ value: TicketPriority; label: string; hint: string }> = [
  { value: 'low', label: 'Low', hint: 'Question or minor inconvenience' },
  { value: 'medium', label: 'Medium', hint: 'A workflow is slower than expected' },
  { value: 'high', label: 'High', hint: 'Core analysis is blocked' },
  { value: 'urgent', label: 'Urgent', hint: 'Monitoring or alerting is unavailable' },
]

export function SupportPage() {
  const toast = useToast()
  const { user } = useAuth()

  const faq = useAsync(() => supportService.listFaq(), [])
  const tickets = useAsync(() => supportService.listTickets(), [])

  const [query, setQuery] = useState('')
  const [faqCategory, setFaqCategory] = useState<FaqItem['category'] | 'all'>('all')
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)

  const [form, setForm] = useState<SupportRequestPayload>({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
    email: user?.email ?? '',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SupportRequestPayload, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackArea, setFeedbackArea] = useState('Analytics')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)

  const filteredFaq = useMemo(() => {
    const items = faq.data ?? []
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesCategory = faqCategory === 'all' || item.category === faqCategory
      const matchesQuery =
        needle.length === 0 ||
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle)
      return matchesCategory && matchesQuery
    })
  }, [faq.data, faqCategory, query])

  const validateForm = () => {
    const errors: Partial<Record<keyof SupportRequestPayload, string>> = {}
    if (form.subject.trim().length < 6) errors.subject = 'Give the request a subject of at least 6 characters.'
    if (form.description.trim().length < 20) errors.description = 'Describe the problem in at least 20 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitTicket = async () => {
    setSubmitError(null)
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const ticket = await supportService.createTicket({
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
        email: form.email.trim(),
      })
      setCreatedTicket(ticket)
      tickets.reload()
      toast.success('Request submitted', `Reference ${ticket.reference} — we reply within one business day.`)
      setForm({ subject: '', category: 'technical', priority: 'medium', description: '', email: user?.email ?? '' })
      setFormErrors({})
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The request could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitFeedback = async () => {
    if (rating === 0) {
      toast.error('Choose a rating', 'Select a score from one to five before sending feedback.')
      return
    }
    setIsSendingFeedback(true)
    try {
      await supportService.submitFeedback({
        rating,
        area: feedbackArea,
        comment: feedbackComment.trim(),
        email: user?.email ?? '',
      })
      toast.success('Feedback recorded', 'Thank you — the product team reviews this weekly.')
      setRating(0)
      setHoverRating(0)
      setFeedbackComment('')
    } catch (error) {
      toast.error('Feedback not sent', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setIsSendingFeedback(false)
    }
  }

  const activeTickets = (tickets.data ?? []).filter((ticket) => ticket.status !== 'resolved')

  return (
    <>
      <PageHeader
        title="Support"
        description="Find answers in the knowledge base, track open requests, or raise a new ticket with the operations team."
        breadcrumb={[{ label: 'Workspace', to: ROUTES.dashboard }, { label: 'Support' }]}
        meta={
          <>
            <MetaItem label="Open requests" value={activeTickets.length} />
            <MetaItem label="Knowledge base" value={`${faq.data?.length ?? 0} articles`} />
            <MetaItem label="Response target" value="1 business day" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card padding="none">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                <BookOpen className="size-3.5" aria-hidden="true" />
              </span>
              <div className="mr-auto">
                <h2 className="text-sm font-semibold text-ink">Knowledge base</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {faq.isLoading
                    ? 'Loading articles…'
                    : `${filteredFaq.length} of ${faq.data?.length ?? 0} ${pluralise(faq.data?.length ?? 0, 'article')}`}
                </p>
              </div>
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search articles"
                label="Search knowledge base"
                size="sm"
                className="w-full sm:w-64"
              />
            </div>

            <div className="border-b border-line px-4 py-2.5">
              <div className="max-w-full overflow-x-auto scrollbar-thin pb-0.5">
                <SegmentedControl
                  label="Filter articles by topic"
                  size="sm"
                  value={faqCategory}
                  onChange={(value) => setFaqCategory(value)}
                  options={FAQ_CATEGORIES.map((category) => ({ value: category.value, label: category.label }))}
                />
              </div>
            </div>

            {faq.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : faq.error ? (
              <ErrorState description={faq.error} onRetry={() => faq.reload()} className="m-4" />
            ) : filteredFaq.length === 0 ? (
              <EmptyState
                title="No articles match this search"
                description="Try a different term, or clear the topic filter."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setFaqCategory('all')
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {filteredFaq.map((item) => {
                  const isOpen = openFaqId === item.id
                  return (
                    <li key={item.id}>
                      <h3>
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-panel-${item.id}`}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-ink">{item.question}</span>
                            <span className="mt-0.5 block text-[11px] text-ink-muted">
                              {titleCase(item.category)} · {item.answer.length} characters
                            </span>
                          </span>
                          <ChevronDown
                            className={cn(
                              'size-4 shrink-0 text-ink-faint transition-transform duration-200',
                              isOpen && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </h3>
                      {isOpen && (
                        <div id={`faq-panel-${item.id}`} className="border-t border-line bg-surface-muted px-4 py-3">
                          <p className="text-xs leading-relaxed text-ink-secondary">{item.answer}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Raise a request"
              description="Requests are routed to the operations team with a reference number"
              as="h3"
              icon={<MessageSquarePlus className="size-3.5" />}
            />

            {createdTicket && (
              <div className="mt-4 rounded-md border border-state-normal-200 bg-state-normal-50 px-3 py-3 dark:border-state-normal-700 dark:bg-state-normal-900/30">
                <p className="text-xs font-medium text-state-normal-800 dark:text-state-normal-200">
                  Request {createdTicket.reference} received
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-state-normal-700 dark:text-state-normal-200">
                  Assigned to {createdTicket.assignee}. We reply to {createdTicket.reference} within one business day;
                  you can track it in the request list below.
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Subject"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                error={formErrors.subject}
                placeholder="Ingestion stalls at 60 % on a 4 MB CSV"
                required
                containerClassName="sm:col-span-2"
                disabled={isSubmitting}
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value as SupportTicket['category'] }))
                }
                disabled={isSubmitting}
              >
                {(Object.keys(CATEGORY_LABELS) as Array<SupportTicket['category']>).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </Select>
              <Select
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value as TicketPriority }))
                }
                hint={PRIORITIES.find((entry) => entry.value === form.priority)?.hint}
                disabled={isSubmitting}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
              <Input
                type="email"
                label="Reply-to email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                error={formErrors.email}
                required
                disabled={isSubmitting}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="What happened?"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  error={formErrors.description}
                  rows={4}
                  required
                  disabled={isSubmitting}
                  hint="Include the dataset name, the route you were on, and anything already shown in the browser console"
                  placeholder="Steps to reproduce, expected result, actual result…"
                />
              </div>
            </div>

            {submitError && (
              <p
                role="alert"
                className="mt-3 rounded-md border border-state-critical-200 bg-state-critical-50 px-3 py-2 text-xs text-state-critical-700 dark:border-state-critical-700 dark:bg-state-critical-900/30 dark:text-state-critical-200"
              >
                {submitError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForm({
                    subject: '',
                    category: 'technical',
                    priority: 'medium',
                    description: '',
                    email: user?.email ?? '',
                  })
                  setFormErrors({})
                  setCreatedTicket(null)
                }}
                disabled={isSubmitting}
              >
                Reset form
              </Button>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<Send className="size-4" />}
                onClick={() => void submitTicket()}
                isLoading={isSubmitting}
                loadingText="Submitting…"
              >
                Submit request
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your requests" description="Most recent first" as="h3" icon={<LifeBuoy className="size-3.5" />} />
            <div className="mt-4">
              {tickets.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : tickets.error ? (
                <ErrorState description={tickets.error} onRetry={() => tickets.reload()} />
              ) : (tickets.data?.length ?? 0) === 0 ? (
                <EmptyState
                  size="sm"
                  title="No requests yet"
                  description="Requests you raise appear here with their status and reference."
                />
              ) : (
                <ul className="space-y-2">
                  {tickets.data?.map((ticket) => (
                    <li key={ticket.id} className="rounded-md border border-line bg-surface-muted p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-muted">{ticket.reference}</span>
                        <Badge tone={STATUS_TONES[ticket.status]} size="sm" dot>
                          {STATUS_LABELS[ticket.status]}
                        </Badge>
                        <Badge tone={PRIORITY_TONES[ticket.priority]} size="sm">
                          {titleCase(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-ink">{ticket.subject}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                        {CATEGORY_LABELS[ticket.category]} · {ticket.assignee} · {ticket.messageCount}{' '}
                        {pluralise(ticket.messageCount, 'message')} · updated {relativeTime(ticket.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Contact channels" description="For incidents outside the workspace" as="h3" />
            <ul className="mt-4 space-y-3">
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
                  <Mail className="size-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">Operations desk</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">operations@earthscape.example</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
                  <Phone className="size-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">24/7 incident line</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">+44 20 7946 0812 · option 2</p>
                </div>
              </li>
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
              Urgent priority requests are acknowledged within 30 minutes during business hours. For an active alerting
              outage, call the incident line and quote your workspace reference.
            </p>
          </Card>

          <Card>
            <CardHeader title="Rate the workspace" description="Anonymous unless you add an email" as="h3" />
            <fieldset className="mt-4">
              <legend className="sr-only">Satisfaction rating from one to five</legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const isActive = value <= (hoverRating || rating)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onFocus={() => setHoverRating(value)}
                      onBlur={() => setHoverRating(0)}
                      aria-label={`${value} of 5`}
                      aria-pressed={rating === value}
                      className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <Star
                        className={cn(
                          'size-5 transition-colors',
                          isActive ? 'fill-state-warning-500 text-state-warning-500' : 'text-ink-faint',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  )
                })}
                {rating > 0 && (
                  <span className="ml-1 text-xs text-ink-muted" aria-live="polite">
                    {rating} of 5
                  </span>
                )}
              </div>
            </fieldset>

            <div className="mt-3 space-y-3">
              <Select
                label="Which area?"
                value={feedbackArea}
                onChange={(event) => setFeedbackArea(event.target.value)}
                selectSize="sm"
              >
                {['Analytics', 'Predictions', 'Alerts', 'Data management', 'Reports', 'Overall'].map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Comment"
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                rows={3}
                placeholder="What worked well, and what slowed you down?"
              />
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leadingIcon={<Send className="size-4" />}
                onClick={() => void submitFeedback()}
                isLoading={isSendingFeedback}
                loadingText="Sending…"
              >
                Send feedback
              </Button>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {formatInteger(1_284)} ratings collected this quarter. Feedback is reviewed by the product team every
                second Thursday.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
