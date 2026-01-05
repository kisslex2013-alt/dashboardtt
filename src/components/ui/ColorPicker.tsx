/**
 * 🎨 ColorPicker Component
 *
 * Кастомный выбор цвета с react-colorful.
 * Поддерживает темную/светлую тему и стилистику проекта.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { createPortal } from 'react-dom'
import { Pipette } from 'lucide-react'
import type { ColorPickerProps } from '../../types'

// Предустановленные цвета
const presetColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
  '#F97316', '#84CC16', '#06B6D4', '#A855F7',
]

export function ColorPicker({ value = '#3B82F6', onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempColor, setTempColor] = useState(value)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Синхронизация tempColor с value
  useEffect(() => {
    setTempColor(value)
  }, [value])

  // Позиционирование dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const pickerHeight = 340
      const pickerWidth = 240
      
      // Показываем сверху если снизу мало места
      const showAbove = spaceBelow < pickerHeight && spaceAbove > spaceBelow
      
      // Позиционируем так, чтобы правый край picker совпадал с правым краем кнопки
      // Это гарантирует, что picker не выйдет за правую границу модального окна
      let leftPos = rect.right - pickerWidth
      
      // Но если при этом выходим за левую границу — сдвигаем вправо
      if (leftPos < 8) {
        leftPos = 8
      }
      
      setPosition({
        top: showAbove ? rect.top - pickerHeight - 8 : rect.bottom + 8,
        left: leftPos,
      })
    }
  }, [isOpen])

  // Закрытие по клику вне
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        onChange?.(tempColor)
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, tempColor, onChange])

  // Обработка изменения hex через input
  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value
    if (!hex.startsWith('#')) {
      hex = '#' + hex
    }
    setTempColor(hex)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange?.(hex)
    }
  }, [onChange])

  // Применить цвет при закрытии
  const handleClose = useCallback(() => {
    onChange?.(tempColor)
    setIsOpen(false)
  }, [tempColor, onChange])

  // Выбор из пресетов
  const handlePresetClick = useCallback((color: string) => {
    setTempColor(color)
    onChange?.(color)
  }, [onChange])

  return (
    <div className="relative">
      <div className="flex gap-0.5 items-center">
        {/* Кнопка выбора цвета */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer transition-all hover:scale-105 hover:shadow-md"
          style={{ backgroundColor: value }}
          title="Выбрать цвет"
        />
        
        {/* Hex input */}
        <input
          type="text"
          value={value}
          onChange={handleHexChange}
          className="w-20 px-1.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none font-mono uppercase"
          maxLength={7}
          placeholder="#3B82F6"
        />
      </div>

      {/* Dropdown picker */}
      {isOpen &&
        createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[9999999] animate-slide-down"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="glass-effect rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-3 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pipette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Выбор цвета
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="text-xs px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  Готово
                </button>
              </div>

              {/* Color picker */}
              <div className="color-picker-wrapper">
                <HexColorPicker color={tempColor} onChange={setTempColor} />
              </div>

              {/* Preview and hex input */}
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-inner"
                  style={{ backgroundColor: tempColor }}
                />
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    HEX
                  </label>
                  <input
                    type="text"
                    value={tempColor}
                    onChange={handleHexChange}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none font-mono uppercase"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Preset colors */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  Быстрый выбор
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handlePresetClick(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                        tempColor.toUpperCase() === color.toUpperCase()
                          ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900'
                          : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
