import { Calendar, Save, Trash2, X, Palette, Repeat, CalendarX } from 'lucide-react'
import { formatDate, getPaymentMonth, getPeriodMonth } from './utils/calendarHelpers'

/**
 * Форма редактирования выплаты
 */
export function PaymentDateForm({
  payment,
  currentMonth,
  selectingMode,
  selectingPaymentId,
  hoveredDay,
  selectionDays,
  onUpdateField,
  onUpdatePeriod,
  onStartSelectPaymentDay,
  onStartSelectPeriod,
  onSave,
  onDelete,
  onCancel,
  onToggleRepeat,
}) {
  const periodMonth = getPeriodMonth(payment)
  const paymentMonth = getPaymentMonth(payment)

  return (
    <div className="space-y-3">
      {/* Название */}
      <input
        type="text"
        value={payment.name}
        onChange={e => onUpdateField(payment.id, 'name', e.target.value)}
        className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Название выплаты"
      />

      {/* День выплаты */}
      <div className="flex items-center gap-2">
        <label
          id={`payment-day-label-live-${payment.id}`}
          className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1"
          style={
            selectingMode === 'payment' && selectingPaymentId === payment.id && hoveredDay
              ? { color: '#3B82F6', fontWeight: 'bold' }
              : {}
          }
        >
          Дата выплаты:{' '}
          {selectingMode === 'payment' && selectingPaymentId === payment.id && hoveredDay
            ? formatDate(hoveredDay, currentMonth)
            : payment.customDate || formatDate(payment.day, paymentMonth)}
        </label>
        <button
          onClick={() => onStartSelectPaymentDay(payment.id)}
          className="glass-button flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-1"
        >
          <Calendar className="w-3 h-3 flex-shrink-0" />
          Выбрать
        </button>
      </div>

      {/* Период */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            id={`period-label-live-${payment.id}`}
            className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1"
            style={
              selectingMode === 'period' && selectingPaymentId === payment.id && selectionDays.size > 0
                ? { color: '#3B82F6', fontWeight: 'bold' }
                : {}
            }
          >
            Период:{' '}
            {selectingMode === 'period' && selectingPaymentId === payment.id && selectionDays.size > 0
              ? `${formatDate(Math.min(...Array.from(selectionDays)), currentMonth)}-${formatDate(Math.max(...Array.from(selectionDays)), currentMonth)}`
              : `${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`}
          </label>
          <button
            onClick={() => onStartSelectPeriod(payment.id)}
            className="glass-button w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
          >
            Выбрать
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Цвет
          </label>
          <input
            type="color"
            value={payment.color}
            onChange={e => onUpdateField(payment.id, 'color', e.target.value)}
            className="w-full h-7 bg-white dark:bg-gray-700 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Переключатель repeat */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1">
          {payment.enabled ? (
            <>
              <Repeat className="w-3 h-3" />
              Повторять каждый месяц
            </>
          ) : (
            <>
              <CalendarX className="w-3 h-3" />
              Единоразовая выплата
            </>
          )}
        </span>
        <div onClick={() => onToggleRepeat(payment.id)} className={`toggle-switch ${payment.enabled ? 'active' : ''}`} />
      </div>

      {/* Кнопки */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onSave(payment.id)}
          className="glass-button flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
          title="Сохранить"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(payment.id)}
          className="glass-button flex-1 py-2 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
          title="Удалить"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="glass-button flex-1 py-2 px-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center"
          title="Отмена"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

