import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from '../../utils/icons'
import {
  useTheme,
  useWorkScheduleTemplate,
  useWorkScheduleStartDay,
  useCustomWorkDates,
  useDailyGoal,
} from '../../store/useSettingsStore'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ru } from 'date-fns/locale' // ИСПРАВЛЕНО: Импорт локали для русских названий месяцев
import { InfoTooltip } from '../ui/InfoTooltip'
import { MonthPicker } from '../ui/MonthPicker' // ИСПРАВЛЕНО: Импорт кастомного MonthPicker
import { getDayStatus } from '../../utils/dayMetrics'

/**
 * 📊 Календарь доходов (Heatmap)
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * Этот компонент показывает визуализацию ежедневных доходов в виде календаря.
 * Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет.
 *
 * Особенности:
 * - Навигация по месяцам (стрелки и input)
 * - Режим сравнения двух месяцев
 * - Интерактивные подсказки при наведении
 * - Поддержка клавиатурной навигации (стрелки)
 * - Выделение текущего дня
 *
 * @param {Array} entries - Отфильтрованные записи
 */
export const CalendarHeatmap = memo(({ entries }) => {
  // ✅ ОПТИМИЗАЦИЯ: Используем атомарные селекторы для минимизации ре-рендеров
  const theme = useTheme()
  const workScheduleTemplate = useWorkScheduleTemplate()
  const workScheduleStartDay = useWorkScheduleStartDay()
  const customWorkDates = useCustomWorkDates()
  const dailyGoal = useDailyGoal()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [compareDate, setCompareDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date
  })
  // Режим сравнения всегда активен
  const isComparing = true
  // ИСПРАВЛЕНО: Отдельные состояния hoveredDay для каждого календаря для синхронизации тултипов
  const [hoveredDay, setHoveredDay] = useState(null)
  const [hoveredDayCompare, setHoveredDayCompare] = useState(null)
  const [focusedDayIndex, setFocusedDayIndex] = useState(null)
  const tooltipRef = useRef(null)
  const tooltipCompareRef = useRef(null) // ИСПРАВЛЕНО: Ref для второго тултипа
  const calendarRef = useRef(null)
  // ИСПРАВЛЕНО: Состояния для кастомного MonthPicker
  const [showMonthPicker, setShowMonthPicker] = useState({ current: false, compare: false })
  const currentMonthInputRef = useRef(null)
  const compareMonthInputRef = useRef(null)

  // ИСПРАВЛЕНО: Определение нерабочих дней на основе графика работы
  const isNonWorkingDay = useMemo(() => {
    return date => {
      // Проверяем кастомные даты
      const dateStr = format(date, 'yyyy-MM-dd')
      if (customWorkDates && customWorkDates[dateStr] !== undefined) {
        return !customWorkDates[dateStr]
      }

      // Проверяем шаблон графика работы
      if (workScheduleTemplate === 'custom' && workScheduleStartDay) {
        const dayOfWeek = date.getDay() // 0 = воскресенье, 1 = понедельник, ...
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek // Преобразуем в 1-7, где 1 = понедельник

        // Определяем день недели относительно начального дня графика
        const dayInSchedule = ((adjustedDayOfWeek - workScheduleStartDay + 7) % 7) + 1

        // График 5/2 означает: дни 1-5 рабочие, дни 6-7 нерабочие
        // График 2/2 означает: дни 1-2 рабочие, дни 3-4 нерабочие, дни 5-6 рабочие, день 7 нерабочий
        if (workScheduleTemplate === '5/2') {
          return dayInSchedule > 5
        } else if (workScheduleTemplate === '2/2') {
          return dayInSchedule === 4 || dayInSchedule === 7
        } else if (workScheduleTemplate === 'custom') {
          // Для кастомного графика проверяем конкретные дни недели
          // Здесь можно добавить дополнительную логику для кастомного графика
          return false // По умолчанию все дни рабочие
        }
      }

      return false // По умолчанию все дни рабочие
    }
  }, [workScheduleTemplate, workScheduleStartDay, customWorkDates])

  // Подготовка данных для календаря
  const calendarData = useMemo(() => {
    if (!entries || entries.length === 0) return {}

    const data = {}

    entries.forEach(entry => {
      const dateStr = entry.date
      if (!data[dateStr]) {
        data[dateStr] = {
          totalEarned: 0,
          totalHours: 0,
          entryCount: 0,
        }
      }

      data[dateStr].totalEarned += parseFloat(entry.earned) || 0

      // Рассчитываем часы
      if (entry.duration) {
        data[dateStr].totalHours += parseFloat(entry.duration) || 0
      } else if (entry.start && entry.end) {
        const [startH, startM] = entry.start.split(':').map(Number)
        const [endH, endM] = entry.end.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM
        if (endMinutes < startMinutes) endMinutes += 24 * 60
        data[dateStr].totalHours += (endMinutes - startMinutes) / 60
      }

      data[dateStr].entryCount += 1
    })

    // Рассчитываем среднюю ставку и статус выполнения плана для каждого дня
    Object.keys(data).forEach(dateStr => {
      const dayData = data[dateStr]
      dayData.avgRate = dayData.totalHours > 0 ? dayData.totalEarned / dayData.totalHours : 0

      // ВИЗУАЛ: Рассчитываем статус выполнения плана для цветовой индикации
      if (dailyGoal && dailyGoal > 0) {
        const dayStatus = getDayStatus(dayData.totalEarned, dailyGoal)
        dayData.status = dayStatus.status // 'success', 'warning', 'danger', или null
        dayData.percent = dayStatus.percent
      } else {
        dayData.status = null
        dayData.percent = null
      }
    })

    return data
  }, [entries, dailyGoal])

  // ИСПРАВЛЕНО: Обработка изменения месяца через кастомный MonthPicker
  const handleMonthChange = (setter, isCompare) => value => {
    const [year, month] = value.split('-').map(Number)
    setter(new Date(year, month - 1, 1))
    setShowMonthPicker(prev => ({ ...prev, [isCompare ? 'compare' : 'current']: false }))
  }

  // Навигация по месяцам
  const navigateMonth = (setDate, amount) => () => {
    setDate(current => {
      const newDate = new Date(current)
      newDate.setMonth(current.getMonth() + amount)
      return newDate
    })
  }

  // ВИЗУАЛ: Функция для поиска дня по позиции (индексу) в календаре
  // Используется для синхронизации тултипов между календарями по позиции (крайний правый = воскресенье первой недели)
  const findDayByPosition = useMemo(() => {
    return (targetDate, positionIndex) => {
      const monthDays = generateCalendar(targetDate)

      // Проверяем, что индекс валидный
      if (
        positionIndex === undefined ||
        positionIndex === null ||
        positionIndex < 0 ||
        positionIndex >= monthDays.length
      ) {
        return null
      }

      const targetDay = monthDays[positionIndex]

      // Возвращаем день только если это не placeholder
      return targetDay && !targetDay.isPlaceholder ? targetDay : null
    }
  }, [])

  // ВИЗУАЛ: Позиционирование tooltip при движении мыши
  // Тултип левого календаря следует за курсором, тултип правого - позиционируется рядом с соответствующим днем
  useEffect(() => {
    const updateTooltipPositions = () => {
      // Тултип правого календаря позиционируется рядом с соответствующим днем
      if (tooltipCompareRef.current && hoveredDayCompare) {
        const compareCalendarElement = document.querySelector('[data-calendar="compare"]')
        if (compareCalendarElement) {
          const dayElement = compareCalendarElement.querySelector(
            `[data-day-index="${hoveredDayCompare.positionIndex}"]`
          )

          if (dayElement) {
            const dayRect = dayElement.getBoundingClientRect()
            tooltipCompareRef.current.style.left = `${dayRect.right + 10}px`
            tooltipCompareRef.current.style.top = `${dayRect.top}px`
          }
        }
      }

      // Если наводим на правый календарь, тултип левого также позиционируется рядом с соответствующим днем
      if (tooltipRef.current && hoveredDay && hoveredDayCompare) {
        const compareCalendarElement = document.querySelector('[data-calendar="compare"]')
        const isHoveringCompare = compareCalendarElement && compareCalendarElement.matches(':hover')

        if (isHoveringCompare) {
          const currentCalendarElement = document.querySelector('[data-calendar="current"]')
          if (currentCalendarElement) {
            const dayElement = currentCalendarElement.querySelector(
              `[data-day-index="${hoveredDay.positionIndex}"]`
            )
            if (dayElement) {
              const dayRect = dayElement.getBoundingClientRect()
              tooltipRef.current.style.left = `${dayRect.right + 10}px`
              tooltipRef.current.style.top = `${dayRect.top}px`
            }
          }
        }
      }
    }

    const handleMouseMove = e => {
      // Тултип левого календаря следует за курсором (если не наводим на правый календарь)
      if (tooltipRef.current && hoveredDay) {
        const compareCalendarElement = document.querySelector('[data-calendar="compare"]')
        const isHoveringCompare = compareCalendarElement && compareCalendarElement.matches(':hover')

        if (!isHoveringCompare) {
          tooltipRef.current.style.left = `${e.clientX + 15}px`
          tooltipRef.current.style.top = `${e.clientY + 15}px`
        }
      }

      // Обновляем позиции тултипов относительно дней
      updateTooltipPositions()
    }

    window.addEventListener('mousemove', handleMouseMove)
    // Обновляем позиции при изменении hoveredDay/hoveredDayCompare
    updateTooltipPositions()

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [hoveredDay, hoveredDayCompare])

  // Генерация календаря для месяца
  const generateCalendar = date => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Заполняем дни предыдущего месяца (для выравнивания по неделям)
    let startOffset = firstDay.getDay() - 1 // Понедельник = 0
    if (startOffset === -1) startOffset = 6 // Воскресенье = 6

    for (let i = 0; i < startOffset; i++) {
      days.push({
        key: `prev-${i}`,
        isPlaceholder: true,
        positionIndex: days.length, // ВИЗУАЛ: Сохраняем позицию для синхронизации тултипов
      })
    }

    // Добавляем дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i)
      const dateString = format(dayDate, 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')

      // ИСПРАВЛЕНО: Определяем, является ли день нерабочим
      const nonWorking = isNonWorkingDay(dayDate)

      days.push({
        key: dateString,
        date: dayDate,
        data: calendarData[dateString],
        isToday: dateString === today,
        isNonWorking: nonWorking, // ИСПРАВЛЕНО: Добавлен флаг нерабочего дня
        positionIndex: days.length, // ВИЗУАЛ: Сохраняем позицию в календаре для синхронизации тултипов
      })
    }

    return days
  }

  // Обработка клавиатурной навигации
  const handleKeyDown = (e, days) => {
    if (focusedDayIndex === null) return

    const totalDays = days.length
    let newIndex = focusedDayIndex

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (focusedDayIndex + 1) % totalDays
        break
      case 'ArrowLeft':
        newIndex = (focusedDayIndex - 1 + totalDays) % totalDays
        break
      case 'ArrowDown':
        newIndex = (focusedDayIndex + 7) % totalDays
        break
      case 'ArrowUp':
        newIndex = (focusedDayIndex - 7 + totalDays) % totalDays
        break
      default:
        return
    }

    setFocusedDayIndex(newIndex)
    const newDay = days[newIndex]
    if (!newDay.isPlaceholder) {
      setHoveredDay(newDay)
    }
    e.preventDefault()
  }

  const handleDayClick = (day, index) => {
    if (!day.isPlaceholder) {
      setFocusedDayIndex(index)
      setHoveredDay(day)
    }
  }

  // Получение цвета для ячейки с учетом обоих календарей при сравнении
  // Режим сравнения всегда активен, поэтому всегда вычисляем общие min/max
  const getAllMonthDataValues = useMemo(() => {
    const currentMonthDays = generateCalendar(currentDate)
    const compareMonthDays = generateCalendar(compareDate)

    const allValues = [
      ...currentMonthDays.filter(d => d.data).map(d => d.data.totalEarned),
      ...compareMonthDays.filter(d => d.data).map(d => d.data.totalEarned),
    ]

    return {
      min: Math.min(...allValues, 0),
      max: Math.max(...allValues, 0),
    }
  }, [currentDate, compareDate, calendarData])

  const getColor = (value, monthDays) => {
    // ИСПРАВЛЕНО: Пустые дни - максимально контрастные цвета
    if (!value) {
      // В dark теме используем максимально темный (#000000), в light - максимально белый (#FFFFFF)
      return theme === 'dark' ? '#000000' : '#FFFFFF'
    }

    // Режим сравнения всегда активен, используем общие min/max из обоих календарей
    let minEarned, maxEarned

    if (getAllMonthDataValues) {
      minEarned = getAllMonthDataValues.min
      maxEarned = getAllMonthDataValues.max
    } else {
      // Fallback: вычисляем min/max из текущего месяца
      const values = monthDays
        .filter(day => day.data && day.data.totalEarned > 0)
        .map(day => day.data.totalEarned)
      minEarned = Math.min(...values, 0)
      maxEarned = Math.max(...values, 0)
    }

    if (maxEarned === minEarned) {
      return 'rgba(34, 197, 94, 0.1)'
    }

    const ratio = (value - minEarned) / (maxEarned - minEarned)
    const opacity = 0.1 + ratio * 0.9
    return `rgba(34, 197, 94, ${opacity})`
  }

  // Рендер календаря
  const renderCalendar = (date, setDate, title) => {
    const monthDays = generateCalendar(date)

    // ВИЗУАЛ: Определяем, какой день должен быть выделен в этом календаре
    // Если это левый календарь и есть hoveredDayCompare - выделяем его
    // Если это правый календарь и есть hoveredDay - выделяем его
    const highlightedDay = title === 'Текущий период' ? hoveredDayCompare : hoveredDay

    return (
      <div className="flex flex-col">
        {/* Заголовок с навигацией */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateMonth(setDate, -1)}
              className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* ИСПРАВЛЕНО: Заменен нативный input type="month" на кастомную кнопку */}
            <button
              ref={title === 'Текущий период' ? currentMonthInputRef : compareMonthInputRef}
              onClick={() =>
                setShowMonthPicker(prev => ({
                  ...prev,
                  [title === 'Текущий период' ? 'current' : 'compare']: true,
                }))
              }
              className="glass-effect font-bold text-lg px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-normal hover-lift-scale click-shrink"
            >
              {format(date, 'MMMM yyyy', { locale: ru })}
            </button>
            {showMonthPicker[title === 'Текущий период' ? 'current' : 'compare'] && (
              <MonthPicker
                value={format(date, 'yyyy-MM')}
                onChange={handleMonthChange(setDate, title === 'Сравниваемый период')}
                onClose={() =>
                  setShowMonthPicker(prev => ({
                    ...prev,
                    [title === 'Текущий период' ? 'current' : 'compare']: false,
                  }))
                }
                inputRef={title === 'Текущий период' ? currentMonthInputRef : compareMonthInputRef}
              />
            )}
            <button
              onClick={navigateMonth(setDate, 1)}
              className="p-1 rounded-full hover:bg-gray-500/10 transition-colors"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h4 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h4>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Календарная сетка */}
        <div
          ref={calendarRef}
          data-calendar={title === 'Текущий период' ? 'current' : 'compare'}
          className="grid grid-cols-7 gap-1 focus:outline-none"
          tabIndex={0}
          onKeyDown={e => handleKeyDown(e, monthDays)}
        >
          {monthDays.map((day, index) => {
            // ВИЗУАЛ: Определяем классы для контраста и цветовую индикацию выполнения плана
            const hasEntries = day.data && !day.isNonWorking
            const isEmpty = !day.data && !day.isNonWorking

            // Определяем класс цвета на основе выполнения плана
            let statusClass = ''
            if (hasEntries && day.data.status) {
              switch (day.data.status) {
                case 'success': // ≥ 100%
                  statusClass = 'calendar-day-success'
                  break
                case 'warning': // 50-99%
                  statusClass = 'calendar-day-warning'
                  break
                case 'danger': // < 50%
                  statusClass = 'calendar-day-danger'
                  break
              }
            }

            // ВИЗУАЛ: Проверяем, должна ли эта ячейка быть выделена (соответствует тултипу из другого календаря)
            const isHighlighted =
              highlightedDay &&
              !day.isPlaceholder &&
              highlightedDay.positionIndex === day.positionIndex

            return (
              <div
                key={day.key}
                data-day-index={day.positionIndex}
                tabIndex={day.isPlaceholder ? -1 : 0}
                className={`
                relative aspect-square flex items-center justify-center rounded-md transition-all duration-200 text-sm
                ${day.isPlaceholder ? 'opacity-0' : 'focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-500'}
                ${day.isToday ? 'font-bold ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                ${focusedDayIndex === index && !day.isPlaceholder ? 'ring-4 ring-blue-500' : ''}
                ${isHighlighted ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg shadow-yellow-500/50' : ''}
                ${day.isNonWorking && !day.data ? 'border-2 border-dashed' : ''}
                ${statusClass}
                ${isEmpty ? 'calendar-day-empty' : ''}
                text-white
              `}
                style={{
                  backgroundColor: day.data
                    ? day.data.status
                      ? undefined // Для дней с записями и установленным планом используем CSS классы по статусу
                      : getColor(day.data.totalEarned, monthDays) // Если план не установлен, используем старую логику цвета
                    : day.isNonWorking
                      ? 'transparent' // Прозрачный фон для нерабочих дней
                      : undefined, // Для пустых рабочих дней используем CSS классы из custom.css
                  borderColor:
                    day.isNonWorking && !day.data
                      ? theme === 'dark'
                        ? '#374151' // Темно-серый border для нерабочих дней в dark теме
                        : '#D1D5DB' // Светло-серый border для нерабочих дней в light теме
                      : 'transparent',
                }}
                onMouseEnter={() => {
                  if (!day.isPlaceholder && day.positionIndex !== undefined) {
                    // ВИЗУАЛ: Синхронизация тултипов между календарями по позиции (индексу) в календаре
                    // Крайний правый квадрат первой недели = крайний правый квадрат первой недели в другом календаре
                    if (title === 'Текущий период') {
                      setHoveredDay(day)
                      // Находим соответствующий день в правом календаре по той же позиции
                      const correspondingDay = findDayByPosition(compareDate, day.positionIndex)
                      if (correspondingDay) {
                        setHoveredDayCompare(correspondingDay)
                      } else {
                        // Если не нашли соответствующий день, все равно показываем тултип для текущего дня
                        setHoveredDayCompare(null)
                      }
                    } else {
                      setHoveredDayCompare(day)
                      // Находим соответствующий день в левом календаре по той же позиции
                      const correspondingDay = findDayByPosition(currentDate, day.positionIndex)
                      if (correspondingDay) {
                        setHoveredDay(correspondingDay)
                      } else {
                        // Если не нашли соответствующий день, все равно показываем тултип для текущего дня
                        setHoveredDay(null)
                      }
                    }
                  }
                }}
                onMouseLeave={() => {
                  // ИСПРАВЛЕНО: Очищаем оба тултипа при уходе мыши
                  if (title === 'Текущий период') {
                    setHoveredDay(null)
                    setHoveredDayCompare(null)
                  } else {
                    setHoveredDayCompare(null)
                    setHoveredDay(null)
                  }
                }}
                onClick={() => handleDayClick(day, index)}
                onFocus={() => {
                  if (!day.isPlaceholder) {
                    // ВИЗУАЛ: При фокусе также синхронизируем тултипы по позиции
                    if (title === 'Текущий период') {
                      setHoveredDay(day)
                      const correspondingDay = findDayByPosition(compareDate, day.positionIndex)
                      if (correspondingDay) {
                        setHoveredDayCompare(correspondingDay)
                      } else {
                        setHoveredDayCompare(null)
                      }
                    } else {
                      setHoveredDayCompare(day)
                      const correspondingDay = findDayByPosition(currentDate, day.positionIndex)
                      if (correspondingDay) {
                        setHoveredDay(correspondingDay)
                      } else {
                        setHoveredDay(null)
                      }
                    }
                  }
                }}
              >
                {!day.isPlaceholder && <span>{day.date.getDate()}</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-xl p-6 mb-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Календарь доходов</h3>
          <InfoTooltip text="Визуализация ежедневных доходов с сравнением двух месяцев. Цвет ячейки зависит от заработанной суммы: чем она выше, тем насыщеннее цвет." />
        </div>
      </div>

      {/* Календари */}
      <div className={`grid ${isComparing ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
        {renderCalendar(currentDate, setCurrentDate, 'Текущий период')}
        {isComparing && renderCalendar(compareDate, setCompareDate, 'Сравниваемый период')}
      </div>

      {/* ВИЗУАЛ: Тултипы для обоих календарей с синхронизацией по позиции */}
      {/* Рендерим тултипы независимо друг от друга */}
      {hoveredDay &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
          >
            <p className="font-bold text-gray-900 dark:text-white mb-1">
              {hoveredDay.date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {hoveredDay.data ? (
              <>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  Заработано: {hoveredDay.data.totalEarned.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Часы: {hoveredDay.data.totalHours.toFixed(2)} ч
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Средняя ставка: {hoveredDay.data.avgRate.toFixed(0)} ₽/ч
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Нет записей за этот день</p>
            )}
          </div>,
          document.body
        )}
      {hoveredDayCompare &&
        createPortal(
          <div
            ref={tooltipCompareRef}
            className="fixed glass-effect p-3 rounded-lg shadow-xl text-sm border border-gray-200 dark:border-gray-700 pointer-events-none z-[999999]"
          >
            <p className="font-bold text-gray-900 dark:text-white mb-1">
              {hoveredDayCompare.date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {hoveredDayCompare.data ? (
              <>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  Заработано: {hoveredDayCompare.data.totalEarned.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Часы: {hoveredDayCompare.data.totalHours.toFixed(2)} ч
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Средняя ставка: {hoveredDayCompare.data.avgRate.toFixed(0)} ₽/ч
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Нет записей за этот день</p>
            )}
          </div>,
          document.body
        )}
    </div>
  )
})
