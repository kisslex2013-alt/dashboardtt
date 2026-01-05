/**
 * 💰 PaymentsSection Component
 *
 * Секция настройки дат выплат.
 */

import { Plus } from 'lucide-react'
import { PaymentCalendar } from '../../../modals/PaymentDatesSettingsModal/PaymentCalendar'
import { PaymentDateItem } from '../../../modals/PaymentDatesSettingsModal/PaymentDateItem'

interface PaymentsSectionProps {
  paymentDates: any[]
  calendar: any
  isPaymentDay: (day: number) => boolean
  isInPeriod: (day: number) => any
  selectionState: any
  handleDayClick: (day: number) => void
  selection: any
  editingId: string | null
  handleStartEdit: (payment: any) => void
  handleUpdateField: (id: string, field: string, value: any) => void
  handleUpdatePeriodBoth: (id: string, startDay: number, endDay: number) => void
  handleSaveEdit: (id: string) => void
  handleDelete: (id: string) => void
  handleCancelEdit: () => void
  handleToggleRepeat: (id: string) => void
  handleUpdatePaymentDay: (id: string, day: number) => void
  draggedId: string | null
  handleDragStart: (e: React.DragEvent, id: string) => void
  handleDragEnd: (e: any) => void
  handleDragOver: (e: React.DragEvent, order: number) => void
  handleDragEnter: (e: React.DragEvent, order: number) => void
  handleDrop: (e: React.DragEvent, targetId: string) => void
  handleAddPayment: () => void
}

export function PaymentsSection({
  paymentDates,
  calendar,
  isPaymentDay,
  isInPeriod,
  selectionState,
  handleDayClick,
  selection,
  editingId,
  handleStartEdit,
  handleUpdateField,
  handleUpdatePeriodBoth,
  handleSaveEdit,
  handleDelete,
  handleCancelEdit,
  handleToggleRepeat,
  handleUpdatePaymentDay,
  draggedId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDrop,
  handleAddPayment
}: PaymentsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Левая часть: Календарь */}
        <div className="lg:col-span-2">
          <PaymentCalendar
            currentYear={calendar.currentYear}
            currentMonth={calendar.currentMonth}
            daysInMonth={calendar.daysInMonth}
            firstDay={calendar.firstDay}
            changeMonth={calendar.changeMonth}
            paymentDates={paymentDates}
            isPaymentDay={isPaymentDay}
            isInPeriod={isInPeriod}
            selectionState={selectionState}
            onDayClick={handleDayClick}
            onMouseDown={selection.handleMouseDown}
            onMouseEnter={selection.handleMouseEnter}
            onMouseUp={selection.handleMouseUp}
          />
        </div>

        {/* Правая часть: Список выплат */}
        <div className="lg:col-span-1 space-y-3 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Выплаты</h3>

          {paymentDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm mb-2">Нет настроенных выплат</p>
              <p className="text-xs">Добавьте первую выплату</p>
            </div>
          ) : (
            paymentDates
              .sort((a, b) => a.order - b.order)
              .map(payment => (
                <PaymentDateItem
                  key={payment.id}
                  payment={payment}
                  isEditing={editingId === payment.id}
                  currentMonth={calendar.currentMonth}
                  selectionState={selectionState}
                  onStartEdit={handleStartEdit}
                  onUpdateField={handleUpdateField}
                  onUpdatePeriod={handleUpdatePeriodBoth}
                  onStartSelectPaymentDay={selection.startSelectPaymentDay}
                  onStartSelectPeriod={selection.startSelectPeriod}
                  onSave={handleSaveEdit}
                  onDelete={handleDelete}
                  onCancel={handleCancelEdit}
                  onToggleRepeat={handleToggleRepeat}
                  onUpdatePaymentDay={handleUpdatePaymentDay}
                  draggedId={draggedId}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDrop={handleDrop}
                />
              ))
          )}

          {/* Кнопка добавления */}
          <button
            onClick={handleAddPayment}
            className="glass-button w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-normal hover-lift-scale click-shrink flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="w-4 h-4" />
            Добавить выплату
          </button>
        </div>
      </div>
    </>
  )
}
