// Validador de dosis con fechas (Modo C)
// Fuente: Normas Generales, Guía Calendarios Acelerados ANDAVAC 2026
// ANDAVAC 2026 — actualizar anualmente si cambia el periodo de gracia
import { addDays, addMonths, addYears, differenceInDays, isBefore } from 'date-fns'
import type { DoseValidity } from '../types'
import type { VaccineMinimumAge } from '../data/vaccines'

// Periodo de gracia: dosis inactivada hasta 4 días antes del intervalo mínimo → válida
// Dosis administrada 5+ días antes → INVÁLIDA, debe repetirse
// Nota: para vacunas atenuadas NO se aplica periodo de gracia (regla 28 días estricta)
const GRACE_PERIOD_DAYS = 4

interface DoseValidationOptions {
  birthDate?: Date
  minimumAge?: VaccineMinimumAge | null
}

export function validateDoses(
  dates: Date[],
  intervalDays: number[],
  options: DoseValidationOptions = {}
): DoseValidity[] {
  if (dates.length === 0) return []

  const minimumAgeDate = options.birthDate && options.minimumAge
    ? addMinimumAge(options.birthDate, options.minimumAge)
    : null

  const result: DoseValidity[] = dates.map((date, doseIndex) => {
    if (minimumAgeDate && isBefore(date, minimumAgeDate)) {
      return { doseIndex, isValid: false, reason: 'before_min_age' }
    }
    return { doseIndex, isValid: true }
  })

  for (let i = 1; i < dates.length; i++) {
    if (!result[i].isValid) continue

    const minInterval = intervalDays[i - 1]

    // Si no hay intervalo definido para esta posición, la dosis es válida
    if (minInterval === undefined) {
      continue
    }

    const daysBetween = differenceInDays(dates[i], dates[i - 1])
    // El intervalo efectivo mínimo con el periodo de gracia
    const effectiveMin = minInterval - GRACE_PERIOD_DAYS

    if (daysBetween < effectiveMin) {
      result[i] = { doseIndex: i, isValid: false, reason: 'too_early' }
    }
  }

  return result
}

export function countValidDoses(validities: DoseValidity[]): number {
  return validities.filter(d => d.isValid).length
}

function addMinimumAge(birthDate: Date, minimumAge: VaccineMinimumAge): Date {
  if (minimumAge.unit === 'days') return addDays(birthDate, minimumAge.value)
  if (minimumAge.unit === 'months') return addMonths(birthDate, minimumAge.value)
  return addYears(birthDate, minimumAge.value)
}
