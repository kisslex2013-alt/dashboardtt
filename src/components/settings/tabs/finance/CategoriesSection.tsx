/**
 * 📂 CategoriesSection Component
 *
 * Секция управления категориями.
 */

import { Plus, Trash2 } from 'lucide-react'
import { getIcon } from '../../../../utils/iconHelper'
import { IconSelect } from '../../../ui/IconSelect'
import { ColorPicker } from '../../../ui/ColorPicker'

interface CategoriesSectionProps {
  categories: any[]
  entries: any[]
  isAddingCategory: boolean
  setIsAddingCategory: (value: boolean) => void
  editingCategoryId: string | null
  categoryFormData: { name: string; color: string; icon: string }
  setCategoryFormData: (data: any) => void
  categoryError: string
  handleAddCategory: () => void
  handleCancelAddCategory: () => void
  handleEditCategory: (category: any) => void
  handleSaveCategory: () => void
  handleCancelEditCategory: () => void
  handleDeleteCategory: (id: string) => void
  defaultCategory: string | null
  setDefaultCategory: (id: string | null) => void
  categoryNameInputRef: any
}

export function CategoriesSection({
  categories,
  entries,
  isAddingCategory,
  setIsAddingCategory,
  editingCategoryId,
  categoryFormData,
  setCategoryFormData,
  categoryError,
  handleAddCategory,
  handleCancelAddCategory,
  handleEditCategory,
  handleSaveCategory,
  handleCancelEditCategory,
  handleDeleteCategory,
  defaultCategory,
  setDefaultCategory,
  categoryNameInputRef
}: CategoriesSectionProps) {

  // Хелпер, который был внутри модалки
  const getCategoryUsageCount = (category: any) => {
    const count = entries.filter((entry: any) => {
      if (!entry.category || entry.category === undefined || entry.category === null) {
        return category.id === 'remix' || category.name === 'remix'
      }
      if (typeof entry.category === 'string') {
        return entry.category === category.id || entry.category === category.name || entry.category.toLowerCase() === category.name.toLowerCase()
      }
      return entry.category === category.id || entry.category === category.name
    }).length
    return count
  }

  return (
    <div key="categories-tab" className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Категории работ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Управление категориями для учета времени</p>
      </div>

      {!isAddingCategory && !editingCategoryId && (
        <div className="mb-3">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-normal hover-lift-scale click-shrink font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить категорию
          </button>
        </div>
      )}

      {(isAddingCategory || editingCategoryId) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {editingCategoryId ? 'Редактировать категорию' : 'Добавить новую категорию'}
          </h3>
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Название
                </label>
                <input
                  ref={categoryNameInputRef}
                  type="text"
                  placeholder="Разработка"
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                />
              </div>

              {/* Цвет */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Цвет
                </label>
                <ColorPicker
                  value={categoryFormData.color}
                  onChange={color => setCategoryFormData({ ...categoryFormData, color })}
                />
              </div>

              {/* Иконка */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Иконка
                </label>
                <IconSelect
                  value={categoryFormData.icon}
                  onChange={icon => setCategoryFormData({ ...categoryFormData, icon })}
                  color={categoryFormData.color}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <div className="flex gap-2">
                {editingCategoryId ? (
                  <>
                    <button
                      onClick={handleSaveCategory}
                      disabled={!categoryFormData.name.trim()}
                      className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={handleCancelEditCategory}
                      className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAddCategory}
                      disabled={!categoryFormData.name.trim()}
                      className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                    >
                      Добавить
                    </button>
                    <button
                      onClick={handleCancelAddCategory}
                      className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-normal hover-lift-scale click-shrink font-medium text-xs whitespace-nowrap"
                    >
                      Отмена
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {categoryError && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
              {categoryError}
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-semibold w-12 text-xs">Цвет</th>
              <th className="text-left py-2 px-3 font-semibold text-xs">Название</th>
              <th className="text-center py-2 px-3 font-semibold w-32 text-xs">Использовано</th>
              <th className="text-center py-2 px-3 font-semibold w-20 text-xs">По умолч.</th>
              <th className="text-center py-2 px-3 font-semibold w-28 text-xs">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                >
                  Нет категорий. Добавьте первую категорию.
                </td>
              </tr>
            ) : (
              categories.map((category, index) => {
                const usageCount = getCategoryUsageCount(category)
                const uniqueKey = category.id || `category-${index}`
                return (
                  <tr
                    key={uniqueKey}
                    className={`${
                      index < categories.length - 1
                        ? 'border-b border-gray-100 dark:border-gray-800'
                        : ''
                    } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      editingCategoryId === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
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
                    <td className="py-2 px-3">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {category.name}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {usageCount}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="radio"
                        name="defaultCategory"
                        checked={defaultCategory === category.id}
                        onChange={() => setDefaultCategory(category.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Редактировать"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  )
}
