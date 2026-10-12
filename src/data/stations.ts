import type { ClimateStation } from '@/types'

export interface StationSeed {
  id: string
  name: string
  code: string
  location: string
  region: string
  country: string
  latitude: number
  longitude: number
  elevationM: number
  sensorId: string
  installedAt: string
}

export const STATION_SEEDS: StationSeed[] = [
  {
    id: 'st-north-ridge',
    name: 'North Ridge Observatory',
    code: 'NRO-01',
    location: 'Bergen',
    region: 'Vestland',
    country: 'Norway',
    latitude: 60.3913,
    longitude: 5.3221,
    elevationM: 412,
    sensorId: 'SNS-4471',
    installedAt: '2019-04-11',
  },
  {
    id: 'st-coastal-basin',
    name: 'Coastal Basin Station',
    code: 'CBS-07',
    location: 'Lisbon',
    region: 'Lisboa',
    country: 'Portugal',
    latitude: 38.7223,
    longitude: -9.1393,
    elevationM: 28,
    sensorId: 'SNS-5102',
    installedAt: '2020-09-02',
  },
  {
    id: 'st-highland-farm',
    name: 'Highland Farm Array',
    code: 'HFA-12',
    location: 'Nairobi',
    region: 'Nairobi County',
    country: 'Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
    elevationM: 1795,
    sensorId: 'SNS-6630',
    installedAt: '2018-02-27',
  },
  {
    id: 'st-river-delta',
    name: 'River Delta Monitor',
    code: 'RDM-03',
    location: 'Guwahati',
    region: 'Assam',
    country: 'India',
    latitude: 26.1445,
    longitude: 91.7362,
    elevationM: 52,
    sensorId: 'SNS-3987',
    installedAt: '2021-06-18',
  },
  {
    id: 'st-desert-pass',
    name: 'Desert Pass Relay',
    code: 'DPR-09',
    location: 'Phoenix',
    region: 'Arizona',
    country: 'United States',
    latitude: 33.4484,
    longitude: -112.074,
    elevationM: 331,
    sensorId: 'SNS-7214',
    installedAt: '2017-11-05',
  },
  {
    id: 'st-coastal-summit',
    name: 'Coastal Summit Node',
    code: 'CSN-05',
    location: 'Sydney',
    region: 'New South Wales',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    elevationM: 118,
    sensorId: 'SNS-5843',
    installedAt: '2022-01-19',
  },
  {
    id: 'st-urban-canopy',
    name: 'Urban Canopy Grid',
    code: 'UCG-14',
    location: 'Singapore',
    region: 'Central Region',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    elevationM: 15,
    sensorId: 'SNS-8066',
    installedAt: '2023-03-08',
  },
  {
    id: 'st-plateau-wind',
    name: 'Plateau Wind Farm',
    code: 'PWF-02',
    location: 'Araucanía',
    region: 'Araucanía',
    country: 'Chile',
    latitude: -38.7359,
    longitude: -72.5984,
    elevationM: 1284,
    sensorId: 'SNS-4719',
    installedAt: '2019-08-30',
  },
  {
    id: 'st-lakeside-valley',
    name: 'Lakeside Valley Station',
    code: 'LVS-11',
    location: 'Lucerne',
    region: 'Lucerne',
    country: 'Switzerland',
    latitude: 47.0502,
    longitude: 8.3093,
    elevationM: 436,
    sensorId: 'SNS-6358',
    installedAt: '2020-05-22',
  },
  {
    id: 'st-volcanic-slope',
    name: 'Volcanic Slope Monitor',
    code: 'VSM-06',
    location: 'Napier',
    region: 'Hawkes Bay',
    country: 'New Zealand',
    latitude: -39.4928,
    longitude: 176.912,
    elevationM: 187,
    sensorId: 'SNS-5527',
    installedAt: '2021-10-14',
  },
]

export type StationStatusCounts = Record<ClimateStation['status'], number>

export const STATION_STATUS_ASSIGNMENT: Record<string, ClimateStation['status']> = {
  'st-north-ridge': 'online',
  'st-coastal-basin': 'online',
  'st-highland-farm': 'degraded',
  'st-river-delta': 'online',
  'st-desert-pass': 'online',
  'st-coastal-summit': 'maintenance',
  'st-urban-canopy': 'online',
  'st-plateau-wind': 'degraded',
  'st-lakeside-valley': 'online',
  'st-volcanic-slope': 'offline',
}
