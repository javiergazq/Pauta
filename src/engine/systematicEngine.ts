// Motor de calendario sistemático — capa previa al motor de rescate
// Determina si cada vacuna está al día, toca hoy o lleva un retraso real,
// según las edades de la pauta normal (no los mínimos de rescate).
// Fuente: Guía de Calendarios Acelerados ANDAVAC 2026 (feb 2026)
import { addMonths, addDays } from 'date-fns'
import type {
  AgeGroup,
  PatientData,
  SystematicScheduleEvent,
  SystematicVaccineStatus,
  VaccineStatus,
  VisitPlan,
  VisitVaccine,
} from '../types'
import { SYSTEMATIC_SCHEDULE } from '../data/systematicSchedule'
import { CATCHUP_SCHEDULES } from '../data/catchupSchedules'
import { getVaccineDef, requiresLiveSpacing } from '../data/vaccines'

const SYSTEMATIC_VACCINE_IDS = Array.from(new Set(SYSTEMATIC_SCHEDULE.map(e => e.vaccineId)))

function eventDate(birthDate: Date, event: SystematicScheduleEvent): Date {
  return addMonths(birthDate, event.ageMonths)
}

// Final (exclusivo) de la ventana "toca ahora" de un evento:
//  - transición 2026 (TV/VVZ 2ª dosis, solo durante 2026): hasta cumplir transition2026.dueUntilMonths + 1
//  - dosis "de X años" (graceUnit: 'year'): todo el año en curso → hasta cumplir el año siguiente
//  - resto: gracia plana de 30 días tras la edad sistemática
function dueWindowEnd(birthDate: Date, event: SystematicScheduleEvent, evaluationDate: Date): Date {
  if (event.transition2026 && evaluationDate.getFullYear() === 2026) {
    return addMonths(birthDate, event.transition2026.dueUntilMonths + 1)
  }
  if (event.graceUnit === 'year') {
    return addMonths(birthDate, event.ageMonths + 12)
  }
  return addDays(eventDate(birthDate, event), 30)
}

export function evaluateSystematicStatus(
  patient: PatientData,
  vaccineStatuses: VaccineStatus[]
): SystematicVaccineStatus[] {
  const { birthDate, evaluationDate } = patient

  return SYSTEMATIC_VACCINE_IDS.map((vaccineId): SystematicVaccineStatus => {
    const status = vaccineStatuses.find(s => s.vaccineId === vaccineId)

    if (!status || status.status === 'not_applicable') {
      return { vaccineId, status: 'not_applicable', satisfiedDoses: 0, nextEvent: null, futureEvents: [] }
    }

    const events = SYSTEMATIC_SCHEDULE
      .filter(e => e.vaccineId === vaccineId)
      .sort((a, b) => a.ageMonths - b.ageMonths)

    // Las dosis válidas se emparejan cronológicamente con los eventos sistemáticos
    const satisfiedDoses = Math.min(status.valid, events.length)
    const pending = events.slice(satisfiedDoses)

    if (pending.length === 0) {
      return { vaccineId, status: 'up_to_date', satisfiedDoses, nextEvent: null, futureEvents: [] }
    }

    const [next, ...rest] = pending
    const start = eventDate(birthDate, next)
    const end = dueWindowEnd(birthDate, next, evaluationDate)

    if (evaluationDate < start) {
      return { vaccineId, status: 'up_to_date', satisfiedDoses, nextEvent: next, futureEvents: pending }
    }
    if (evaluationDate < end) {
      return { vaccineId, status: 'due_today', satisfiedDoses, nextEvent: next, futureEvents: rest }
    }
    return { vaccineId, status: 'overdue', satisfiedDoses, nextEvent: next, futureEvents: rest }
  })
}

// Construye el plan de visitas cuando NO hay retraso real: misma forma que
// CATCHUP_SCHEDULES (consistente para la UI), pero con la visita "HOY" rellena
// con las dosis sistemáticas que tocan ahora mismo.
export function buildSystematicTodayPlan(
  statuses: SystematicVaccineStatus[],
  ageGroup: AgeGroup,
  evaluationDate: Date
): VisitPlan[] {
  const todayVaccines: VisitVaccine[] = statuses
    .filter((s): s is SystematicVaccineStatus & { nextEvent: SystematicScheduleEvent } =>
      s.status === 'due_today' && s.nextEvent !== null)
    .map(s => ({
      vaccineId: s.nextEvent.vaccineId,
      doseNumber: s.nextEvent.dose,
      minDate: evaluationDate,
      isLive: getVaccineDef(s.nextEvent.vaccineId).type === 'live',
      source: 'systematic',
    }))

  // Aviso de espaciado de 28 días: solo atenuadas inyectables (TV, varicela), no rotavirus oral.
  const hasLiveVaccines = todayVaccines.some(v => requiresLiveSpacing(v.vaccineId))

  return CATCHUP_SCHEDULES[ageGroup].map(visitTemplate =>
    visitTemplate.label === 'HOY'
      ? { label: visitTemplate.label, offsetDays: visitTemplate.offsetDays, vaccines: todayVaccines, hasLiveVaccines }
      : { label: visitTemplate.label, offsetDays: visitTemplate.offsetDays, vaccines: [], hasLiveVaccines: false }
  )
}
