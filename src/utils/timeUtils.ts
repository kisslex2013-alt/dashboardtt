/**
 * Расчет времени перерыва между двумя записями
 * @param entryEnd Время окончания текущей записи (HH:MM)
 * @param nextEntryStart Время начала следующей записи (HH:MM)
 * @returns Строка перерыва "H:MM" или null, если перерыва нет
 */
export function calculateBreak(entryEnd: string | undefined | null, nextEntryStart: string | undefined | null): string | null {
  if (!entryEnd || !nextEntryStart) return null

  const [endH, endM] = entryEnd.split(':').map(Number)
  const [startH, startM] = nextEntryStart.split(':').map(Number)

  const endMinutes = endH * 60 + endM
  const startMinutes = startH * 60 + startM

  // Если следующая запись начинается раньше, чем заканчивается текущая
  const breakMinutes = startMinutes - endMinutes

  if (breakMinutes < 0) {
    return null
  }

  const hours = Math.floor(breakMinutes / 60)
  const minutes = breakMinutes % 60

  // 0:00 не показываем
  if (hours === 0 && minutes === 0) return null

  return `${hours}:${minutes.toString().padStart(2, '0')}`
}
