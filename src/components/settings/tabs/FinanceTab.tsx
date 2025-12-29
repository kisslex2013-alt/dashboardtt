/**
 * 💰 FinanceTab Component
 *
 * Вкладка настройки выплат.
 */

import { PaymentsSection } from './finance/PaymentsSection'

interface FinanceTabProps {
  paymentDates: any[]
  calendar: any
  isPaymentDay: (day: number) => boolean
  isInPeriod: (day: number) => boolean
  selectionState: any
  handleDayClick: (day: number) => void
  selection: any
  editingId: string | null
  handleStartEdit: (payment: any) => void
  handleUpdateField: (id: string, field: string, value: any) => void
  handleUpdatePeriodBoth: (id: string, startDay: number, endDay: number) => void
  handleSaveEdit: (id: string) => void
  handleDeletePayment: (id: string) => void
  handleCancelEdit: () => void
  handleToggleRepeat: (id: string) => void
  handleUpdatePaymentDay: (id: string, day: number) => void
  draggedId: string | null
  handleDragStart: (e: React.DragEvent, id: string) => void
  handleDragEnd: () => void
  handleDragOver: (e: React.DragEvent, order: number) => void
  handleDragEnter: (e: React.DragEvent, order: number) => void
  handleDrop: (e: React.DragEvent, targetId: string) => void
  handleAddPayment: () => void
}

export function FinanceTab({
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
  handleDeletePayment,
  handleCancelEdit,
  handleToggleRepeat,
  handleUpdatePaymentDay,
  draggedId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDrop,
  handleAddPayment,
}: FinanceTabProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Выплаты
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Управление датами выплат и периодами работы
        </p>
      </div>

      <PaymentsSection
        paymentDates={paymentDates}
        calendar={calendar}
        isPaymentDay={isPaymentDay}
        isInPeriod={isInPeriod}
        selectionState={selectionState}
        handleDayClick={handleDayClick}
        selection={selection}
        editingId={editingId}
        handleStartEdit={handleStartEdit}
        handleUpdateField={handleUpdateField}
        handleUpdatePeriodBoth={handleUpdatePeriodBoth}
        handleSaveEdit={handleSaveEdit}
        handleDelete={handleDeletePayment}
        handleCancelEdit={handleCancelEdit}
        handleToggleRepeat={handleToggleRepeat}
        handleUpdatePaymentDay={handleUpdatePaymentDay}
        draggedId={draggedId}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        handleDragOver={handleDragOver}
        handleDragEnter={handleDragEnter}
        handleDrop={handleDrop}
        handleAddPayment={handleAddPayment}
      />
    </div>
  )
}

