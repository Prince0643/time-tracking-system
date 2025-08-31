import { format, formatDistance, formatRelative, isValid } from 'date-fns'

export const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '0:00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const formatDurationShort = (seconds: number): string => {
  if (seconds < 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const formatTime = (date: Date): string => {
  if (!isValid(date)) return '--:--'
  return format(date, 'HH:mm')
}

export const formatDate = (date: Date): string => {
  if (!isValid(date)) return '--'
  return format(date, 'MMM dd, yyyy')
}

export const formatDateTime = (date: Date): string => {
  if (!isValid(date)) return '--'
  return format(date, 'MMM dd, yyyy HH:mm')
}

export const formatRelativeTime = (date: Date): string => {
  if (!isValid(date)) return '--'
  return formatRelative(date, new Date())
}

export const formatDistanceTime = (date: Date): string => {
  if (!isValid(date)) return '--'
  return formatDistance(date, new Date(), { addSuffix: true })
}

export const calculateDuration = (startTime: Date, endTime?: Date): number => {
  if (!endTime) {
    return Math.floor((Date.now() - startTime.getTime()) / 1000)
  }
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const calculateEarnings = (duration: number, hourlyRate: number): number => {
  return (duration / 3600) * hourlyRate
}

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}
