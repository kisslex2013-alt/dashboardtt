import { Edit2, Calendar, CalendarDays, Repeat, CalendarX } from '../../../utils/icons'
import { formatDate, getPaymentMonth, getPeriodMonth } from './utils/calendarHelpers'
import { PaymentDateForm } from './PaymentDateForm'

/**
 * Карточка выплаты (отображение или редактирование)
 */
export function PaymentDateItem({
  payment,
  isEditing,
  currentMonth,
  selectionState,
  onStartEdit,
  onUpdateField,
  onUpdatePeriod,
  onStartSelectPaymentDay,
  onStartSelectPeriod,
  onSave,
  onDelete,
  onCancel,
  onToggleRepeat,
  onUpdatePaymentDay,
  draggedId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDrop,
}) {
  const periodMonth = getPeriodMonth(payment)
  const paymentMonth = getPaymentMonth(payment)

  if (isEditing) {
    return (
      <div
        className={`payment-card payment-list-item glass-effect rounded-xl p-3 border-l-4 min-w-0 payment-card-enter`}
        style={{ borderColor: payment.color }}
      >
        <PaymentDateForm
          payment={payment}
          currentMonth={currentMonth}
          selectingMode={selectionState.selectingMode}
          selectingPaymentId={selectionState.selectingPaymentId}
          hoveredDay={selectionState.hoveredDay}
          selectionDays={selectionState.selectionDays}
          onUpdateField={onUpdateField}
          onUpdatePeriod={onUpdatePeriod}
          onStartSelectPaymentDay={onStartSelectPaymentDay}
          onStartSelectPeriod={onStartSelectPeriod}
          onSave={onSave}
          onDelete={onDelete}
          onCancel={onCancel}
          onToggleRepeat={onToggleRepeat}
        />
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, payment.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={e => onDrop(e, payment.id)}
      className={`payment-card payment-list-item glass-effect rounded-xl p-3 border-l-4 min-w-0 ${
        draggedId === payment.id ? 'opacity-50' : ''
      } cursor-move hover:bg-white/20 dark:hover:bg-gray-800/70 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600`}
      style={{ borderColor: payment.color }}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-gray-900 dark:text-white font-medium text-sm drop-shadow-sm"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
          >
            {payment.name}
          </span>
          <button
            onClick={() => onStartEdit(payment.id)}
            className="glass-button p-1.5 hover:bg-gray-700 rounded-lg transition-normal hover-lift-scale click-shrink"
            title="Редактировать"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 drop-shadow-sm">
          Дата выплаты: {payment.customDate || formatDate(payment.day, paymentMonth)}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-500 mb-1 flex items-center gap-1 drop-shadow-sm">
          Период расчета: {`${formatDate(payment.period.start, periodMonth)}-${formatDate(payment.period.end, periodMonth)}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {payment.monthOffset === -1 ? (
              <>
                <CalendarDays className="w-3 h-3" />
                Пред.
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3" />
                Тек.
              </>
            )}
          </span>
          {payment.enabled ? (
            <span className="text-xs bg-green-500/15 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1 drop-shadow-sm">
              <Repeat className="w-3 h-3" />
              Повторяется
            </span>
          ) : (
            <span className="text-xs bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded flex items-center gap-1 drop-shadow-sm">
              <CalendarX className="w-3 h-3" />
              Единоразовая
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

