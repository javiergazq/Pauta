// Motor de calendarios acelerados — genera el plan de visitas
// Fuente: Tablas 3 y 4, Guía Calendarios Acelerados ANDAVAC 2026 (feb 2026)
import { addDays } from 'date-fns'
import type { AgeGroup, VaccineId, VaccineStatus, VisitPlan, VisitVaccine } from '../types'
import { CATCHUP_SCHEDULES } from '../data/catchupSchedules'
import { getVaccineDef } from '../data/vaccines'

export function generateCatchupPlan(
  statuses: VaccineStatus[],
  ageGroup: AgeGroup,
  evaluationDate: Date
): VisitPlan[] {
  const schedule = CATCHUP_SCHEDULES[ageGroup]

  // Vacunas que aún necesitan dosis
  const needsVaccine = new Set(
    statuses
      .filter(s => s.status === 'missing' || s.status === 'partial')
      .map(s => s.vaccineId)
  )

  // Contador de dosis programadas por vacuna (empieza en las dosis ya válidas)
  const doseCounter = new Map<VaccineId, number>()
  statuses.forEach(s => doseCounter.set(s.vaccineId, s.valid))

  return schedule.map(visitTemplate => {
    const visitVaccines: VisitVaccine[] = []

    for (const vaccineId of visitTemplate.vaccines) {
      if (!needsVaccine.has(vaccineId)) continue

      const status = statuses.find(s => s.vaccineId === vaccineId)
      const scheduledSoFar = doseCounter.get(vaccineId) ?? 0

      // No asignar más dosis de las requeridas
      if (status && scheduledSoFar >= status.required) continue

      const nextDoseNumber = scheduledSoFar + 1
      doseCounter.set(vaccineId, nextDoseNumber)

      const vaccine = getVaccineDef(vaccineId)
      visitVaccines.push({
        vaccineId,
        doseNumber: nextDoseNumber,
        minDate: addDays(evaluationDate, visitTemplate.offsetDays),
        isLive: vaccine.type === 'live',
      })
    }

    // Aviso de co-administración: hay vacunas atenuadas en esta visita
    const liveCount = visitVaccines.filter(v => v.isLive).length
    const hasLiveVaccines = liveCount > 0

    return {
      label: visitTemplate.label,
      offsetDays: visitTemplate.offsetDays,
      vaccines: visitVaccines,
      hasLiveVaccines,
    }
  })
}
