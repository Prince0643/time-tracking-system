export interface Project {
  id: string
  name: string
  color: string
  client?: string
  description?: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  name: string
  projectId: string
  isBillable: boolean
  hourlyRate?: number
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  userId: string
  description: string
  projectId?: string
  taskId?: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  isBillable: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
}

export type UserRole = 'employee' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  timezone: string
  hourlyRate?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  uid: string
  email: string
  role: UserRole
  name: string
}

export interface TimerState {
  isRunning: boolean
  startTime?: Date
  currentEntry?: Partial<TimeEntry>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}
