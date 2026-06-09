import { describe, it, expect } from 'vitest'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import type { PatientData, VaccinationInput, VaccineId } from '../../src/types'

function makePatient(birthDate: string, evalDate: string, sex: 'M' | 'F' = 'M'): PatientData {
  return { birthDate: new Date(birthDate), sex, evaluationDate: new Date(evalDate), conditions: [] }
}

function zeroCounts(): VaccinationInput {
  const ids: VaccineId[] = ['dtpa','hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv']
  return {
    mode: 'count',
    doseCounts: ids.map(id => ({ vaccineId: id, count: 0 })),
    doseDates: [],
  }
}

describe('evaluatePatient — Modo B (conteo)', () => {
  it('niño de 5 años bien vacunado → isUpToDate = true', () => {
    const patient = makePatient('2020-01-15', '2025-06-15')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 4 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 4 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 2 },
        { vaccineId: 'menacwy',   count: 2 },
        { vaccineId: 'mmr',       count: 2 },
        { vaccineId: 'varicella', count: 2 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    expect(result.isUpToDate).toBe(true)
    expect(result.catchupPlan.every(p => p.vaccines.length === 0)).toBe(true)
  })

  it('niño de 2 años sin ninguna vacuna → isUpToDate = false, HOY tiene muchas vacunas', () => {
    const patient = makePatient('2023-01-15', '2025-01-15')
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.isUpToDate).toBe(false)
    const today = result.catchupPlan.find(p => p.label === 'HOY')!
    expect(today.vaccines.length).toBeGreaterThan(3)
  })

  it('VaccineStatus refleja missing count correctamente', () => {
    const patient = makePatient('2020-01-15', '2025-06-15') // 5 años, necesita 4 DTPa
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa', count: 2 }, // tiene 2, necesita 4 → faltan 2
        ...(['hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv'] satisfies VaccineId[])
          .map(id => ({ vaccineId: id, count: 99 })),
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const dtpa = result.vaccineStatuses.find(s => s.vaccineId === 'dtpa')!
    expect(dtpa.missing).toBe(2)
    expect(dtpa.status).toBe('partial')
  })

  it('ageData incluida en el resultado', () => {
    const patient = makePatient('2022-01-15', '2025-01-15') // 3 años
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.ageData.years).toBe(3)
    expect(result.ageData.group).toBe('under7')
  })
})

describe('evaluatePatient — rotavirus: ventana límite (no se trata como rescate normal)', () => {
  it('16 semanas y 0 dosis → dentro de ventana segura: RV aparece con normalidad, sin aviso', () => {
    const patient = makePatient('2026-02-09', '2026-06-01') // exactamente 16 semanas
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.rotavirusCaution).toBeNull()
    const today = result.catchupPlan.find(p => p.label === 'HOY')!
    expect(today.vaccines.some(v => v.vaccineId === 'rotavirus')).toBe(true)
  })

  it('22 semanas y 0 dosis → ventana al límite: RV se retira del plan y aparece el aviso específico', () => {
    const patient = makePatient('2025-12-29', '2026-06-01') // exactamente 22 semanas
    const result = evaluatePatient(patient, zeroCounts())
    expect(result.rotavirusCaution).toMatch(/Rotavirus/)
    expect(result.catchupPlan.every(p => p.vaccines.every(v => v.vaccineId !== 'rotavirus'))).toBe(true)
  })
})

describe('evaluatePatient — Hallazgo A: plan no repite vacunas que el grid marca al día', () => {
  // 5 meses, DTPa/HepB/Polio/Hib con 2 dosis cada una (partial según rescate, pero
  // up_to_date según calendario sistemático — próxima dosis a los 11 meses).
  // Otras vacunas a 0 (menacwy, pneumo overdue) para que el motor de rescate se active.
  it('DTPa/HepB/Polio/Hib al día en el grid → no aparecen en ninguna visita del plan', () => {
    const patient = makePatient('2026-01-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 2 },
        { vaccineId: 'hepb',      count: 2 },
        { vaccineId: 'polio',     count: 2 },
        { vaccineId: 'hib',       count: 2 },
        { vaccineId: 'pneumo',    count: 0 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 0 },
        { vaccineId: 'mmr',       count: 0 },
        { vaccineId: 'varicella', count: 0 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const hibSys = result.systematicStatuses.find(s => s.vaccineId === 'hib')!
    expect(hibSys.status).toBe('up_to_date')
    const dtpaSys = result.systematicStatuses.find(s => s.vaccineId === 'dtpa')!
    expect(dtpaSys.status).toBe('up_to_date')
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))
    expect(allPlanVaccines).not.toContain('dtpa')
    expect(allPlanVaccines).not.toContain('hepb')
    expect(allPlanVaccines).not.toContain('polio')
    expect(allPlanVaccines).not.toContain('hib')
  })
})

describe('evaluatePatient — Hallazgo B: Hib con 1 dosis a los 24 meses no es overdue', () => {
  it('24 meses / Hib 1 dosis → up_to_date (no overdue, no limbo)', () => {
    const patient = makePatient('2024-06-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 0 },
        { vaccineId: 'hepb',      count: 0 },
        { vaccineId: 'polio',     count: 0 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 0 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 0 },
        { vaccineId: 'mmr',       count: 0 },
        { vaccineId: 'varicella', count: 0 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const hibSys = result.systematicStatuses.find(s => s.vaccineId === 'hib')!
    expect(hibSys.status).not.toBe('overdue')
    expect(hibSys.status).toBe('up_to_date')
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))
    expect(allPlanVaccines).not.toContain('hib')
  })
})

describe('evaluatePatient — Hallazgo C: VNC20 con 1 dosis a los 24 meses no es overdue', () => {
  it('24 meses / VNC20 1 dosis → up_to_date, no aparece en el plan como retrasada', () => {
    const patient = makePatient('2024-06-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 0 },
        { vaccineId: 'hepb',      count: 0 },
        { vaccineId: 'polio',     count: 0 },
        { vaccineId: 'hib',       count: 0 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 0 },
        { vaccineId: 'mmr',       count: 0 },
        { vaccineId: 'varicella', count: 0 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const pneumoSys = result.systematicStatuses.find(s => s.vaccineId === 'pneumo')!
    expect(pneumoSys.status).not.toBe('overdue')
    expect(pneumoSys.status).toBe('up_to_date')
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))
    expect(allPlanVaccines).not.toContain('pneumo')
  })
})

describe('evaluatePatient — Hallazgo D: MenB programa 2ª dosis para rescate ≥24 meses', () => {
  it('3 años / MenB 0 dosis (nacido tras 01/10/2021) → 1ª dosis hoy y 2ª en +1 mes', () => {
    // Todos los demás antígenos completos para que solo MenB genere el rescate
    const patient = makePatient('2023-06-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 4 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 4 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 1 },
        { vaccineId: 'mmr',       count: 2 },
        { vaccineId: 'varicella', count: 2 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const todayMenB = result.catchupPlan.find(p => p.label === 'HOY')!.vaccines.find(v => v.vaccineId === 'menb')
    expect(todayMenB?.doseNumber).toBe(1)
    const plusOneMenB = result.catchupPlan.find(p => p.label === '+1 mes')!.vaccines.find(v => v.vaccineId === 'menb')
    expect(plusOneMenB?.doseNumber).toBe(2)
  })
})

describe('evaluatePatient — Hallazgo E: VVZ due_today a los 37 meses con 1 dosis (regresión)', () => {
  it('3 años 1 mes / VVZ 1 dosis → due_today, aparece en Administrar hoy', () => {
    const patient = makePatient('2023-05-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 4 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 4 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 2 },
        { vaccineId: 'menacwy',   count: 1 },
        { vaccineId: 'mmr',       count: 2 },
        { vaccineId: 'varicella', count: 1 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }
    const result = evaluatePatient(patient, input)
    const varSys = result.systematicStatuses.find(s => s.vaccineId === 'varicella')!
    expect(varSys.status).toBe('due_today')
    const today = result.catchupPlan.find(p => p.label === 'HOY')!
    expect(today.vaccines.some(v => v.vaccineId === 'varicella')).toBe(true)
  })
})

describe('evaluatePatient — Modo C (fechas)', () => {
  it('usa fechas por vacuna sin ignorar los recuentos del resto', () => {
    const patient = makePatient('2021-06-08', '2026-06-08') // 5 años
    const input: VaccinationInput = {
      mode: 'dates',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 4 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 4 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 2 },
        { vaccineId: 'menacwy',   count: 2 },
        { vaccineId: 'mmr',       count: 2 },
        { vaccineId: 'varicella', count: 2 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [
        {
          vaccineId: 'dtpa',
          dates: [
            new Date('2021-08-08'),
            new Date('2021-10-08'),
            new Date('2022-05-08'),
            new Date('2025-06-08'),
          ],
        },
      ],
    }

    const result = evaluatePatient(patient, input)

    expect(result.isUpToDate).toBe(true)
    expect(result.systematicStatuses.find(s => s.vaccineId === 'dtpa')?.status).toBe('up_to_date')
    expect(result.systematicStatuses.find(s => s.vaccineId === 'hepb')?.status).toBe('up_to_date')
    expect(result.countMode).toBe(true)
  })

  it('avisa en VNC20 24-59 meses con una dosis por recuento y fecha desconocida', () => {
    const patient = makePatient('2024-06-08', '2026-06-08') // 24 meses
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 4 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 4 },
        { vaccineId: 'hib',       count: 1 },
        { vaccineId: 'pneumo',    count: 1 },
        { vaccineId: 'menb',      count: 2 },
        { vaccineId: 'menacwy',   count: 1 },
        { vaccineId: 'mmr',       count: 2 },
        { vaccineId: 'varicella', count: 2 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [],
    }

    const result = evaluatePatient(patient, input)
    const caution = result.vaccineCautions.find(c => c.vaccineId === 'pneumo')

    expect(caution?.message).toMatch(/fecha/)
    expect(caution?.message).toMatch(/24-59 meses/)
    expect(result.systematicStatuses.find(s => s.vaccineId === 'pneumo')?.status).toBe('up_to_date')
  })

  it('detecta dosis inválida por intervalo insuficiente', () => {
    const patient = makePatient('2024-01-15', '2025-06-15') // 17 meses
    const input: VaccinationInput = {
      mode: 'dates',
      doseCounts: [],
      doseDates: [
        {
          vaccineId: 'dtpa',
          dates: [
            new Date('2024-03-15'),  // 1ª dosis
            new Date('2024-04-01'),  // 2ª: 17 días después → inválida (mínimo 42, gracia 38)
            null,
          ],
        },
        ...(['hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv'] satisfies VaccineId[])
          .map(id => ({ vaccineId: id, dates: [] })),
      ],
    }
    const result = evaluatePatient(patient, input)
    const dtpa = result.vaccineStatuses.find(s => s.vaccineId === 'dtpa')!
    expect(dtpa.doseValidity).toBeDefined()
    expect(dtpa.doseValidity![1].isValid).toBe(false)
    expect(dtpa.valid).toBe(1)   // solo la 1ª cuenta
    expect(dtpa.missing).toBe(2) // faltan 2 de las 3 necesarias
  })
})
