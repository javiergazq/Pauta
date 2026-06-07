import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from 'date-fns'
import type { AgeData, AgeGroup } from '../types'

export function calculateAge(birthDate: Date, evaluationDate: Date): AgeData {
  const days = differenceInDays(evaluationDate, birthDate)
  const weeks = differenceInWeeks(evaluationDate, birthDate)
  const months = differenceInMonths(evaluationDate, birthDate)
  const years = differenceInYears(evaluationDate, birthDate)
  const group = getAgeGroup(months)
  return { days, weeks, months, years, group }
}

// Grupos de edad del calendario acelerado ANDAVAC (v1: solo niños)
// < 84 meses  = menor de 7 años  → under7
// 84-215 meses = 7 a 17 años     → 7to18  (incluye exactamente los 18 años cumplidos)
// ≥ 216 meses = 18+ años         → over18 (v2 futuro)
export function getAgeGroup(ageMonths: number): AgeGroup {
  if (ageMonths < 84) return 'under7'
  return '7to18'
}
