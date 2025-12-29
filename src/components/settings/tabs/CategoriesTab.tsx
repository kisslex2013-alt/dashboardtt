/**
 * 📂 CategoriesTab Component
 *
 * Отдельная вкладка управления категориями.
 */

import { useRef, useState, useLayoutEffect } from 'react'
import { Folder } from 'lucide-react'
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useDefaultCategory,
  useSetDefaultCategory
} from '../../../store/useSettingsStore'
import { useEntries } from '../../../store/useEntriesStore'
import { CategoriesSection } from './finance/CategoriesSection'
import { generateUUID } from '../../../utils/uuid'

export function CategoriesTab() {
  const categories = useCategories()
  const entries = useEntries()
  const addCategory = useAddCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const defaultCategory = useDefaultCategory()
  const setDefaultCategory = useSetDefaultCategory()

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: '', color: '#3B82F6', icon: '' })
  const [categoryError, setCategoryError] = useState('')
  const categoryNameInputRef = useRef<HTMLInputElement>(null)

  // Focus on input when adding
  useLayoutEffect(() => {
    if (isAddingCategory && categoryNameInputRef.current) {
      categoryNameInputRef.current.focus()
    }
  }, [isAddingCategory])

  const handleAddCategory = () => {
    if (!categoryFormData.name.trim()) {
      setCategoryError('Введите название категории')
      return
    }
    const duplicate = categories.find(
      c => c.name.toLowerCase() === categoryFormData.name.trim().toLowerCase()
    )
    if (duplicate) {
      setCategoryError('Категория с таким названием уже существует')
      return
    }
    addCategory({
      name: categoryFormData.name.trim(),
      color: categoryFormData.color,
      icon: categoryFormData.icon || undefined,
    })
    setCategoryFormData({ name: '', color: '#3B82F6', icon: '' })
    setIsAddingCategory(false)
    setCategoryError('')
  }

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false)
    setCategoryFormData({ name: '', color: '#3B82F6', icon: '' })
    setCategoryError('')
  }

  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id)
    setCategoryFormData({
      name: category.name,
      color: category.color || '#3B82F6',
      icon: category.icon || '',
    })
    setCategoryError('')
  }

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) {
      setCategoryError('Введите название категории')
      return
    }
    const duplicate = categories.find(
      c => c.name.toLowerCase() === categoryFormData.name.trim().toLowerCase() && c.id !== editingCategoryId
    )
    if (duplicate) {
      setCategoryError('Категория с таким названием уже существует')
      return
    }
    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: categoryFormData.name.trim(),
        color: categoryFormData.color,
        icon: categoryFormData.icon || undefined,
      })
    }
    setEditingCategoryId(null)
    setCategoryFormData({ name: '', color: '#3B82F6', icon: '' })
    setCategoryError('')
  }

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null)
    setCategoryFormData({ name: '', color: '#3B82F6', icon: '' })
    setCategoryError('')
  }

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id)
    if (defaultCategory === id) {
      setDefaultCategory(null)
    }
  }

  return (
    <CategoriesSection
      categories={categories}
      entries={entries}
      isAddingCategory={isAddingCategory}
      setIsAddingCategory={setIsAddingCategory}
      editingCategoryId={editingCategoryId}
      categoryFormData={categoryFormData}
      setCategoryFormData={setCategoryFormData}
      categoryError={categoryError}
      handleAddCategory={handleAddCategory}
      handleCancelAddCategory={handleCancelAddCategory}
      handleEditCategory={handleEditCategory}
      handleSaveCategory={handleSaveCategory}
      handleCancelEditCategory={handleCancelEditCategory}
      handleDeleteCategory={handleDeleteCategory}
      defaultCategory={defaultCategory}
      setDefaultCategory={setDefaultCategory}
      categoryNameInputRef={categoryNameInputRef}
    />
  )
}
