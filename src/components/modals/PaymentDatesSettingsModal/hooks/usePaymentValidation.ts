import { useCallback } from 'react'
import { validatePaymentDate } from '../../../../utils/paymentCalculations'
import type { PaymentDate } from '../../../../types'

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface UsePaymentValidationReturn {
  validatePayment: (payment: PaymentDate, excludeId?: string | null) => ValidationResult
  validateAll: () => { isValid: boolean; errors: Array<{ id: string; name: string; errors: string[] }> }
}

export function usePaymentValidation(paymentDates: PaymentDate[]): UsePaymentValidationReturn {
  const validatePayment = useCallback((payment: PaymentDate, excludeId: string | null = null): ValidationResult => {
    const otherPayments = paymentDates.filter(p => p.id !== excludeId)
    return validatePaymentDate(payment, otherPayments)
  }, [paymentDates])

  const validateAll = useCallback(() => {
    const errors: Array<{ id: string; name: string; errors: string[] }> = []
    paymentDates.forEach(payment => {
      const validation = validatePayment(payment, payment.id)
      if (!validation.isValid) {
        errors.push({ id: payment.id, name: payment.name, errors: validation.errors })
      }
    })
    return { isValid: errors.length === 0, errors }
  }, [paymentDates, validatePayment])

  return { validatePayment, validateAll }
}
