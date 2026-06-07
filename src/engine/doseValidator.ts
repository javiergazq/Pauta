// Validador de dosis con fechas (Modo C)
// Fuente: Normas Generales, Guía Calendarios Acelerados ANDAVAC 2026
// ANDAVAC 2026 — actualizar anualmente si cambia el periodo de gracia
import { differenceInDays } from 'date-fns'
import type { DoseValidity } from '../types'

// Periodo de gracia: dosis inactivada hasta 4 días antes del intervalo mínimo → válida
// Dosis administrada 5+ días antes → INVÁLIDA, debe repetirse
// Nota: para vacunas atenuadas NO se aplica periodo de gracia (regla 28 días estricta)
const GRACE_PERIOD_DAYS = 4

export function validateDoses(dates: Date[], intervalDays: number[]): DoseValidity[] {
  if (dates.length === 0) return []

  const result: DoseValidity[] = [{ doseIndex: 0, isValid: true }]

  for (let i = 1; i < dates.length; i++) {
    const minInterval = intervalDays[i - 1]

    // Si no hay intervalo definido para esta posición, la dosis es válida
    if (minInterval === undefined) {
      result.push({ doseIndex: i, isValid: true })
      continue
    }

    const daysBetween = differenceInDays(dates[i], dates[i - 1])
    // El intervalo efectivo mínimo con el periodo de gracia
    const effectiveMin = minInterval - GRACE_PERIOD_DAYS

    if (daysBetween < effectiveMin) {
      result.push({ doseIndex: i, isValid: false, reason: 'too_early' })
    } else {
      result.push({ doseIndex: i, isValid: true })
    }
  }

  return result
}

export function countValidDoses(validities: DoseValidity[]): number {
  return validities.filter(d => d.isValid).length
}
