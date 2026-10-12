import type { UploadStage } from '@/types/upload'

export interface FaqItem {
  id: string
  category: 'getting-started' | 'data' | 'analytics' | 'predictions' | 'alerts' | 'billing'
  question: string
  answer: string
}

export type TicketStatus = 'open' | 'in-progress' | 'waiting-on-you' | 'resolved'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SupportTicket {
  id: string
  reference: string
  subject: string
  category: 'technical' | 'data-quality' | 'access' | 'feedback' | 'other'
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  updatedAt: string
  assignee: string
  messageCount: number
}

export interface SupportRequestPayload {
  subject: string
  category: SupportTicket['category']
  priority: TicketPriority
  description: string
  email: string
}

export interface FeedbackPayload {
  rating: number
  area: string
  comment: string
  email: string
}

export interface UploadTicket extends SupportTicket {
  uploadStage: UploadStage
}

export interface CleaningIssue {
  id: string
  rule: string
  category: 'missing' | 'duplicate' | 'invalid' | 'outlier' | 'format'
  severity: 'info' | 'warning' | 'error'
  column: string
  affectedRows: number
  description: string
  action: 'impute' | 'drop' | 'clip' | 'cast' | 'flag'
  selected: boolean
}

export interface CleaningSummary {
  datasetId: string
  datasetName: string
  totalRecords: number
  missingValues: number
  duplicateRecords: number
  invalidRecords: number
  outlierRecords: number
  cleanRecords: number
  columnCount: number
  qualityScoreBefore: number
  qualityScoreAfter: number
  processedAt: string
  issues: CleaningIssue[]
  columnProfiles: Array<{
    column: string
    dtype: string
    nullRate: number
    uniqueCount: number
    min: number | null
    max: number | null
    mean: number | null
  }>
  beforeAfter: Array<{
    dimension: string
    before: number
    after: number
  }>
}

export interface UploadJob {
  id: string
  fileName: string
  fileSizeBytes: number
  rowCount: number | null
  columnCount: number | null
  stage: UploadStage
  progress: number
  datasetName: string
  source: string
  uploadedAt: string
  problems: Array<{
    id: string
    field: string
    message: string
    severity: 'info' | 'warning' | 'error'
  }>
  resultDatasetId: string | null
}
