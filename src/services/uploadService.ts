import { apiRequest } from './httpClient'
import type { UploadJob } from '@/types'

export const REQUIRED_CSV_COLUMNS = [
  'date',
  'location',
  'temperature',
  'humidity',
  'rainfall',
  'wind_speed',
  'sensor_id',
] as const

export const OPTIONAL_CSV_COLUMNS = ['pressure', 'solar_radiation', 'station_id'] as const

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

export interface LocalValidationResult {
  isCsv: boolean
  hasHeader: boolean
  detectedColumns: string[]
  estimatedRows: number | null
  issues: UploadJob['problems']
}

export function validateCsvLocally(file: File): LocalValidationResult {
  const issues: UploadJob['problems'] = []
  const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'

  if (!isCsv) {
    issues.push({
      id: 'prb-filetype',
      field: 'file',
      message: 'Only .csv files are accepted. Convert the dataset before uploading.',
      severity: 'error',
    })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    issues.push({
      id: 'prb-size',
      field: 'file',
      message: 'File exceeds the 25 MB upload limit.',
      severity: 'error',
    })
  }

  if (file.size === 0) {
    issues.push({ id: 'prb-empty', field: 'file', message: 'File is empty.', severity: 'error' })
  }

  return { isCsv, hasHeader: true, detectedColumns: [], estimatedRows: null, issues }
}

export const uploadService = {
  /**
   * REST contract: POST /uploads (multipart/form-data)
   * The real transport posts FormData through httpClient; apiRequest keeps the
   * identical call signature so switching off mock mode requires no page changes.
   */
  async uploadDataset(file: File, datasetName: string, onProgress: (percent: number) => void): Promise<UploadJob> {
    return apiRequest<UploadJob>({
      url: '/uploads',
      method: 'post',
      body: { datasetName },
      latencyMs: 400,
      async mock() {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
        const header = (lines[0] ?? '').split(',').map((column) => column.trim().toLowerCase())
        const rowCount = Math.max(0, lines.length - 1)
        const missing = REQUIRED_CSV_COLUMNS.filter((column) => !header.includes(column))
        const problems: UploadJob['problems'] = missing.map((column) => ({
          id: `prb-${column}`,
          field: column,
          message: `Required column "${column}" was not detected in the header row.`,
          severity: 'error' as const,
        }))

        if (missing.length === 0 && rowCount === 0) {
          problems.push({
            id: 'prb-norows',
            field: 'rows',
            message: 'Header row detected but no data rows were found.',
            severity: 'error',
          })
        }

        for (let step = 1; step <= 12; step += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 70))
          onProgress(Math.min(100, Math.round((step / 12) * 100)))
        }

        const hasBlockingProblem = problems.some((problem) => problem.severity === 'error')
        return {
          id: `upl-${Date.now()}`,
          fileName: file.name,
          fileSizeBytes: file.size,
          rowCount,
          columnCount: header.length,
          stage: hasBlockingProblem ? 'failed' : 'completed',
          progress: 100,
          datasetName,
          source: 'csv',
          uploadedAt: new Date().toISOString(),
          problems,
          resultDatasetId: hasBlockingProblem ? null : `ds-${Date.now()}`,
        }
      },
    })
  },
}
