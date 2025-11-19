import { useState, useCallback, useEffect } from 'react'

/**
 * Хук для управления выбором дат и периодов в календаре
 * @param {Function} onUpdatePeriod - функция обновления периода
 * @param {Function} onUpdateField - функция обновления поля выплаты
 * @param {Function} showSuccess - функция показа сообщения об успехе
 * @param {number} currentMonth - текущий месяц календаря
 * @returns {Object} объект с состоянием и методами выбора
 */
export function usePaymentSelection(
  onUpdatePeriod,
  onUpdateField,
  showSuccess,
  currentMonth
) {
  const [selectingMode, setSelectingMode] = useState(null) // 'payment' или 'period'
  const [selectingPaymentId, setSelectingPaymentId] = useState(null)
  const [periodSelectionStart, setPeriodSelectionStart] = useState(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [selectionDays, setSelectionDays] = useState(new Set())
  const [hoveredDay, setHoveredDay] = useState(null)

  /**
   * Начинает выбор дня выплаты
   */
  const startSelectPaymentDay = useCallback(
    id => {
      setSelectingMode('payment')
      setSelectingPaymentId(id)
      showSuccess('Выберите день выплаты в календаре')
    },
    [showSuccess]
  )

  /**
   * Начинает выбор периода
   */
  const startSelectPeriod = useCallback(
    id => {
      setSelectingMode('period')
      setSelectingPaymentId(id)
      setPeriodSelectionStart(null)
      setSelectionDays(new Set())
      showSuccess('Зажмите мышь и выделите период')
    },
    [showSuccess]
  )

  /**
   * Обработчик нажатия мыши
   */
  const handleMouseDown = useCallback(
    (day, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (selectingMode === 'period') {
        setIsMouseDown(true)
        setSelectionDays(new Set([day]))
        setPeriodSelectionStart(day)
      }
    },
    [selectingMode]
  )

  /**
   * Обработчик наведения мыши
   */
  const handleMouseEnter = useCallback(
    day => {
      if (isMouseDown && selectingMode === 'period' && periodSelectionStart !== null) {
        const start = Math.min(periodSelectionStart, day)
        const end = Math.max(periodSelectionStart, day)
        const newSelection = new Set()
        for (let i = start; i <= end; i++) {
          newSelection.add(i)
        }
        setSelectionDays(newSelection)
      }
      if (selectingMode === 'payment') {
        setHoveredDay(day)
      }
    },
    [isMouseDown, selectingMode, periodSelectionStart]
  )

  /**
   * Обработчик отпускания мыши
   */
  const handleMouseUp = useCallback(
    (day, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isMouseDown && selectingMode === 'period' && periodSelectionStart !== null && selectingPaymentId) {
        const start = Math.min(periodSelectionStart, day)
        const end = Math.max(periodSelectionStart, day)

        onUpdatePeriod(selectingPaymentId, start, end, currentMonth)

        const startStr = start.toString().padStart(2, '0')
        const endStr = end.toString().padStart(2, '0')
        const monthStr = (currentMonth + 1).toString().padStart(2, '0')

        setIsMouseDown(false)
        setSelectingMode(null)
        setSelectingPaymentId(null)
        setPeriodSelectionStart(null)
        setSelectionDays(new Set())
        setHoveredDay(null)
        showSuccess(`Период установлен: ${startStr}.${monthStr}-${endStr}.${monthStr}`)
      }
    },
    [isMouseDown, selectingMode, selectingPaymentId, periodSelectionStart, onUpdatePeriod, showSuccess, currentMonth]
  )

  /**
   * Обработчик клика по дню календаря
   */
  const handleDayClick = useCallback(
    (day, onUpdatePaymentDay) => {
      if (selectingMode === 'period') {
        return
      }

      if (selectingMode === 'payment' && selectingPaymentId && onUpdatePaymentDay) {
        onUpdatePaymentDay(selectingPaymentId, day, currentMonth)
        setSelectingMode(null)
        setSelectingPaymentId(null)
        setHoveredDay(null)
        showSuccess('День выплаты установлен')
      }
    },
    [selectingMode, selectingPaymentId, currentMonth, showSuccess]
  )

  /**
   * Сброс состояния выбора
   */
  const resetSelection = useCallback(() => {
    setSelectingMode(null)
    setSelectingPaymentId(null)
    setHoveredDay(null)
    setSelectionDays(new Set())
    setPeriodSelectionStart(null)
    setIsMouseDown(false)
  }, [])

  /**
   * Глобальный обработчик отпускания мыши
   */
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (selectingMode !== 'period') {
        setIsMouseDown(false)
      }
    }
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [selectingMode])

  return {
    selectingMode,
    selectingPaymentId,
    periodSelectionStart,
    isMouseDown,
    selectionDays,
    hoveredDay,
    startSelectPaymentDay,
    startSelectPeriod,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleDayClick,
    resetSelection,
    setHoveredDay,
  }
}

