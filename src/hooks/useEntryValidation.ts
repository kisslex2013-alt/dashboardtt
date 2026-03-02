/**
 * 🎓 Хук для валидации формы записи времени
 */

import { useState } from 'react'
import { validateEntryForm } from '../utils/validators'
import { timeToMinutes } from '../utils/dateHelpers'
import type { TimeEntry } from '../types'

interface FormData {
  id?: string | number
  start?: string
  end?: string
  date?: string
  earned?: string | number
  [key: string]: unknown
}

interface ValidationErrors {
  [key: string]: string
}

interface UseEntryValidationReturn {
  errors: ValidationErrors
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>
  validateForm: () => boolean
  validateTime: (start: string, end: string, date: string) => void
  checkTimeOverlap: (start: string, end: string, date: string) => string | null
  clearErrors: (fields: string[]) => void
  setError: (field: string, message: string) => void
  clearAllErrors: () => void
}

/**
 * Хук для валидации формы записи времени
 * @param formData - Данные формы
 * @param entries - Все записи (для проверки пересечений)
 * @param effectiveEntry - Текущая редактируемая запись
 */
export function useEntryValidation(
  formData: FormData,
  entries: TimeEntry[],
  effectiveEntry: TimeEntry | null
): UseEntryValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({})

  /**
   * Проверяет пересечения временных промежутков
   */
  const checkTimeOverlap = (start: string, end: string, date: string): string | null => {
    if (!start || !end || !date) return null

    const startTimeObj = new Date(`${date}T${start}:00`)
    const endTimeObj = new Date(`${date}T${end}:00`)
    if (endTimeObj <= startTimeObj) {
      endTimeObj.setDate(endTimeObj.getDate() + 1) // next day
    }

    const startMs = startTimeObj.getTime()
    const endMs = endTimeObj.getTime()

    const excludeIdString = effectiveEntry?.id ? String(effectiveEntry.id) : null

    for (const otherEntry of entries) {
      if (!otherEntry.start || !otherEntry.end || !otherEntry.date) continue
      if (excludeIdString && String(otherEntry.id) === excludeIdString) continue

      const otherStartObj = new Date(`${otherEntry.date}T${otherEntry.start}:00`)
      const otherEndObj = new Date(`${otherEntry.date}T${otherEntry.end}:00`)
      if (otherEndObj <= otherStartObj) {
        otherEndObj.setDate(otherEndObj.getDate() + 1)
      }

      if (startMs < otherEndObj.getTime() && endMs > otherStartObj.getTime()) {
        return `Пересекается с записью ${otherEntry.date} ${otherEntry.start} → ${otherEntry.end}`
      }
    }

    return null
  }

  /**
   * Валидирует форму записи
   */
  const validateForm = (): boolean => {
    const validation = validateEntryForm(
      formData,
      entries,
      formData.id ? String(formData.id) : null
    )

    const earnedValue = parseFloat(String(formData.earned)) || 0
    if (earnedValue <= 0) {
      validation.errors.earned = 'Заработок должен быть больше 0'
      validation.isValid = false
    }

    setErrors(validation.errors)
    return validation.isValid
  }

  /**
   * Валидирует время в реальном времени
   */
  const validateTime = (start: string, end: string, date: string): void => {
    const newErrors: ValidationErrors = {}

    if (start && end) {
      if (start === end) {
        newErrors.start = 'Время начала и окончания не могут совпадать'
        newErrors.end = 'Время начала и окончания не могут совпадать'
      } else {
        const overlapError = checkTimeOverlap(start, end, date)
        if (overlapError) {
          newErrors.start = overlapError
          newErrors.end = overlapError
        }
      }
    }

    setErrors(prev => ({
      ...prev,
      ...newErrors,
    }))
  }

  const clearErrors = (fields: string[]): void => {
    setErrors(prev => {
      const newErrors = { ...prev }
      fields.forEach(field => {
        delete newErrors[field]
      })
      return newErrors
    })
  }

  const setError = (field: string, message: string): void => {
    setErrors(prev => ({
      ...prev,
      [field]: message,
    }))
  }

  const clearAllErrors = (): void => {
    setErrors({})
  }

  return {
    errors,
    setErrors,
    validateForm,
    validateTime,
    checkTimeOverlap,
    clearErrors,
    setError,
    clearAllErrors,
  }
}
