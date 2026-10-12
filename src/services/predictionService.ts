import { apiRequest } from './httpClient'
import { ML_MODELS, PREDICTION_SERIES } from '@/data/predictions'
import { formatIsoWithOffset } from '@/data/climate'
import type { ClimateMetric, ModelDescriptor, PredictionSeries } from '@/types'

export const predictionService = {
  /** REST contract: GET /predictions */
  async getPredictions(metrics: ClimateMetric[], horizonDays: number): Promise<PredictionSeries[]> {
    return apiRequest<PredictionSeries[]>({
      url: '/predictions',
      params: { metrics: metrics.join(','), horizon: horizonDays },
      latencyMs: 640,
      mock: () =>
        PREDICTION_SERIES.filter((series) => metrics.includes(series.metric)).map((series) => ({
          ...series,
          predicted: series.predicted.slice(0, horizonDays),
          lowerBound: series.lowerBound.slice(0, horizonDays),
          upperBound: series.upperBound.slice(0, horizonDays),
        })),
    })
  },

  /** REST contract: GET /predictions/models */
  async listModels(): Promise<ModelDescriptor[]> {
    return apiRequest<ModelDescriptor[]>({
      url: '/predictions/models',
      latencyMs: 420,
      mock: () => ML_MODELS,
    })
  },

  async getGeneratedAt(): Promise<string> {
    return apiRequest<string>({
      url: '/predictions/generated-at',
      latencyMs: 160,
      mock: () => formatIsoWithOffset(0, 5),
    })
  },
}
