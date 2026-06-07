import { describe, it, expect } from 'vitest'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import { PatientData, VaccinationInput } from '../../src/types'

function makePatient(birthDate: string, evalDate: string, sex: 'M' | 'F' = 'M'): PatientData {
  return { birthDate: new Date(birthDate), sex, evaluationDate: new Date(evalDate), conditions: [] }
}

function zeroCounts(): VaccinationInput {
  const ids = ['dtpa','hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv']
  return {
    mode: 'count',
    doseCounts: ids.map(id => ({ vaccineId: id as any, count: 0 })),
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
        ...(['hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv'] as any[])
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

describe('evaluatePatient — Modo C (fechas)', () => {
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
        ...(['hepb','polio','hib','pneumo','menb','menacwy','mmr','varicella','rotavirus','tdtdpa','hpv'] as any[])
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
