import { NETWORK_SERIES, addDaysFromReference, formatIso } from './climate'
import { createRng } from './seededRandom'
import { round } from '@/utils/number'
import type { ClimateMetric, ModelDescriptor, PredictionSeries, TrendDirection } from '@/types'

export const ML_MODELS: ModelDescriptor[] = [
  {
    id: 'mdl-xgboost-temp',
    name: 'EarthScape TempNet',
    family: 'Gradient Boosted Trees',
    version: 'v4.2.1',
    algorithm: 'XGBoost (quantile objective, 500 trees, depth 8)',
    trainedOn: formatIso(addDaysFromReference(-21)),
    trainingRecords: 4_182_640,
    metrics: [
      { name: 'MAE', value: 0.62, unit: '°C' },
      { name: 'RMSE', value: 0.94, unit: '°C' },
      { name: 'R²', value: 0.968, unit: '' },
      { name: 'Coverage', value: 94.1, unit: '%' },
    ],
    horizonDays: 14,
    status: 'deployed',
    description:
      'Primary short-horizon temperature forecaster. Trained on 10 years of station observations blended with reanalysis covariates.',
  },
  {
    id: 'mdl-tft-precip',
    name: 'HydroCast LSTM',
    family: 'Sequence Model',
    version: 'v2.8.0',
    algorithm: 'Temporal Fusion Transformer, 4 attention heads',
    trainedOn: formatIso(addDaysFromReference(-35)),
    trainingRecords: 2_904_115,
    metrics: [
      { name: 'MAE', value: 1.84, unit: 'mm' },
      { name: 'RMSE', value: 3.26, unit: 'mm' },
      { name: 'R²', value: 0.874, unit: '' },
      { name: 'CRPS', value: 0.412, unit: '' },
    ],
    horizonDays: 10,
    status: 'deployed',
    description:
      'Probabilistic precipitation model producing calibrated prediction intervals used by the flood advisory rule engine.',
  },
  {
    id: 'mdl-anomaly-iso',
    name: 'Sentinel-Detector',
    family: 'Unsupervised Anomaly',
    version: 'v1.9.3',
    algorithm: 'Isolation Forest + robust MAD z-score ensemble',
    trainedOn: formatIso(addDaysFromReference(-9)),
    trainingRecords: 1_204_880,
    metrics: [
      { name: 'Precision', value: 0.913, unit: '' },
      { name: 'Recall', value: 0.887, unit: '' },
      { name: 'F1', value: 0.9, unit: '' },
      { name: 'False positives', value: 2.4, unit: '%' },
    ],
    horizonDays: 0,
    status: 'deployed',
    description:
      'Flags readings that fall outside the learned seasonal envelope. Feeds the anomaly review queue and alert escalation path.',
  },
  {
    id: 'mdl-candidate-wind',
    name: 'Aeolus Wind Ensemble',
    family: 'Ensemble Regression',
    version: 'v0.9.0-rc3',
    algorithm: 'Gradient boosting ensemble, 24 members',
    trainedOn: formatIso(addDaysFromReference(-3)),
    trainingRecords: 980_442,
    metrics: [
      { name: 'MAE', value: 1.12, unit: 'm/s' },
      { name: 'RMSE', value: 1.88, unit: 'm/s' },
      { name: 'R²', value: 0.902, unit: '' },
      { name: 'Coverage', value: 89.6, unit: '%' },
    ],
    horizonDays: 7,
    status: 'candidate',
    description:
      'Challenger model for wind-speed forecasting. Under evaluation against the legacy statistical baseline before promotion.',
  },
]

interface PredictionConfig {
  metric: ClimateMetric
  label: string
  unit: string
  historyDays: number
  horizonDays: number
  intervalSpread: number
  trendBias: number
}

const PREDICTION_CONFIGS: PredictionConfig[] = [
  {
    metric: 'temperature',
    label: 'Temperature',
    unit: '°C',
    historyDays: 45,
    horizonDays: 14,
    intervalSpread: 1.35,
    trendBias: 0.55,
  },
  {
    metric: 'rainfall',
    label: 'Rainfall',
    unit: 'mm',
    historyDays: 45,
    horizonDays: 14,
    intervalSpread: 6.2,
    trendBias: 0.2,
  },
  {
    metric: 'humidity',
    label: 'Humidity',
    unit: '%',
    historyDays: 45,
    horizonDays: 14,
    intervalSpread: 4.4,
    trendBias: -0.3,
  },
  {
    metric: 'windSpeed',
    label: 'Wind Speed',
    unit: 'm/s',
    historyDays: 45,
    horizonDays: 14,
    intervalSpread: 1.9,
    trendBias: 0.1,
  },
]

function buildPredictionSeries(config: PredictionConfig, seed: string): PredictionSeries {
  const rng = createRng(seed)
  const source = NETWORK_SERIES[config.metric]
  const history = source.slice(-config.historyDays).map((point) => ({ date: point.date, value: point.value }))

  const lastValue = history[history.length - 1]?.value ?? 0
  const predicted: PredictionSeries['predicted'] = []
  const lowerBound: PredictionSeries['predicted'] = []
  const upperBound: PredictionSeries['predicted'] = []

  for (let step = 1; step <= config.horizonDays; step += 1) {
    const date = formatIso(addDaysFromReference(step))
    const damping = Math.exp(-step / 9)
    const seasonal = Math.sin((step / 30) * Math.PI) * config.trendBias
    const value = round(
      lastValue + seasonal * config.intervalSpread + rng.range(-0.4, 0.4) * config.intervalSpread + (config.trendBias * damping),
      1,
    )
    const spread = config.intervalSpread * (1 + step * 0.055)
    predicted.push({ date, value })
    lowerBound.push({ date, value: round(Math.max(0, value - spread), 1) })
    upperBound.push({ date, value: round(value + spread, 1) })
  }

  const first = predicted[0]?.value ?? 0
  const last = predicted[predicted.length - 1]?.value ?? 0
  const changePercent = first === 0 ? 0 : round(((last - first) / Math.abs(first)) * 100, 1)
  const trend: TrendDirection = changePercent > 4 ? 'up' : changePercent < -4 ? 'down' : 'stable'

  return {
    metric: config.metric,
    label: config.label,
    unit: config.unit,
    historical: history,
    predicted,
    lowerBound,
    upperBound,
    confidencePercent: round(Math.max(71, 95 - config.horizonDays * 0.6 - config.intervalSpread), 1),
    trend,
    changePercent,
  }
}

export const PREDICTION_SERIES: PredictionSeries[] = PREDICTION_CONFIGS.map((config, index) =>
  buildPredictionSeries(config, `prediction-${config.metric}-${index}`),
)

export const DEFAULT_PREDICTION_HORIZON = 14
