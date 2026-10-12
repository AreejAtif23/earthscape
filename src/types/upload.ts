export type UploadStage =
  | 'idle'
  | 'file-selected'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'

export interface UploadValidation {
  isCsv: boolean
  hasHeader: boolean
  detectedColumns: string[]
  estimatedRows: number | null
  issues: Array<{
    id: string
    field: string
    message: string
    severity: 'info' | 'warning' | 'error'
  }>
}

export const UPLOAD_STAGE_SEQUENCE: UploadStage[] = [
  'file-selected',
  'validating',
  'uploading',
  'processing',
  'completed',
]

export const UPLOAD_STAGE_LABELS: Record<UploadStage, string> = {
  idle: 'Awaiting file',
  'file-selected': 'File selected',
  validating: 'Validating',
  uploading: 'Uploading',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}
