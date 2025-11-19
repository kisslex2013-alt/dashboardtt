import { useCallback } from 'react'
import { validatePaymentDate } from '../../../../utils/paymentCalculations'

/**
 * Хук для валидации выплат
 * @param {Array} paymentDates - массив выплат
 * @returns {Object} объект с методами валидации
 */
export function usePaymentValidation(paymentDates) {
  /**
   * Валидирует одну выплату
   * @param {Object} payment - объект выплаты
   * @param {string} excludeId - ID выплаты для исключения из проверки дубликатов
   * @returns {Object} результат валидации {isValid: boolean, errors: Array}
   */
  const validatePayment = useCallback(
    (payment, excludeId = null) => {
      const otherPayments = paymentDates.filter(p => p.id !== excludeId)
      return validatePaymentDate(payment, otherPayments)
    },
    [paymentDates]
  )

  /**
   * Валидирует все выплаты
   * @returns {Object} результат валидации {isValid: boolean, errors: Array}
   */
  const validateAll = useCallback(() => {
    const errors = []
    paymentDates.forEach(payment => {
      const validation = validatePayment(payment, payment.id)
      if (!validation.isValid) {
        errors.push({
          id: payment.id,
          name: payment.name,
          errors: validation.errors,
        })
      }
    })
    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [paymentDates, validatePayment])

  return {
    validatePayment,
    validateAll,
  }
}

