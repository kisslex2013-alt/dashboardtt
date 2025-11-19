import { useState, useRef } from 'react'
import { Upload, AlertCircle, FileJson } from '../../utils/icons'
import { Button } from '../ui/Button'
import { BaseModal } from '../ui/BaseModal'
import { importFromJSON } from '../../utils/exportImport'
import { handleError } from '../../utils/errorHandler'
import type { ImportModalProps } from '../../types'

/**
 * Модальное окно импорта данных из JSON файла
 * - Выбор файла
 * - Preview импортируемых данных
 * - Режим импорта: заменить или добавить
 * - Валидация данных
 */
export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [importMode, setImportMode] = useState('replace') // 'replace' или 'merge'
  const [previewData, setPreviewData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = async event => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSelectedFile(file)
    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = async e => {
        try {
          const jsonString = e.target.result
          const { isValid, data, error: validationError } = importFromJSON(jsonString)

          if (!isValid) {
            setError(validationError || 'Некорректный формат файла')
            setPreviewData(null)
          } else {
            // Подготовка preview данных
            const preview = {
              entriesCount: data.entries?.length || 0,
              categoriesCount: data.categories?.length || 0,
              dateRange: getDateRange(data.entries || []),
              totalEarned: calculateTotalEarned(data.entries || []),
            }
            setPreviewData(preview)
          }
        } catch (err) {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(err, { operation: 'Чтение файла импорта' })
          setError(errorMessage)
          setPreviewData(null)
        } finally {
          setIsLoading(false)
        }
      }
      reader.onerror = error => {
        // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
        const errorMessage = handleError(new Error('Не удалось прочитать файл'), {
          operation: 'Чтение файла',
        })
        setError(errorMessage)
        setIsLoading(false)
      }
      reader.readAsText(file)
    } catch (err) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(err, { operation: 'Обработка файла импорта' })
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !previewData) return

    setIsLoading(true)
    try {
      const reader = new FileReader()

      // Promise для обработки результата чтения файла
      await new Promise((resolve, reject) => {
        reader.onload = async e => {
          try {
            const jsonString = e.target.result
            const { isValid, data, error: validationError } = importFromJSON(jsonString)
            
            // Проверяем валидность данных перед импортом
            if (!isValid || !data) {
              const errorMsg = validationError || 'Некорректный формат файла'
              setError(errorMsg)
              reject(new Error(errorMsg))
              return
            }
            
            await onImport(data, importMode)
            handleClose()
            resolve()
          } catch (err) {
            // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
            const errorMessage = handleError(err, { operation: 'Импорт данных', mode: importMode })
            setError(errorMessage)
            reject(err)
          }
        }

        reader.onerror = error => {
          // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
          const errorMessage = handleError(new Error('Не удалось прочитать файл'), {
            operation: 'Чтение файла для импорта',
          })
          setError(errorMessage)
          reject(new Error(errorMessage))
        }

        reader.readAsText(selectedFile)
      })
    } catch (err) {
      // ИСПРАВЛЕНО: Используем централизованную обработку ошибок
      const errorMessage = handleError(err, {
        operation: 'Импорт данных (общая ошибка)',
        mode: importMode,
      })
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setError('')
    setImportMode('replace')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const getDateRange = entries => {
    if (!entries || entries.length === 0) return 'Нет записей'

    try {
      const dates = entries
        .map(e => {
          // Безопасное создание Date объекта
          if (!e || !e.date) return null
          const date = new Date(e.date)
          // Проверяем, что дата валидна
          return isNaN(date.getTime()) ? null : date
        })
        .filter(date => date !== null)
        .sort((a, b) => a.getTime() - b.getTime())

      if (dates.length === 0) return 'Нет валидных дат'

      const start = dates[0].toLocaleDateString('ru-RU')
      const end = dates[dates.length - 1].toLocaleDateString('ru-RU')

      return start === end ? start : `${start} - ${end}`
    } catch (err) {
      return 'Ошибка обработки дат'
    }
  }

  const calculateTotalEarned = entries => {
    if (!entries || entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + (parseFloat(e.earned) || 0), 0)
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Импорт данных"
      titleIcon={Upload}
      size="small"
      closeOnOverlayClick={false}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            iconId="import-cancel"
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!previewData || isLoading || !!error}
            className="flex-1"
            icon={Upload}
            iconId="import-submit"
          >
            Импортировать
          </Button>
        </div>
      }
    >
      {/* Выбор файла */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Выберите JSON файл</label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="glass-button px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 flex-1"
          >
            <FileJson className="w-4 h-4" />
            <span className="text-sm truncate">
              {selectedFile ? selectedFile.name : 'Выбрать файл...'}
            </span>
          </label>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mb-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Обработка файла...</p>
        </div>
      )}

      {/* Preview данных */}
      {previewData && !error && !isLoading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">Preview импорта:</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Записей:</span>
              <span className="font-medium">{previewData.entriesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Категорий:</span>
              <span className="font-medium">{previewData.categoriesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Период:</span>
              <span className="font-medium">{previewData.dateRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Общий заработок:</span>
              <span className="font-medium">{previewData.totalEarned.toFixed(2)} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* Режим импорта */}
      {previewData && !error && !isLoading && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Режим импорта</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="w-4 h-4 text-blue-500"
              />
              <span className="text-sm">Заменить все данные</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="w-4 h-4 text-blue-500"
              />
              <span className="text-sm">Добавить к существующим</span>
            </label>
          </div>
        </div>
      )}
    </BaseModal>
  )
}

// Временно отключено для отладки
// ImportModal.propTypes = {
//   isOpen: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
//   onImport: PropTypes.func.isRequired
// };
