import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileSpreadsheet,
  Info,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { MetaItem, PageHeader } from '@/layouts/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input, Textarea } from '@/components/common/Form'
import { ProgressBar } from '@/components/common/Progress'
import { EmptyState } from '@/components/common/States'
import { useToast } from '@/hooks/useToast'
import { uploadService, validateCsvLocally, REQUIRED_CSV_COLUMNS, OPTIONAL_CSV_COLUMNS, MAX_UPLOAD_BYTES } from '@/services'
import { ROUTES } from '@/routes/paths'
import { formatDateTime } from '@/utils/date'
import { formatFileSize, formatInteger } from '@/utils/format'
import { cn } from '@/utils/cn'
import { UPLOAD_STAGE_LABELS } from '@/types/upload'
import type { UploadJob, UploadStage } from '@/types'

const STAGE_ORDER: UploadStage[] = ['idle', 'file-selected', 'validating', 'uploading', 'processing', 'completed']

const SAMPLE_ROWS = [
  'date,location,temperature,humidity,rainfall,wind_speed,sensor_id',
  '2026-01-14,Lisbon,17.4,72,4.2,11.2,SNS-LIS-04',
  '2026-01-14,Nairobi,26.1,58,0.0,6.4,SNS-NBO-11',
  '2026-01-14,Oslo,-3.2,81,7.8,18.9,SNS-OSL-02',
]

export function DataUploadPage() {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedAt, setSelectedAt] = useState<string | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [notes, setNotes] = useState('')
  const [stage, setStage] = useState<UploadStage>('idle')
  const [progress, setProgress] = useState(0)
  const [job, setJob] = useState<UploadJob | null>(null)
  const [localIssues, setLocalIssues] = useState<UploadJob['problems']>([])
  const [formError, setFormError] = useState<string | null>(null)

  const selectFile = useCallback((nextFile: File) => {
    const validation = validateCsvLocally(nextFile)
    setLocalIssues(validation.issues)
    setFile(nextFile)
    setSelectedAt(new Date().toISOString())
    setJob(null)
    setProgress(0)
    setStage(validation.issues.length > 0 ? 'failed' : 'file-selected')
    setDatasetName((current) => current || nextFile.name.replace(/\.csv$/i, '').replace(/[-_]+/g, ' '))
  }, [])

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) selectFile(dropped)
  }

  const clearSelection = () => {
    setFile(null)
    setJob(null)
    setLocalIssues([])
    setStage('idle')
    setProgress(0)
    setFormError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const startUpload = async () => {
    if (!file) {
      setFormError('Choose a CSV file before starting the upload.')
      return
    }
    if (!datasetName.trim()) {
      setFormError('Give the dataset a name so it can be found in the catalogue.')
      return
    }
    if (localIssues.length > 0) {
      setFormError('Resolve the file problems listed below before uploading.')
      return
    }

    setFormError(null)
    setStage('uploading')
    try {
      const result = await uploadService.uploadDataset(file, datasetName.trim(), setProgress)
      setJob(result)
      setStage(result.stage)
      if (result.stage === 'completed') {
        toast.success('Dataset ingested', `${result.rowCount ?? 0} rows added to the catalogue.`)
      } else {
        toast.error('Ingestion failed', 'The validation report explains what needs attention.')
      }
    } catch (error) {
      setStage('failed')
      setFormError(error instanceof Error ? error.message : 'The upload could not be completed.')
    }
  }

  const blockingProblems = [...localIssues, ...(job?.problems ?? [])].filter(
    (problem) => problem.severity === 'error',
  )
  const isBusy = stage === 'validating' || stage === 'uploading' || stage === 'processing'

  return (
    <>
      <PageHeader
        title="Upload dataset"
        description="Ingest a CSV export into the climate catalogue. The header is validated against the platform schema before any record is written."
        breadcrumb={[
          { label: 'Climate data', to: ROUTES.climateData },
          { label: 'Upload dataset' },
        ]}
        actions={
          <Link
            to={ROUTES.dataCleaning}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-muted"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Review cleaning queue
          </Link>
        }
        meta={
          <>
            <MetaItem label="Accepted" value="CSV, max 25 MB" />
            <MetaItem label="Required columns" value={REQUIRED_CSV_COLUMNS.length} />
            <MetaItem label="Optional columns" value={OPTIONAL_CSV_COLUMNS.length} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="1 · Select a file"
              description="Drag a CSV into the drop zone, or browse from disk"
              as="h3"
              icon={<FileSpreadsheet className="size-3.5" />}
              badge={file ? <Badge tone="normal" size="sm">Selected</Badge> : undefined}
            />

            <div
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'mt-4 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors',
                isDragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-line-strong bg-surface-muted',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                id="dataset-file"
                onChange={(event) => {
                  const selected = event.target.files?.[0]
                  if (selected) selectFile(selected)
                }}
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-brand-700 dark:text-brand-200">
                    <FileSpreadsheet className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{file.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatFileSize(file.size)}
                      {selectedAt ? ` · selected ${formatDateTime(selectedAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={isBusy}>
                      Choose a different file
                    </Button>
                    <Button size="sm" variant="ghost" leadingIcon={<X className="size-3.5" />} onClick={clearSelection} disabled={isBusy}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint">
                    <Upload className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">Drop your CSV here</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Comma-separated values with a header row, up to {formatFileSize(MAX_UPLOAD_BYTES)}
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => inputRef.current?.click()}>
                    Browse files
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="2 · Describe the dataset"
              description="Metadata used by the catalogue, cleaning queue and reporting layer"
              as="h3"
            />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Dataset name"
                value={datasetName}
                onChange={(event) => setDatasetName(event.target.value)}
                placeholder="Coastal network Q1 2026"
                required
                disabled={isBusy}
                hint="Shown in the catalogue and in generated dossiers"
              />
              <Input
                label="Source reference"
                placeholder="Agency export batch 2026-014"
                disabled={isBusy}
                hint="Optional: the originating system or batch"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Instrumentation changes, calibration visits, known outages…"
                  rows={3}
                  disabled={isBusy}
                  hint="Retained with the dataset and reproduced in the methodology appendix"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="3 · Validate and ingest"
              description="Validation runs locally, then the dataset is written to the catalogue"
              as="h3"
              icon={<Sparkles className="size-3.5" />}
            />

            <div className="mt-4">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
                {STAGE_ORDER.map((entry, index) => {
                  const isDone = STAGE_ORDER.indexOf(stage) > index || stage === 'completed'
                  const isCurrent = stage === entry
                  const isFailed = stage === 'failed' && entry === 'file-selected'
                  return (
                    <li key={entry} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                          isFailed
                            ? 'border-state-critical-500 bg-state-critical-50 text-state-critical-700 dark:bg-state-critical-900 dark:text-state-critical-200'
                            : isDone
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : isCurrent
                                ? 'border-brand-600 text-brand-700 dark:text-brand-200'
                                : 'border-line-strong text-ink-faint',
                        )}
                        aria-hidden="true"
                      >
                        {isFailed ? <AlertTriangle className="size-3" /> : isDone ? <CheckCircle2 className="size-3" /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] whitespace-nowrap',
                          isDone || isCurrent ? 'font-medium text-ink' : 'text-ink-faint',
                        )}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {UPLOAD_STAGE_LABELS[entry]}
                      </span>
                      {index < STAGE_ORDER.length - 1 && <span className="h-px w-4 bg-line" aria-hidden="true" />}
                    </li>
                  )
                })}
              </ol>
            </div>

            {isBusy && (
              <div className="mt-4">
                <ProgressBar
                  value={progress}
                  label="Upload progress"
                  size="md"
                  tone="brand"
                  valueFormatter={(value) => `${Math.round(value)}%`}
                />
                <p className="mt-1.5 text-[11px] text-ink-muted" role="status" aria-live="polite">
                  {stage === 'uploading' ? 'Streaming rows to the ingestion service…' : 'Parsing and validating rows…'}
                </p>
              </div>
            )}

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-state-critical-200 bg-state-critical-50 px-3 py-2 text-xs text-state-critical-700 dark:border-state-critical-700 dark:bg-state-critical-900/30 dark:text-state-critical-200"
              >
                {formError}
              </p>
            )}

            {job && (
              <div className="mt-4 rounded-md border border-line bg-surface-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink">Ingestion report</p>
                  <Badge tone={job.stage === 'completed' ? 'normal' : 'critical'} size="sm" dot>
                    {UPLOAD_STAGE_LABELS[job.stage]}
                  </Badge>
                </div>
                <dl className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ReportStat label="Rows" value={formatInteger(job.rowCount ?? 0)} />
                  <ReportStat label="Columns" value={formatInteger(job.columnCount ?? 0)} />
                  <ReportStat label="Size" value={formatFileSize(job.fileSizeBytes)} />
                  <ReportStat label="Dataset" value={job.resultDatasetId ?? 'Not created'} />
                </dl>
                {job.stage === 'completed' && (
                  <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
                    The dataset is available in the catalogue.{' '}
                    <Link to={ROUTES.climateData} className="font-medium text-brand-700 hover:underline dark:text-brand-200">
                      Open the climate data catalogue
                    </Link>{' '}
                    to browse the records, or review it in{' '}
                    <Link to={ROUTES.dataCleaning} className="font-medium text-brand-700 hover:underline dark:text-brand-200">
                      data cleaning
                    </Link>{' '}
                    before it is used in a report.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={isBusy}>
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<Upload className="size-4" />}
                onClick={() => void startUpload()}
                isLoading={isBusy}
                loadingText="Ingesting…"
                disabled={!file || blockingProblems.length > 0}
              >
                Validate and ingest
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Schema"
              description="Columns the platform expects"
              as="h3"
              icon={<CircleDashed className="size-3.5" />}
            />
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Required</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {REQUIRED_CSV_COLUMNS.map((column) => (
                    <li key={column}>
                      <code className="rounded-sm border border-line bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary">
                        {column}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Optional</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {OPTIONAL_CSV_COLUMNS.map((column) => (
                    <li key={column}>
                      <code className="rounded-sm border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                        {column}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Validation" description="Problems found in the selected file" as="h3" />
            <div className="mt-4">
              {!file ? (
                <EmptyState
                  size="sm"
                  title="No file selected"
                  description="Choose a CSV and the validation report appears here."
                />
              ) : blockingProblems.length === 0 && (job?.problems.length ?? 0) === 0 ? (
                <div className="flex items-start gap-2.5 rounded-md border border-state-normal-200 bg-state-normal-50 px-3 py-2.5 dark:border-state-normal-700 dark:bg-state-normal-900/30">
                  <CheckCircle2 className="mt-px size-4 shrink-0 text-state-normal-600 dark:text-state-normal-200" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-state-normal-700 dark:text-state-normal-200">
                    No blocking problems detected. The dataset can be ingested.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {[...localIssues, ...(job?.problems ?? [])].map((problem) => (
                    <li
                      key={problem.id}
                      className={cn(
                        'flex items-start gap-2.5 rounded-md border px-3 py-2.5',
                        problem.severity === 'error'
                          ? 'border-state-critical-200 bg-state-critical-50 dark:border-state-critical-700 dark:bg-state-critical-900/30'
                          : problem.severity === 'warning'
                            ? 'border-state-warning-200 bg-state-warning-50 dark:border-state-warning-700 dark:bg-state-warning-900/30'
                            : 'border-state-info-200 bg-state-info-50 dark:border-state-info-700 dark:bg-state-info-900/30',
                      )}
                    >
                      {problem.severity === 'error' ? (
                        <AlertTriangle className="mt-px size-4 shrink-0 text-state-critical-600 dark:text-state-critical-200" aria-hidden="true" />
                      ) : problem.severity === 'warning' ? (
                        <Info className="mt-px size-4 shrink-0 text-state-warning-600 dark:text-state-warning-200" aria-hidden="true" />
                      ) : (
                        <Info className="mt-px size-4 shrink-0 text-state-info-600 dark:text-state-info-200" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink">{problem.field}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{problem.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Expected format" description="Minimal working example" as="h3" />
            <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-surface-muted p-3 font-mono text-[10px] leading-relaxed text-ink-secondary scrollbar-thin">
              {SAMPLE_ROWS.join('\n')}
            </pre>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              Dates use ISO 8601. Numeric fields are parsed with the file locale; a value that cannot be parsed is
              stored as null and flagged in the cleaning queue rather than rejected outright.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-ink">{value}</dd>
    </div>
  )
}
