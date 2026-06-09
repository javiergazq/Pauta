import { describe, it, expect } from 'vitest'
import { evaluateSystematicStatus } from '../../src/engine/systematicEngine'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import type { PatientData, VaccinationInput, VaccineId, VaccineStatus } from '../../src/types'

function makePatient(birthDate: string, evalDate: string): PatientData {
  return { birthDate: new Date(birthDate), sex: 'M', evaluationDate: new Date(evalDate), conditions: [] }
}

// VaccineStatus mínimo y "aplicable" para aislar la vacuna bajo prueba —
// evaluateSystematicStatus solo necesita .valid y que status !== 'not_applicable'
function statusEntry(vaccineId: VaccineId, valid: number): VaccineStatus {
  return { vaccineId, required: valid, received: valid, valid, missing: 0, status: 'complete' }
}

function statusFor(patient: PatientData, vaccineId: VaccineId, valid: number) {
  return evaluateSystematicStatus(patient, [statusEntry(vaccineId, valid)])
    .find(s => s.vaccineId === vaccineId)!
}

const ALL_IDS: VaccineId[] = ['dtpa','hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv']

function zeroCounts(): VaccinationInput {
  return {
    mode: 'count',
    doseCounts: ALL_IDS.map(id => ({ vaccineId: id, count: 0 })),
    doseDates: [],
  }
}

describe('evaluateSystematicStatus — los 8 escenarios del documento de diseño', () => {
  it('1. DTPa a los 5 meses con 2 dosis → al día, próxima a los 11 meses (sin rescate)', () => {
    const patient = makePatient('2026-01-01', '2026-06-01') // 5 meses
    const s = statusFor(patient, 'dtpa', 2)
    expect(s.status).toBe('up_to_date')
    expect(s.nextEvent?.ageMonths).toBe(11)
    expect(s.nextEvent?.dose).toBe(3)
  })

  it('2. Neumococo a los 10 meses con 3 dosis → al día, próxima a los 11 meses (no "completo" definitivo)', () => {
    const patient = makePatient('2025-08-01', '2026-06-01') // 10 meses
    const s = statusFor(patient, 'pneumo', 3)
    expect(s.status).toBe('up_to_date')
    expect(s.nextEvent?.ageMonths).toBe(11)
    expect(s.nextEvent?.dose).toBe(4)
  })

  it('3. MenACWY a los 6 meses sin dosis → retrasada (la de los 4 meses ya debería estar puesta)', () => {
    const patient = makePatient('2025-12-01', '2026-06-01') // 6 meses
    const s = statusFor(patient, 'menacwy', 0)
    expect(s.status).toBe('overdue')
    expect(s.nextEvent?.ageMonths).toBe(4)
  })

  it('4. MenACWY a los 10 meses con 1 dosis → al día, próxima a los 12 meses (sin rescate)', () => {
    const patient = makePatient('2025-08-01', '2026-06-01') // 10 meses
    const s = statusFor(patient, 'menacwy', 1)
    expect(s.status).toBe('up_to_date')
    expect(s.nextEvent?.ageMonths).toBe(12)
    expect(s.nextEvent?.dose).toBe(2)
  })

  it('5. Triple vírica a los 18 meses con 1 dosis → al día, próxima a los 2 años', () => {
    const patient = makePatient('2024-12-01', '2026-06-01') // 18 meses
    const s = statusFor(patient, 'mmr', 1)
    expect(s.status).toBe('up_to_date')
    expect(s.nextEvent?.ageMonths).toBe(24)
    expect(s.nextEvent?.dose).toBe(2)
  })

  it('6. Triple vírica a los 30 meses con 1 dosis → pendiente/toca hoy (dentro del año en curso de la 2ª dosis)', () => {
    const patient = makePatient('2023-12-01', '2026-06-01') // 30 meses
    const s = statusFor(patient, 'mmr', 1)
    expect(s.status).toBe('due_today')
    expect(s.nextEvent?.ageMonths).toBe(24)
    expect(s.nextEvent?.dose).toBe(2)
  })

  it('7. Varicela a los 20 meses con 1 dosis → al día, próxima a los 2 años', () => {
    const patient = makePatient('2024-10-01', '2026-06-01') // 20 meses
    const s = statusFor(patient, 'varicella', 1)
    expect(s.status).toBe('up_to_date')
    expect(s.nextEvent?.ageMonths).toBe(24)
    expect(s.nextEvent?.dose).toBe(2)
  })

  it('8. Varicela a los 30 meses con 1 dosis → pendiente/toca hoy (dentro del año en curso de la 2ª dosis)', () => {
    const patient = makePatient('2023-12-01', '2026-06-01') // 30 meses
    const s = statusFor(patient, 'varicella', 1)
    expect(s.status).toBe('due_today')
    expect(s.nextEvent?.ageMonths).toBe(24)
    expect(s.nextEvent?.dose).toBe(2)
  })
})

describe('evaluateSystematicStatus — márgenes de gracia (casos límite)', () => {
  it('gracia de 30 días: 29 días tarde → toca hoy; 30 días tarde → retrasada', () => {
    // DTPa 1ª dosis a los 2 meses → fecha del evento: 2026-03-01; ventana: [2026-03-01, 2026-03-31)
    const dueToday = makePatient('2026-01-01', '2026-03-30')   // 29 días después del evento
    const overdue  = makePatient('2026-01-01', '2026-03-31')   // 30 días después del evento
    expect(statusFor(dueToday, 'dtpa', 0).status).toBe('due_today')
    expect(statusFor(overdue, 'dtpa', 0).status).toBe('overdue')
  })

  it('dosis "de años" (graceUnit year): dentro del año en curso → toca hoy; al cumplir el año siguiente → retrasada', () => {
    // MenACWY 3ª dosis a los 144 meses (12 años) → evento: 2026-06-01; ventana: [2026-06-01, 2027-06-01)
    const dueToday = makePatient('2014-06-01', '2027-05-31')   // todavía con 12 años
    const overdue  = makePatient('2014-06-01', '2027-06-01')   // ya cumplió 13 años
    expect(statusFor(dueToday, 'menacwy', 2).status).toBe('due_today')
    expect(statusFor(overdue, 'menacwy', 2).status).toBe('overdue')
  })

  it('transición 2026 (TV/VVZ 2ª dosis): 47 meses → toca hoy; 48 meses → retrasada', () => {
    // 2ª dosis a los 24 meses; durante 2026 la ventana llega hasta cumplir 48 meses
    const dueToday = makePatient('2022-07-01', '2026-06-01')   // 47 meses
    const overdue  = makePatient('2022-07-01', '2026-07-01')   // 48 meses
    expect(statusFor(dueToday, 'mmr', 1).status).toBe('due_today')
    expect(statusFor(overdue, 'mmr', 1).status).toBe('overdue')
    expect(statusFor(dueToday, 'varicella', 1).status).toBe('due_today')
    expect(statusFor(overdue, 'varicella', 1).status).toBe('overdue')
  })
})

describe('evaluatePatient — integración de la capa sistemática (gating del rescate)', () => {
  it('al día pero con dosis sistemáticas que tocan hoy → no activa el rescate; aparecen en HOY con source "systematic"', () => {
    const patient = makePatient('2026-04-01', '2026-06-05') // ~2 meses, recién llegando a la visita de los 2 meses
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.isUpToDate).toBe(true)
    expect(result.hasDueToday).toBe(true)
    const today = result.catchupPlan.find(p => p.label === 'HOY')!
    expect(today.vaccines.length).toBeGreaterThan(0)
    expect(today.vaccines.every(v => v.source === 'systematic')).toBe(true)
  })

  it('retraso real → activa el motor de rescate; las dosis de HOY tienen source "catchup"', () => {
    const patient = makePatient('2024-01-15', '2026-01-15') // 2 años, sin ninguna vacuna
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.isUpToDate).toBe(false)
    const today = result.catchupPlan.find(p => p.label === 'HOY')!
    expect(today.vaccines.length).toBeGreaterThan(0)
    expect(today.vaccines.every(v => v.source === 'catchup')).toBe(true)
  })
})
