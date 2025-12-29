import { useState, useCallback, useEffect } from 'react'

interface UsePaymentSelectionReturn {
  selectingMode: 'payment' | 'period' | null
  selectingPaymentId: string | null
  periodSelectionStart: number | null
  isMouseDown: boolean
  selectionDays: Set<number>
  hoveredDay: number | null
  startSelectPaymentDay: (id: string) => void
  startSelectPeriod: (id: string) => void
  handleMouseDown: (day: number, e?: React.MouseEvent) => void
  handleMouseEnter: (day: number) => void
  handleMouseUp: (day: number, e?: React.MouseEvent) => void
  handleDayClick: (day: number, onUpdatePaymentDay?: (id: string, day: number, month: number) => void) => void
  resetSelection: () => void
  setHoveredDay: (day: number | null) => void
}

export function usePaymentSelection(
  onUpdatePeriod: (id: string, start: number, end: number, month: number) => void,
  _onUpdateField: (id: string, field: string, value: unknown) => void,
  showSuccess: (message: string) => void,
  currentMonth: number
): UsePaymentSelectionReturn {
  const [selectingMode, setSelectingMode] = useState<'payment' | 'period' | null>(null)
  const [selectingPaymentId, setSelectingPaymentId] = useState<string | null>(null)
  const [periodSelectionStart, setPeriodSelectionStart] = useState<number | null>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [selectionDays, setSelectionDays] = useState<Set<number>>(new Set())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const startSelectPaymentDay = useCallback((id: string) => {
    setSelectingMode('payment')
    setSelectingPaymentId(id)
    showSuccess('Выберите день выплаты в календаре')
  }, [showSuccess])

  const startSelectPeriod = useCallback((id: string) => {
    setSelectingMode('period')
    setSelectingPaymentId(id)
    setPeriodSelectionStart(null)
    setSelectionDays(new Set())
    showSuccess('Зажмите мышь и выделите период')
  }, [showSuccess])

  const handleMouseDown = useCallback((day: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (selectingMode === 'period') {
      setIsMouseDown(true)
      setSelectionDays(new Set([day]))
      setPeriodSelectionStart(day)
    }
  }, [selectingMode])

  const handleMouseEnter = useCallback((day: number) => {
    if (isMouseDown && selectingMode === 'period' && periodSelectionStart !== null) {
      const start = Math.min(periodSelectionStart, day)
      const end = Math.max(periodSelectionStart, day)
      const newSelection = new Set<number>()
      for (let i = start; i <= end; i++) newSelection.add(i)
      setSelectionDays(newSelection)
    }
    if (selectingMode === 'payment') setHoveredDay(day)
  }, [isMouseDown, selectingMode, periodSelectionStart])

  const handleMouseUp = useCallback((day: number, e?: React.MouseEvent) => {
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
  }, [isMouseDown, selectingMode, selectingPaymentId, periodSelectionStart, onUpdatePeriod, showSuccess, currentMonth])

  const handleDayClick = useCallback((day: number, onUpdatePaymentDay?: (id: string, day: number, month: number) => void) => {
    if (selectingMode === 'period') return

    if (selectingMode === 'payment' && selectingPaymentId && onUpdatePaymentDay) {
      onUpdatePaymentDay(selectingPaymentId, day, currentMonth)
      setSelectingMode(null)
      setSelectingPaymentId(null)
      setHoveredDay(null)
      showSuccess('День выплаты установлен')
    }
  }, [selectingMode, selectingPaymentId, currentMonth, showSuccess])

  const resetSelection = useCallback(() => {
    setSelectingMode(null)
    setSelectingPaymentId(null)
    setHoveredDay(null)
    setSelectionDays(new Set())
    setPeriodSelectionStart(null)
    setIsMouseDown(false)
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (selectingMode !== 'period') setIsMouseDown(false)
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
