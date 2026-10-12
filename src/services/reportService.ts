import { apiRequest } from './httpClient'
import { buildReportPreview, REPORT_HISTORY } from '@/data/reports'
import type { GeneratedReport, ReportConfig, ReportPreview } from '@/types'

export const reportService = {
  /** REST contract: POST /reports/preview */
  async previewReport(config: ReportConfig): Promise<ReportPreview> {
    return apiRequest<ReportPreview>({
      url: '/reports/preview',
      method: 'post',
      body: config,
      latencyMs: 700,
      mock: () => buildReportPreview(config),
    })
  },

  /** REST contract: POST /reports */
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    return apiRequest<GeneratedReport>({
      url: '/reports',
      method: 'post',
      body: config,
      latencyMs: 1_400,
      mock: () => ({
        id: `rpt-${Date.now()}`,
        title: config.title,
        reportType: config.reportType,
        location: config.location === 'all' ? 'All stations' : config.location,
        periodLabel: `${config.dateFrom} – ${config.dateTo}`,
        createdAt: new Date().toISOString(),
        createdBy: 'a.rahman',
        status: 'ready' as const,
        sizeKb: 1_420 + config.title.length * 3,
        format: config.format,
        sections: buildReportPreview(config).sectionsIncluded,
      }),
    })
  },

  /** REST contract: GET /reports */
  async listReports(): Promise<GeneratedReport[]> {
    return apiRequest<GeneratedReport[]>({
      url: '/reports',
      latencyMs: 420,
      mock: () => REPORT_HISTORY,
    })
  },

  /**
   * REST contract: GET /reports/{id}/download
   * The Python backend will stream the rendered PDF; the mock resolves a
   * text manifest so the download flow stays testable without a backend.
   */
  async downloadReport(reportId: string, config?: ReportConfig): Promise<{ blob: Blob; fileName: string }> {
    return apiRequest<{ blob: Blob; fileName: string }>({
      url: `/reports/${reportId}/download`,
      latencyMs: 900,
      mock: () => {
        const report = REPORT_HISTORY.find((entry) => entry.id === reportId)
        const fileName = `${(report?.title ?? 'earthscape-report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${config?.format ?? report?.format ?? 'pdf'}`
        const body = [
          'EARTHSCAPE CLIMATE INTELLIGENCE PLATFORM',
          'Mock export — generated locally because VITE_USE_MOCK_API is enabled.',
          '',
          `Report:    ${report?.title ?? config?.title ?? 'Untitled'}`,
          `Reference: ${reportId}`,
          `Location:  ${report?.location ?? config?.location ?? 'all'}`,
          `Period:    ${report?.periodLabel ?? `${config?.dateFrom ?? ''} – ${config?.dateTo ?? ''}`}`,
          '',
          'Connect the Python backend and set VITE_USE_MOCK_API=false to receive the rendered document.',
        ].join('\n')
        return { blob: new Blob([body], { type: 'text/plain' }), fileName }
      },
    })
  },
}
