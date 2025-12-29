/**
 * 🎓 Хук для управления формой записи времени
 */

import { useState, useEffect, useRef } from 'react'
import { getTodayString } from '../utils/dateHelpers'
import { useCategory } from './useCategory'
import type { TimeEntry, Category } from '../types'

interface FormData {
  id?: string
  date: string
  start: string
  end: string
  category: string
  description: string
  earned: string
  isManual?: boolean
  [key: string]: unknown
}

interface UseEntryFormReturn {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  setField: (field: string, value: unknown) => void
  setFields: (updates: Partial<FormData>) => void
  resetForm: () => void
  effectiveEntry: TimeEntry | null
}

/**
 * Хук для управления формой записи времени
 * @param entry - Существующая запись для редактирования (null для новой)
 * @param categories - Список категорий (опционально)
 * @param isOpen - Открыта ли форма
 */
export function useEntryForm(
  entry: TimeEntry | null,
  categories: Category[] | null = null,
  isOpen: boolean = true
): UseEntryFormReturn {
  const { categories: hookCategories, getCategoryName } = useCategory({ defaultName: 'Разработка' })

  const effectiveCategories = categories || hookCategories
  const lastEntryRef = useRef<TimeEntry | null>(entry)

  useEffect(() => {
    if (entry) {
      lastEntryRef.current = entry
    }
  }, [entry])

  const effectiveEntry = isOpen ? entry : entry || lastEntryRef.current

  const [formData, setFormData] = useState<FormData>(() => {
    const initialEntry = entry || null
    return initialEntry
      ? {
          ...initialEntry,
          id: String(initialEntry.id || ''),
          earned: initialEntry.earned != null ? String(initialEntry.earned) : '',
        }
      : {
          date: getTodayString(),
          start: '',
          end: '',
          category: '',
          description: '',
          earned: '',
        }
  })

  useEffect(() => {
    if (effectiveEntry) {
      const categoryName = getCategoryName(effectiveEntry, 'Разработка')

      setFormData({
        ...effectiveEntry,
        id: String(effectiveEntry.id || ''),
        category: categoryName,
        earned: effectiveEntry.isManual === false
          ? ''
          : (effectiveEntry.earned != null ? String(effectiveEntry.earned) : ''),
      })
    } else {
      const defaultCategory = effectiveCategories[0]?.name || 'Разработка'
      setFormData({
        date: getTodayString(),
        start: '',
        end: '',
        category: defaultCategory,
        description: '',
        earned: '',
      })
    }
  }, [entry, effectiveCategories, effectiveEntry, getCategoryName])

  const setField = (field: string, value: unknown): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const setFields = (updates: Partial<FormData>): void => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }))
  }

  const resetForm = (): void => {
    const defaultCategory = effectiveCategories[0]?.name || 'Разработка'
    setFormData({
      date: getTodayString(),
      start: '',
      end: '',
      category: defaultCategory,
      description: '',
      earned: '',
    })
  }

  return {
    formData,
    setFormData,
    setField,
    setFields,
    resetForm,
    effectiveEntry,
  }
}
