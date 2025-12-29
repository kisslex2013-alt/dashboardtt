import { useMemo } from 'react'
import { CheckCircle, Clock, Zap, Flame, Sliders } from '../../../utils/icons'
import {
  generateMonthCalendar,
  generateCustomCalendar,
  countWorkDays,
  getWeekDays,
  CalendarDay,
} from './useScheduleCalendar'
import type { ComponentType } from 'react'

type ColorName = 'blue' | 'purple' | 'orange' | 'red' | 'green'

export interface ScheduleTemplate {
  id: string
  title: string
  description: string
  workDays: number
  offDays: number
  weekDays: string[]
  calendar: CalendarDay[]
  monthlyDays: number
  efficiency: number
  iconColor: ColorName
  icon: ComponentType<{ className?: string }>
  tag: string
  tagColor: ColorName
}

export function useScheduleTemplates(
  customDays: boolean[],
  weekStart: number,
  customWorkDates: Record<string, boolean>
): ScheduleTemplate[] {
  return useMemo(() => {
    const calendar5_2 = generateMonthCalendar('5/2', weekStart)
    const calendar2_2 = generateMonthCalendar('2/2', weekStart)
    const calendar3_3 = generateMonthCalendar('3/3', weekStart)
    const calendar5_5 = generateMonthCalendar('5/5', weekStart)
    const calendarCustom = generateCustomCalendar(customWorkDates)

    return [
      {
        id: '5/2',
        title: 'Стандартный 5/2',
        description: 'Пять рабочих, два выходных',
        workDays: 5,
        offDays: 2,
        weekDays: getWeekDays(weekStart),
        calendar: calendar5_2,
        monthlyDays: countWorkDays(calendar5_2),
        efficiency: Math.round((countWorkDays(calendar5_2) / 31) * 100),
        iconColor: 'blue',
        icon: CheckCircle,
        tag: 'Классический',
        tagColor: 'blue',
      },
      {
        id: '2/2',
        title: 'Сменный 2/2',
        description: 'Два рабочих, два выходных',
        workDays: 2,
        offDays: 2,
        weekDays: getWeekDays(weekStart),
        calendar: calendar2_2,
        monthlyDays: countWorkDays(calendar2_2),
        efficiency: Math.round((countWorkDays(calendar2_2) / 31) * 100),
        iconColor: 'purple',
        icon: Clock,
        tag: 'Сменный',
        tagColor: 'purple',
      },
      {
        id: '3/3',
        title: 'Баланс 3/3',
        description: 'Три рабочих, три выходных',
        workDays: 3,
        offDays: 3,
        weekDays: getWeekDays(weekStart),
        calendar: calendar3_3,
        monthlyDays: countWorkDays(calendar3_3),
        efficiency: Math.round((countWorkDays(calendar3_3) / 31) * 100),
        iconColor: 'orange',
        icon: Zap,
        tag: 'Сменный',
        tagColor: 'orange',
      },
      {
        id: '5/5',
        title: 'Интенсивный 5/5',
        description: 'Вахтовый метод работы',
        workDays: 5,
        offDays: 5,
        weekDays: getWeekDays(weekStart),
        calendar: calendar5_5,
        monthlyDays: countWorkDays(calendar5_5),
        efficiency: Math.round((countWorkDays(calendar5_5) / 31) * 100),
        iconColor: 'red',
        icon: Flame,
        tag: 'Интенсивный',
        tagColor: 'red',
      },
      {
        id: 'custom',
        title: 'Кастомный',
        description: 'Настраиваемый график',
        workDays: customDays.filter(d => d).length,
        offDays: customDays.filter(d => !d).length,
        weekDays: getWeekDays(weekStart),
        calendar: calendarCustom,
        monthlyDays: countWorkDays(calendarCustom),
        efficiency: Math.round((countWorkDays(calendarCustom) / 31) * 100),
        iconColor: 'green',
        icon: Sliders,
        tag: 'Гибкий',
        tagColor: 'green',
      },
    ]
  }, [customDays, weekStart, customWorkDates])
}
