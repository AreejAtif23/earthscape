import {
  BarChart3,
  BellRing,
  BrainCircuit,
  Database,
  FileBarChart,
  Headset,
  LayoutDashboard,
  Settings as SettingsIcon,
  TriangleAlert,
  Upload,
  UserRound,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from './paths'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  badge?: 'alerts' | 'anomalies'
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Climate Data',
    items: [
      { label: 'Data Catalogue', to: ROUTES.climateData, icon: Database, end: true },
      { label: 'Upload Dataset', to: ROUTES.dataUpload, icon: Upload },
      { label: 'Data Cleaning', to: ROUTES.dataCleaning, icon: Wrench },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics', to: ROUTES.analytics, icon: BarChart3 },
      { label: 'Predictions', to: ROUTES.predictions, icon: BrainCircuit },
      { label: 'Anomalies', to: ROUTES.anomalies, icon: TriangleAlert, badge: 'anomalies' },
      { label: 'Alerts', to: ROUTES.alerts, icon: BellRing, badge: 'alerts' },
      { label: 'Reports', to: ROUTES.reports, icon: FileBarChart },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Support', to: ROUTES.support, icon: Headset },
      { label: 'Settings', to: ROUTES.settings, icon: SettingsIcon },
      { label: 'Profile', to: ROUTES.profile, icon: UserRound },
    ],
  },
]

export const MOBILE_TAB_ITEMS = [
  { label: 'Home', to: ROUTES.dashboard, end: true, icon: LayoutDashboard, badge: undefined },
  { label: 'Data', to: ROUTES.climateData, end: true, icon: Database, badge: undefined },
  { label: 'Analytics', to: ROUTES.analytics, end: false, icon: BarChart3, badge: undefined },
  { label: 'Alerts', to: ROUTES.alerts, end: false, icon: BellRing, badge: 'alerts' as const },
  { label: 'Settings', to: ROUTES.settings, end: false, icon: SettingsIcon, badge: undefined },
]
