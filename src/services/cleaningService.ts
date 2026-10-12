import { apiRequest } from './httpClient'
import { buildCleaningSummary, CLEANING_DATASETS } from '@/data/operations'
import type { CleaningSummary } from '@/types'

export const cleaningService = {
  /** REST contract: GET /cleaning/datasets */
  async listCleanableDatasets() {
    return apiRequest<typeof CLEANING_DATASETS>({
      url: '/cleaning/datasets',
      latencyMs: 380,
      mock: () => CLEANING_DATASETS,
    })
  },

  /** REST contract: GET /cleaning/{datasetId}/summary */
  async getCleaningSummary(datasetId: string): Promise<CleaningSummary> {
    return apiRequest<CleaningSummary>({
      url: `/cleaning/${datasetId}/summary`,
      latencyMs: 640,
      mock: () => buildCleaningSummary(datasetId),
    })
  },

  /** REST contract: POST /cleaning/{datasetId}/run — executes the Python pipeline */
  async runCleaning(datasetId: string, enabledRuleIds: string[]): Promise<CleaningSummary> {
    return apiRequest<CleaningSummary>({
      url: `/cleaning/${datasetId}/run`,
      method: 'post',
      body: { rules: enabledRuleIds },
      latencyMs: 1_600,
      mock: () => buildCleaningSummary(datasetId),
    })
  },
}
