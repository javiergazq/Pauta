// Orquestador principal — punto de entrada único del motor
import type { PatientData, VaccinationInput, VaccinationResult, VaccineStatus, VisitVaccine } from '../types'
import { calculateAge } from './ageCalculator'
import { getRequirements } from './requirementEngine'
import { validateDoses, countValidDoses } from './doseValidator'
import { generateCatchupPlan } from './catchupEngine'
import { getIntervals } from '../data/vaccines'
import { CATCHUP_SCHEDULES } from '../data/catchupSchedules'

export function evaluatePatient(
  patient: PatientData,
  input: VaccinationInput
): VaccinationResult {
  const ageData = calculateAge(patient.birthDate, patient.evaluationDate)
  const requirements = getRequirements(patient)

  const vaccineStatuses: VaccineStatus[] = requirements.map(req => {
    if (!req.applicable) {
      return {
        vaccineId: req.vaccineId,
        required: 0, received: 0, valid: 0, missing: 0,
        status: 'not_applicable',
      }
    }

    if (input.mode === 'count') {
      const entry = input.doseCounts.find(d => d.vaccineId === req.vaccineId)
      const received = entry?.count ?? 0
      const missing = Math.max(0, req.minDoses - received)
      const status = missing === 0 ? 'complete' : received === 0 ? 'missing' : 'partial'
      return {
        vaccineId: req.vaccineId,
        required: req.minDoses, received, valid: received, missing, status,
      }
    }

    // Modo C: validar fechas con intervalos mínimos
    const entry = input.doseDates.find(d => d.vaccineId === req.vaccineId)
    const dates = (entry?.dates.filter(Boolean) ?? []) as Date[]
    const doseValidity = validateDoses(dates, getIntervals(req.vaccineId))
    const valid = countValidDoses(doseValidity)
    const missing = Math.max(0, req.minDoses - valid)
    const status = missing === 0 ? 'complete' : valid === 0 ? 'missing' : 'partial'
    return {
      vaccineId: req.vaccineId,
      required: req.minDoses,
      received: dates.length,
      valid, missing, status, doseValidity,
    }
  })

  const applicable = vaccineStatuses.filter(s => s.status !== 'not_applicable')
  const isUpToDate = applicable.every(s => s.status === 'complete')

  // Si está al día, devolver visitas vacías (estructura consistente para la UI)
  const catchupPlan = isUpToDate
    ? CATCHUP_SCHEDULES[ageData.group].map(v => ({
        ...v,
        vaccines: [] as VisitVaccine[],
        hasLiveVaccines: false,
      }))
    : generateCatchupPlan(vaccineStatuses, ageData.group, patient.evaluationDate)

  return { patientData: patient, ageData, vaccineStatuses, isUpToDate, catchupPlan }
}
