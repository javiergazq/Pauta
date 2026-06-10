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

describe('evaluatePatient - detalles documentales de vacunas importadas', () => {
  it('no contabiliza polio documentada exclusivamente como VPO bivalente posterior a abril de 2016', () => {
    const patient = makePatient('2021-06-08', '2026-06-08')
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
      documentationDetails: [
        { vaccineId: 'polio', polioType: 'exclusive_bivalent_opv_after_2016' },
      ],
    }

    const result = evaluatePatient(patient, input)
    const polio = result.vaccineStatuses.find(s => s.vaccineId === 'polio')!
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))

    expect(polio.received).toBe(4)
    expect(polio.valid).toBe(0)
    expect(polio.status).toBe('missing')
    expect(result.systematicStatuses.find(s => s.vaccineId === 'polio')?.status).toBe('overdue')
    expect(allPlanVaccines).toContain('polio')
    expect(result.vaccineCautions.find(c => c.vaccineId === 'polio')?.message).toMatch(/VPO bivalente/)
    expect(result.vaccineCautions.find(c => c.vaccineId === 'polio')?.message).toMatch(/VPI/)
  })

  it('mantiene polio al dia si la documentacion indica VPI, VPO trivalente o pauta mixta', () => {
    const patient = makePatient('2021-06-08', '2026-06-08')
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
      documentationDetails: [
        { vaccineId: 'polio', polioType: 'standard_ipv_or_trivalent' },
      ],
    }

    const result = evaluatePatient(patient, input)
    const polio = result.vaccineStatuses.find(s => s.vaccineId === 'polio')!
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))

    expect(polio.valid).toBe(4)
    expect(result.systematicStatuses.find(s => s.vaccineId === 'polio')?.status).toBe('up_to_date')
    expect(allPlanVaccines).not.toContain('polio')
    expect(result.vaccineCautions.find(c => c.vaccineId === 'polio')).toBeUndefined()
  })

  it('no contabiliza sarampion/rubeola sin parotiditis como triple virica completa', () => {
    const patient = makePatient('2024-01-15', '2026-07-15')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 3 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 3 },
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
      documentationDetails: [
        { vaccineId: 'mmr', mmrType: 'measles_rubella_only' },
      ],
    }

    const result = evaluatePatient(patient, input)
    const mmr = result.vaccineStatuses.find(s => s.vaccineId === 'mmr')!
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))

    expect(mmr.received).toBe(2)
    expect(mmr.valid).toBe(0)
    expect(mmr.status).toBe('missing')
    expect(allPlanVaccines).toContain('mmr')
    expect(result.vaccineCautions.find(c => c.vaccineId === 'mmr')?.message).toMatch(/parotiditis/)
    expect(result.vaccineCautions.find(c => c.vaccineId === 'mmr')?.message).toMatch(/triple vírica completa/)
  })

  it('mantiene TV completa si la documentacion indica triple virica', () => {
    const patient = makePatient('2024-01-15', '2026-07-15')
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 3 },
        { vaccineId: 'hepb',      count: 3 },
        { vaccineId: 'polio',     count: 3 },
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
      documentationDetails: [
        { vaccineId: 'mmr', mmrType: 'complete_mmr' },
      ],
    }

    const result = evaluatePatient(patient, input)
    const mmr = result.vaccineStatuses.find(s => s.vaccineId === 'mmr')!
    const allPlanVaccines = result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))

    expect(mmr.valid).toBe(2)
    expect(result.systematicStatuses.find(s => s.vaccineId === 'mmr')?.status).toBe('up_to_date')
    expect(allPlanVaccines).not.toContain('mmr')
    expect(result.vaccineCautions.find(c => c.vaccineId === 'mmr')).toBeUndefined()
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
  it('no cuenta una primera dosis de TV administrada antes de los 11 meses', () => {
    const patient = makePatient('2024-01-15', '2026-07-15') // 30 meses
    const input: VaccinationInput = {
      mode: 'dates',
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
      doseDates: [
        {
          vaccineId: 'mmr',
          dates: [
            new Date('2024-09-15'), // 8 meses: no debe contar como TV válida
            new Date('2026-01-15'), // 24 meses: cuenta como 1ª válida
          ],
        },
      ],
    }

    const result = evaluatePatient(patient, input)
    const mmr = result.vaccineStatuses.find(s => s.vaccineId === 'mmr')!

    expect(mmr.valid).toBe(1)
    expect(mmr.missing).toBe(1)
    expect(mmr.status).toBe('partial')
    expect(mmr.doseValidity?.[0]).toMatchObject({ isValid: false, reason: 'before_min_age' })
    expect(result.vaccineCautions.find(c => c.vaccineId === 'mmr')?.message).toMatch(/edad mínima/)
    expect(result.vaccineCautions.find(c => c.vaccineId === 'mmr')?.message).toMatch(/11 meses/)
    expect(result.systematicStatuses.find(s => s.vaccineId === 'mmr')?.status).toBe('due_today')
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines.some(v => v.vaccineId === 'mmr')).toBe(true)
  })

  it('no cuenta varicela administrada antes de los 12 meses y muestra aviso', () => {
    const patient = makePatient('2024-01-15', '2026-07-15') // 30 meses
    const input: VaccinationInput = {
      mode: 'dates',
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
      doseDates: [
        {
          vaccineId: 'varicella',
          dates: [
            new Date('2024-12-15'), // 11 meses: no debe contar como VVZ válida
            new Date('2026-01-15'),
          ],
        },
      ],
    }

    const result = evaluatePatient(patient, input)
    const varicella = result.vaccineStatuses.find(s => s.vaccineId === 'varicella')!

    expect(varicella.valid).toBe(1)
    expect(varicella.missing).toBe(1)
    expect(varicella.doseValidity?.[0]).toMatchObject({ isValid: false, reason: 'before_min_age' })
    expect(result.vaccineCautions.find(c => c.vaccineId === 'varicella')?.message).toMatch(/12 meses/)
  })

  it('hereda la reconciliación principal: 5 meses con 2 hexavalentes fechadas no administra 3ª hoy', () => {
    const patient = makePatient('2026-01-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'dates',
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
      doseDates: [
        ...(['dtpa', 'hepb', 'polio', 'hib'] satisfies VaccineId[]).map(vaccineId => ({
          vaccineId,
          dates: [new Date('2026-03-08'), new Date('2026-05-08')],
        })),
      ],
    }

    const result = evaluatePatient(patient, input)
    const today = result.catchupPlan.find(p => p.label === 'HOY')?.vaccines.map(v => v.vaccineId) ?? []

    for (const id of ['dtpa', 'hepb', 'polio', 'hib'] satisfies VaccineId[]) {
      expect(result.systematicStatuses.find(s => s.vaccineId === id)?.status).toBe('up_to_date')
      expect(today).not.toContain(id)
    }
    expect(today).toEqual(expect.arrayContaining(['pneumo', 'menacwy', 'menb']))
  })

  it('hereda el ajuste MenB en modo fechas: inicio a 7 meses programa 2ª a +2 meses', () => {
    const patient = makePatient('2025-11-08', '2026-06-08')
    const input: VaccinationInput = {
      mode: 'dates',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 1 },
        { vaccineId: 'hepb',      count: 1 },
        { vaccineId: 'polio',     count: 1 },
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
      doseDates: [
        ...(['dtpa', 'hepb', 'polio', 'hib'] satisfies VaccineId[]).map(vaccineId => ({
          vaccineId,
          dates: [new Date('2026-01-08')],
        })),
      ],
    }

    const result = evaluatePatient(patient, input)

    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 1 })]))
    expect(result.catchupPlan.find(p => p.label === '+1 mes')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb' })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 2 })]))
  })

  it('mantiene vacunas no aplicables registradas por recuento aunque otra vacuna use fechas', () => {
    const patient = makePatient('2026-01-08', '2026-06-08') // 5 meses: varicela no aplicable
    const input: VaccinationInput = {
      mode: 'dates',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 2 },
        { vaccineId: 'hepb',      count: 2 },
        { vaccineId: 'polio',     count: 2 },
        { vaccineId: 'hib',       count: 2 },
        { vaccineId: 'pneumo',    count: 0 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 0 },
        { vaccineId: 'mmr',       count: 0 },
        { vaccineId: 'varicella', count: 1 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [
        { vaccineId: 'dtpa', dates: [new Date('2026-03-08'), new Date('2026-05-08')] },
        { vaccineId: 'varicella', dates: [] },
      ],
    }

    const result = evaluatePatient(patient, input)
    const varicella = result.vaccineStatuses.find(s => s.vaccineId === 'varicella')!

    expect(varicella.status).toBe('not_applicable')
    expect(varicella.received).toBe(1)
    expect(result.vaccineCautions.find(c => c.vaccineId === 'varicella')?.message).toMatch(/1 dosis registrada/)
  })

  it('valida edad mínima en fechas de vacunas no aplicables por edad actual', () => {
    const patient = makePatient('2026-01-08', '2026-06-08') // 5 meses: varicela no aplicable
    const input: VaccinationInput = {
      mode: 'dates',
      doseCounts: [
        { vaccineId: 'dtpa',      count: 2 },
        { vaccineId: 'hepb',      count: 2 },
        { vaccineId: 'polio',     count: 2 },
        { vaccineId: 'hib',       count: 2 },
        { vaccineId: 'pneumo',    count: 0 },
        { vaccineId: 'menb',      count: 0 },
        { vaccineId: 'menacwy',   count: 0 },
        { vaccineId: 'mmr',       count: 0 },
        { vaccineId: 'varicella', count: 1 },
        { vaccineId: 'rotavirus', count: 0 },
        { vaccineId: 'tdtdpa',    count: 0 },
        { vaccineId: 'hpv',       count: 0 },
      ],
      doseDates: [
        { vaccineId: 'dtpa', dates: [new Date('2026-03-08'), new Date('2026-05-08')] },
        { vaccineId: 'varicella', dates: [new Date('2026-05-08')] },
      ],
    }

    const result = evaluatePatient(patient, input)
    const varicella = result.vaccineStatuses.find(s => s.vaccineId === 'varicella')!

    expect(varicella.status).toBe('not_applicable')
    expect(varicella.received).toBe(1)
    expect(varicella.doseValidity?.[0]).toMatchObject({ isValid: false, reason: 'before_min_age' })
    expect(result.vaccineCautions.find(c =>
      c.vaccineId === 'varicella' && c.message.includes('12 meses')
    )).toBeDefined()
  })

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
