// Orquestador principal — punto de entrada único del motor
import { addDays } from 'date-fns'
import type { PatientData, VaccinationInput, VaccinationResult, VaccineCaution, VaccineStatus, VisitPlan, VisitVaccine } from '../types'
import { calculateAge } from './ageCalculator'
import { getRequirements, evaluateRotavirusGuidance } from './requirementEngine'
import { validateDoses, countValidDoses } from './doseValidator'
import { generateCatchupPlan } from './catchupEngine'
import { evaluateSystematicStatus, buildSystematicTodayPlan } from './systematicEngine'
import { getIntervals, requiresLiveSpacing } from '../data/vaccines'
import { getConditionWarnings } from '../data/conditionRules'

export function evaluatePatient(
  patient: PatientData,
  input: VaccinationInput
): VaccinationResult {
  const ageData = calculateAge(patient.birthDate, patient.evaluationDate)
  const requirements = getRequirements(patient)
  const conditionCautions = getConditionWarnings(patient.conditions)
  let usedCountOnly = false

  const extraRecordedVaccines: VaccineCaution[] = []
  const baseVaccineStatuses: VaccineStatus[] = requirements.map(req => {
    if (!req.applicable) {
      const countEntry = input.doseCounts.find(d => d.vaccineId === req.vaccineId)
      const dateEntry = input.doseDates.find(d => d.vaccineId === req.vaccineId)
      const received = input.mode === 'dates'
        ? (dateEntry?.dates.filter(Boolean).length ?? countEntry?.count ?? 0)
        : countEntry?.count ?? 0
      if (received > 0) {
        extraRecordedVaccines.push({
          vaccineId: req.vaccineId,
          message: `${received} dosis registrada${received > 1 ? 's' : ''} aunque no corresponde al calendario actual por edad/condición. No se usa para recomendar administración automática; revisar fecha, edad de administración y validez documental.`,
        })
      }
      return {
        vaccineId: req.vaccineId,
        required: 0, received, valid: 0, missing: 0,
        status: 'not_applicable',
      }
    }

    const entryWithDates = input.doseDates.find(d => d.vaccineId === req.vaccineId)
    const dates = (entryWithDates?.dates.filter(Boolean) ?? []) as Date[]
    const hasDatesForVaccine = dates.length > 0

    if (input.mode === 'count' || !hasDatesForVaccine) {
      usedCountOnly = true
      const entry = input.doseCounts.find(d => d.vaccineId === req.vaccineId)
      const received = entry?.count ?? 0
      const missing = Math.max(0, req.minDoses - received)
      const status = missing === 0 ? 'complete' : received === 0 ? 'missing' : 'partial'
      return {
        vaccineId: req.vaccineId,
        required: req.minDoses, received, valid: received, missing, status,
      }
    }

    // Modo fechas por vacuna: si esta vacuna tiene fechas, se validan intervalos.
    // Las vacunas sin fechas conservan su recuento para mantener el flujo rápido de clicks.
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

  const vaccineStatuses: VaccineStatus[] = patient.conditions.includes('varicella_history')
    ? baseVaccineStatuses.map(status =>
        status.vaccineId === 'varicella'
          ? { ...status, required: 0, missing: 0, status: 'not_applicable' as const }
          : status
      )
    : baseVaccineStatuses

  // Capa de calendario sistemático: decide PRIMERO si hay un retraso real.
  // El motor de rescate (generateCatchupPlan) solo se activa si lo hay —
  // evita confundir "toca ahora según la pauta normal" con "va con retraso".
  const rawSystematicStatuses = evaluateSystematicStatus(patient, vaccineStatuses)

  // Corrección de iniciadores tardíos: si el motor de rescate ya considera
  // cubierto el mínimo ajustado por edad (status 'complete') pero el calendario
  // sistemático lo marca 'overdue' persiguiendo eventos anteriores al inicio
  // real de la pauta — p.ej. Hib con 1 dosis a los 24 meses persiguiendo el
  // evento de los 4 meses —, se corrige a 'up_to_date'. Solo afecta a 'overdue'
  // (los 'due_today' ya señalan un evento genuinamente activo).
  const systematicStatuses = rawSystematicStatuses.map(sys => {
    if (sys.status !== 'overdue') return sys
    const vs = vaccineStatuses.find(s => s.vaccineId === sys.vaccineId)
    if (!vs || vs.status !== 'complete') return sys
    return { ...sys, status: 'up_to_date' as const, nextEvent: null, futureEvents: [] }
  })
  const hasOverdue = systematicStatuses.some(s => s.status === 'overdue')
  const hasDueToday = systematicStatuses.some(s => s.status === 'due_today')
  const isUpToDate = !hasOverdue

  const rawPlan = hasOverdue
    ? generateCatchupPlan(vaccineStatuses, ageData.group, patient.evaluationDate)
    : buildSystematicTodayPlan(systematicStatuses, ageData.group, patient.evaluationDate)

  // Rotavirus no se trata como rescate normal: si la ventana (inicio ≤20 sem,
  // pauta completa ≤24 sem) no se puede asegurar, se retira del plan recomendado
  // y se deja un aviso específico para que decida el sanitario con el dato exacto.
  const rotaStatus = vaccineStatuses.find(s => s.vaccineId === 'rotavirus')
  let rotavirusCaution: string | null = null
  if (rotaStatus && rotaStatus.status !== 'not_applicable') {
    const firstDoseDate = input.mode === 'dates'
      ? input.doseDates.find(d => d.vaccineId === 'rotavirus')?.dates.find((d): d is Date => d !== null) ?? null
      : null
    const guidance = evaluateRotavirusGuidance(ageData.weeks, rotaStatus.valid, firstDoseDate, patient.evaluationDate)
    if (!guidance.recommend) rotavirusCaution = guidance.caution ?? null
  }

  const vaccineCautions: VaccineCaution[] = [...extraRecordedVaccines]
  const pneumoStatus = vaccineStatuses.find(s => s.vaccineId === 'pneumo')
  const pneumoDates = input.doseDates.find(d => d.vaccineId === 'pneumo')?.dates.filter(Boolean) ?? []
  if (
    ageData.months >= 24 &&
    ageData.months < 60 &&
    pneumoStatus?.valid === 1 &&
    pneumoDates.length === 0
  ) {
    vaccineCautions.push({
      vaccineId: 'pneumo',
      message: 'Confirmar fecha o edad de administración de la dosis previa. En 24-59 meses, una dosis puede ser suficiente si fue administrada a partir de los 24 meses; si fue anterior, puede requerir revisión.',
    })
  }

  // Filtro de reconciliación: el plan solo incluye vacunas que el calendario
  // sistemático marca como overdue o due_today — evita que el motor de rescate
  // contradiga el grid mostrando vacunas "al día". Incluye también el filtro
  // específico de rotavirus (ventana límite). Se recalcula hasLiveVaccines tras
  // el filtrado para que el aviso de 28 días solo aparezca si corresponde.
  const systematicById = new Map(systematicStatuses.map(s => [s.vaccineId, s.status]))
  const catchupPlan = rawPlan.map(visit => {
    const vaccines = visit.vaccines.filter(v => {
      const st = systematicById.get(v.vaccineId)
      if (st !== 'overdue' && st !== 'due_today') return false
      if (rotavirusCaution && v.vaccineId === 'rotavirus') return false
      return true
    })
    return { ...visit, vaccines, hasLiveVaccines: vaccines.some(v => requiresLiveSpacing(v.vaccineId)) }
  })
  const reconciledCatchupPlan = reconcileMenBUnder24Start(
    catchupPlan,
    vaccineStatuses,
    ageData.months,
    hasOverdue,
    patient.evaluationDate
  )

  return {
    patientData: patient,
    ageData,
    vaccineStatuses,
    isUpToDate,
    hasDueToday,
    systematicStatuses,
    catchupPlan: reconciledCatchupPlan,
    rotavirusCaution,
    vaccineCautions,
    conditionCautions,
    countMode: usedCountOnly,
  }
}

function reconcileMenBUnder24Start(
  plan: VisitPlan[],
  statuses: VaccineStatus[],
  ageMonths: number,
  hasOverdue: boolean,
  evaluationDate: Date
): VisitPlan[] {
  const menb = statuses.find(s => s.vaccineId === 'menb')
  const menbIsAlreadyPlanned = plan.some(visit => visit.vaccines.some(v => v.vaccineId === 'menb'))
  if (!hasOverdue || ageMonths >= 24 || !menbIsAlreadyPlanned || !menb || menb.status === 'complete' || menb.status === 'not_applicable') {
    return plan
  }

  let nextDose = menb.valid + 1
  const menbVisits: Record<string, VisitVaccine[]> = {}
  if (nextDose <= menb.required) {
    menbVisits.HOY = [buildMenBVisitVaccine(nextDose, evaluationDate, plan.find(p => p.label === 'HOY')?.offsetDays ?? 0)]
    nextDose += 1
  }
  if (nextDose <= menb.required) {
    menbVisits['+2 meses'] = [buildMenBVisitVaccine(nextDose, evaluationDate, plan.find(p => p.label === '+2 meses')?.offsetDays ?? 60)]
    nextDose += 1
  }
  if (nextDose <= menb.required) {
    const boosterLabel = ageMonths < 12 ? '+8 meses' : '+14 meses'
    const boosterOffset = ageMonths < 12
      ? plan.find(p => p.label === '+8 meses')?.offsetDays ?? 240
      : 420
    menbVisits[boosterLabel] = [buildMenBVisitVaccine(nextDose, evaluationDate, boosterOffset)]
  }

  const planWithMenBVisits = Object.keys(menbVisits).reduce((visits, label) => {
    if (visits.some(visit => visit.label === label)) return visits
    const vaccine = menbVisits[label][0]
    return [
      ...visits,
      {
        label,
        offsetDays: Math.round((vaccine.minDate.getTime() - evaluationDate.getTime()) / 86400000),
        vaccines: [],
        hasLiveVaccines: false,
      },
    ]
  }, plan)

  return planWithMenBVisits.map(visit => {
    const withoutMenB = visit.vaccines.filter(v => v.vaccineId !== 'menb')
    const vaccines = [...withoutMenB, ...(menbVisits[visit.label] ?? [])]
      .sort((a, b) => a.doseNumber - b.doseNumber)
    return {
      ...visit,
      vaccines,
      hasLiveVaccines: vaccines.some(v => requiresLiveSpacing(v.vaccineId)),
    }
  })
}

function buildMenBVisitVaccine(doseNumber: number, evaluationDate: Date, offsetDays: number): VisitVaccine {
  return {
    vaccineId: 'menb',
    doseNumber,
    minDate: addDays(evaluationDate, offsetDays),
    isLive: false,
    source: 'catchup',
  }
}
