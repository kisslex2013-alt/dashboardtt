import { useState, useEffect, useRef } from 'react'
import {
  Edit2,
  Trash2,
  Plus,
  Code,
  TrendingUp,
  Palette,
  Users,
  MessageCircle,
  BookOpen,
  MoreHorizontal,
  Grid,
  Activity,
  Calendar,
  Clock,
  DollarSign,
  Settings,
  Play,
  CheckCircle,
  Bell,
  Upload,
  Download,
  Database,
  Folder,
  FileText,
} from '../../utils/icons'
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../store/useSettingsStore'
import { useEntries } from '../../store/useEntriesStore'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { AnimatedModalContent } from '../ui/AnimatedModalContent'
import { ConfirmModal } from './ConfirmModal'
import { useConfirmModal } from '../../hooks/useConfirmModal'
import { getIcon } from '../../utils/iconHelper'
import { IconSelect } from '../ui/IconSelect'

/**
 * 🎨 Модальное окно управления категориями (Табличное представление)
 *
 * Функции:
 * - Просмотр всех категорий в виде таблицы
 * - Добавление новой категории
 * - Редактирование существующей категории
 * - Удаление категории (с предупреждением)
 * - Подсчет использования категорий в записях
 */
export function CategoriesModal({ isOpen, onClose, autoOpenAddForm = false, onCategoryAdded }) {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const categories = useCategories()
  const addCategory = useAddCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const entries = useEntries()
  const { confirmConfig, openConfirm } = useConfirmModal()

  // Форма добавления категории
  const [isAdding, setIsAdding] = useState(autoOpenAddForm)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'Folder',
  })

  // Доступные иконки
  const iconOptions = [
    { name: 'Code', component: Code },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'Palette', component: Palette },
    { name: 'Users', component: Users },
    { name: 'MessageCircle', component: MessageCircle },
    { name: 'BookOpen', component: BookOpen },
    { name: 'MoreHorizontal', component: MoreHorizontal },
    { name: 'Grid', component: Grid },
    { name: 'Activity', component: Activity },
    { name: 'Calendar', component: Calendar },
    { name: 'Clock', component: Clock },
    { name: 'DollarSign', component: DollarSign },
    { name: 'Settings', component: Settings },
    { name: 'Play', component: Play },
    { name: 'CheckCircle', component: CheckCircle },
    { name: 'Bell', component: Bell },
    { name: 'Upload', component: Upload },
    { name: 'Download', component: Download },
    { name: 'Database', component: Database },
    { name: 'Folder', component: Folder },
    { name: 'FileText', component: FileText },
  ]

  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const nameInputRef = useRef(null)

  // Автоматически открываем форму и фокусируемся на поле ввода
  useEffect(() => {
    if (isOpen && autoOpenAddForm && !isAdding) {
      setIsAdding(true)
    }
    if (isOpen && isAdding && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, autoOpenAddForm, isAdding])

  // Подсчет использования категорий
  const getCategoryUsageCount = category => {
    // Проверяем совпадение по ID или по имени категории
    // Это нужно для совместимости со старыми записями, где category может быть строкой
    const count = entries.filter(entry => {
      // Если entry.category не задана (undefined/null) - считаем как "remix" (дефолтная категория)
      if (!entry.category || entry.category === undefined || entry.category === null) {
        return category.id === 'remix' || category.name === 'remix'
      }

      // Если entry.category - это строка (старый формат)
      if (typeof entry.category === 'string') {
        // Проверяем совпадение по ID, имени или по индексу для старых категорий
        const matches =
          entry.category === category.id ||
          entry.category === category.name ||
          entry.category.toLowerCase() === category.name.toLowerCase()

        return matches
      }
      // Если entry.category - это объект или ID
      return entry.category === category.id || entry.category === category.name
    }).length

    return count
  }

  // Обработчик добавления категории
  const handleAdd = () => {
    if (!formData.name.trim()) {
      setError('Введите название категории')
      return
    }

    // Проверка на дубликаты
    const exists = categories.some(c => c.name.toLowerCase() === formData.name.trim().toLowerCase())

    if (exists) {
      setError('Категория с таким названием уже существует')
      return
    }

    const newCategoryName = formData.name.trim()

    // Добавляем категорию
    addCategory({
      name: newCategoryName,
      color: formData.color,
      icon: formData.icon,
    })

    // Очищаем форму и закрываем режим добавления
    setFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setError('')
    setIsAdding(false)

    // Вызываем callback если передан (после очистки формы)
    if (onCategoryAdded) {
      onCategoryAdded(newCategoryName)
    }

    // Если открыто автоматически, закрываем модальное окно после небольшой задержки
    if (autoOpenAddForm && onClose) {
      setTimeout(() => {
        onClose()
      }, 150)
    }
  }

  // Обработчик отмены добавления
  const handleCancelAdd = () => {
    setFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setError('')
    setIsAdding(false)
  }

  // Обработчик редактирования
  const handleEdit = category => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || 'Folder',
    })
    setError('')
  }

  // Обработчик сохранения изменений
  const handleSaveEdit = () => {
    if (!formData.name.trim()) {
      setError('Введите название категории')
      return
    }

    // Обновляем категорию
    updateCategory(editingId, {
      name: formData.name.trim(),
      color: formData.color,
      icon: formData.icon,
    })

    // Очищаем форму
    setFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setEditingId(null)
    setError('')
  }

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setFormData({ name: '', color: '#3B82F6', icon: 'Folder' })
    setEditingId(null)
    setError('')
  }

  // Обработчик удаления
  const handleDelete = categoryId => {
    openConfirm({
      title: 'Удалить категорию?',
      message:
        'Вы уверены, что хотите удалить эту категорию?\n\nВнимание: все записи с этой категорией останутся, но категория будет удалена из списка.',
      onConfirm: () => deleteCategory(categoryId),
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    })
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Категории работ"
      subtitle="Управление категориями для учета времени"
      size="large"
      className="max-w-2xl overflow-hidden"
    >
      <AnimatedModalContent contentKey={`${isAdding ? 'adding' : ''}-${editingId || 'none'}`}>
        <div className="p-4 -mt-4">
          {/* Кнопка добавления */}
          {!isAdding && !editingId && (
            <div className="mb-3">
              <button
                onClick={() => setIsAdding(true)}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-normal hover-lift-scale click-shrink font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить категорию
              </button>
            </div>
          )}

          {/* Форма добавления/редактирования */}
          {(isAdding || editingId) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {editingId ? 'Редактировать категорию' : 'Добавить новую категорию'}
              </h3>
              <div className="space-y-2">
                {/* Название, Цвет, Иконка и кнопки в одной строке */}
                <div className="flex flex-wrap items-end gap-2">
                  {/* Название */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Название
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Разработка"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          editingId ? handleSaveEdit() : handleAdd()
                        }
                      }}
                    />
                  </div>

                  {/* Цвет */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Цвет
                    </label>
                    <div className="flex gap-0.5">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-20 px-1.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Иконка */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Иконка
                    </label>
                    <IconSelect
                      value={formData.icon}
                      onChange={icon => setFormData({ ...formData, icon })}
                      color={formData.color}
                    />
                  </div>

                  {/* Кнопки */}
                  <div className="flex items-center gap-1.5">
                    {editingId ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleAdd}
                          disabled={!formData.name.trim()}
                          className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                        >
                          Добавить
                        </button>
                        <button
                          onClick={handleCancelAdd}
                          className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                        >
                          Отмена
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Таблица категорий */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold w-12 text-xs">Цвет</th>
                  <th className="text-left py-2 px-3 font-semibold text-xs">Название</th>
                  <th className="text-center py-2 px-3 font-semibold w-32 text-xs">Использовано</th>
                  <th className="text-center py-2 px-3 font-semibold w-28 text-xs">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                    >
                      Нет категорий. Добавьте первую категорию.
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => {
                    const usageCount = getCategoryUsageCount(category)
                    // Используем комбинацию id и index для гарантии уникальности ключа
                    const uniqueKey = category.id || `category-${index}`
                    return (
                      <tr
                        key={uniqueKey}
                        className={`${
                          index < categories.length - 1
                            ? 'border-b border-gray-100 dark:border-gray-800'
                            : ''
                        } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          editingId === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        {/* Цвет */}
                        <td className="py-2 px-3">
                          {category.icon ? (
                            (() => {
                              const CategoryIcon = getIcon(category.icon)
                              if (CategoryIcon) {
                                return (
                                  <CategoryIcon
                                    className="w-5 h-5"
                                    style={{ color: category.color }}
                                  />
                                )
                              }
                              return (
                                <div
                                  className="w-5 h-5 rounded-full"
                                  style={{ background: category.color }}
                                />
                              )
                            })()
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full"
                              style={{ background: category.color }}
                            />
                          )}
                        </td>

                        {/* Название */}
                        <td className="py-2 px-3">
                          <span className="font-medium text-sm text-gray-800 dark:text-white">
                            {category.name}
                          </span>
                        </td>

                        {/* Использовано */}
                        <td className="py-2 px-3 text-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {usageCount}{' '}
                            {usageCount === 1
                              ? 'раз'
                              : usageCount > 1 && usageCount < 5
                                ? 'раза'
                                : 'раз'}
                          </span>
                        </td>

                        {/* Действия */}
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded hover-lift-scale click-shrink"
                              title="Редактировать"
                              aria-label="Редактировать категорию"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded hover-lift-scale click-shrink"
                              title="Удалить"
                              aria-label="Удалить категорию"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Подсказка */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>Подсказка:</strong> Категории используются для группировки записей времени.
              Нельзя удалить категорию, которая используется в записях.
            </p>
          </div>
        </div>
      </AnimatedModalContent>

      <ConfirmModal {...confirmConfig} />
    </BaseModal>
  )
}
