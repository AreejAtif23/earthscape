import type { Severity, TrendDirection } from './common'

export type UserRole = 'analyst' | 'administrator' | 'researcher'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  organisation: string
  jobTitle: string
  avatarInitials: string
  memberSince: string
  lastLoginAt: string
}

export interface AuthSession {
  user: User
  accessToken: string
  expiresAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  organisation: string
  acceptTerms: boolean
}

export interface AuthState {
  status: 'authenticated' | 'unauthenticated'
  user: User | null
}

export interface NotificationPreference {
  email: boolean
  push: boolean
  sms: boolean
  digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
}

export interface AlertThresholdPreference {
  temperatureHigh: number
  rainfallHeavy: number
  windSevere: number
  humidityLow: number
}

export interface AppearancePreference {
  theme: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  reduceMotion: boolean
}

export interface UserSettings {
  notification: NotificationPreference
  thresholds: AlertThresholdPreference
  appearance: AppearancePreference
}

export interface ProfileUpdatePayload {
  name: string
  jobTitle: string
  organisation: string
  timezone: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  severity: Severity
  createdAt: string
  read: boolean
  trend: TrendDirection
  location: string
}
