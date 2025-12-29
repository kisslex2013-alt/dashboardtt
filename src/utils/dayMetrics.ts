/**
 * Утилиты для расчета метрик за день
 */

import type { TimeEntry } from '../types'

interface DayStatus {
  status: 'success' | 'warning' | 'danger' | null
  color: 'green' | 'yellow' | 'red' | null
  percent: number | null
  label: string | null
}

interface DayMetrics {
  longestSession: string
  totalWorkTime: string
  longestBreak: string
  totalBreaks: string
  averageRate: number
  totalEarned: number
  totalHours: number
  status: DayStatus
}

function getDurationInHours(start: string, end: string): number {
  if (!start || !end) return 0

  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  const minutes = endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : 24 * 60 - startMinutes + endMinutes

  return minutes / 60
}

export function formatHoursToTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

export function calculateLongestSession(entries: TimeEntry[]): string {
  if (!entries || entries.length === 0) return '0:00'

  let maxDuration = 0

  entries.forEach(entry => {
    let duration = 0

    if (entry.duration) {
      duration = parseFloat(String(entry.duration))
    } else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }

    if (duration > maxDuration) {
      maxDuration = duration
    }
  })

  const hours = Math.floor(maxDuration)
  const minutes = Math.round((maxDuration - hours) * 60)

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

export function calculateTotalBreaks(entries: TimeEntry[]): string {
  if (!entries || entries.length <= 1) return '0:00'

  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.start || !b.start) return 0
    const [aH, aM] = a.start.split(':').map(Number)
    const [bH, bM] = b.start.split(':').map(Number)
    return (aH * 60 + aM) - (bH * 60 + bM)
  })

  let totalBreakMinutes = 0

  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentEnd = sortedEntries[i].end
    const nextStart = sortedEntries[i + 1].start

    if (currentEnd && nextStart) {
      const breakDuration = getDurationInHours(currentEnd, nextStart)
      totalBreakMinutes += breakDuration * 60
    }
  }

  const hours = Math.floor(totalBreakMinutes / 60)
  const minutes = Math.round(totalBreakMinutes % 60)

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

export function calculateLongestBreak(entries: TimeEntry[]): string {
  if (!entries || entries.length <= 1) return '0:00'

  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.start || !b.start) return 0
    const [aH, aM] = a.start.split(':').map(Number)
    const [bH, bM] = b.start.split(':').map(Number)
    return (aH * 60 + aM) - (bH * 60 + bM)
  })

  let maxBreak = 0

  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentEnd = sortedEntries[i].end
    const nextStart = sortedEntries[i + 1].start

    if (currentEnd && nextStart) {
      const breakDuration = getDurationInHours(currentEnd, nextStart)
      if (breakDuration > maxBreak) {
        maxBreak = breakDuration
      }
    }
  }

  const hours = Math.floor(maxBreak)
  const minutes = Math.round((maxBreak - hours) * 60)

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

export function calculateAverageRate(entries: TimeEntry[]): number {
  if (!entries || entries.length === 0) return 0

  let totalEarned = 0
  let totalHours = 0

  entries.forEach(entry => {
    const earned = parseFloat(String(entry.earned)) || 0
    totalEarned += earned

    let duration = 0
    if (entry.duration) {
      duration = parseFloat(String(entry.duration))
    } else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }
    totalHours += duration
  })

  if (totalHours === 0) return 0

  return Math.round(totalEarned / totalHours)
}

export function getDayStatus(earned: number, plan: number | null): DayStatus {
  if (!plan || plan === 0) {
    return { status: null, color: null, percent: null, label: null }
  }

  const percent = Math.round((earned / plan) * 100)

  if (percent >= 100) {
    return { status: 'success', color: 'green', percent, label: 'План выполнен' }
  } else if (percent >= 50) {
    return { status: 'warning', color: 'yellow', percent, label: 'План на пути' }
  } else {
    return { status: 'danger', color: 'red', percent, label: 'План не выполнен' }
  }
}

export function getDayMetrics(entries: TimeEntry[], plan: number | null = null): DayMetrics {
  if (!entries || entries.length === 0) {
    return {
      longestSession: '0:00',
      totalWorkTime: '0:00',
      longestBreak: '0:00',
      totalBreaks: '0:00',
      averageRate: 0,
      totalEarned: 0,
      totalHours: 0,
      status: getDayStatus(0, plan),
    }
  }

  let totalEarned = 0
  let totalHours = 0

  entries.forEach(entry => {
    const earned = parseFloat(String(entry.earned)) || 0
    totalEarned += earned

    let duration = 0
    if (entry.duration) {
      duration = parseFloat(String(entry.duration))
    } else if (entry.start && entry.end) {
      duration = getDurationInHours(entry.start, entry.end)
    }
    totalHours += duration
  })

  totalEarned = Math.round(totalEarned)

  return {
    longestSession: calculateLongestSession(entries),
    totalWorkTime: formatHoursToTime(totalHours),
    longestBreak: calculateLongestBreak(entries),
    totalBreaks: calculateTotalBreaks(entries),
    averageRate: calculateAverageRate(entries),
    totalEarned,
    totalHours: parseFloat(totalHours.toFixed(2)),
    status: getDayStatus(totalEarned, plan),
  }
}
