import { describe, expect, it } from 'vitest'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import type { PatientData, VaccinationInput, VaccineId } from '../../src/types'

const ALL_IDS: VaccineId[] = [
  'dtpa',
  'hepb',
  'polio',
  'hib',
  'pneumo',
  'menb',
  'menacwy',
  'mmr',
  'varicella',
  'rotavirus',
  'tdtdpa',
  'hpv',
]

function makePatient(conditions: PatientData['conditions']): PatientData {
  return {
    birthDate: new Date('2023-06-08'),
    evaluationDate: new Date('2026-06-08'),
    sex: 'M',
    conditions,
  }
}

function zeroCounts(): VaccinationInput {
  return {
    mode: 'count',
    doseCounts: ALL_IDS.map(vaccineId => ({ vaccineId, count: 0 })),
    doseDates: [],
  }
}

describe('condition warnings integration', () => {
  it('adds condition warnings without changing the standard calculation', () => {
    const baseline = evaluatePatient(makePatient([]), zeroCounts())
    const withAsplenia = evaluatePatient(makePatient(['asplenia']), zeroCounts())

    expect(withAsplenia.conditionCautions).toEqual([
      expect.objectContaining({ conditionId: 'asplenia', severity: 'warning' }),
    ])
    expect(withAsplenia.catchupPlan).toEqual(baseline.catchupPlan)
    expect(withAsplenia.systematicStatuses).toEqual(baseline.systematicStatuses)
  })

  it('adds a critical live-vaccine warning for severe immunosuppression', () => {
    const result = evaluatePatient(makePatient(['severe_immunosuppression']), zeroCounts())

    expect(result.conditionCautions).toEqual([
      expect.objectContaining({
        conditionId: 'severe_immunosuppression',
        severity: 'critical',
        affectedVaccines: ['mmr', 'varicella'],
      }),
    ])
  })

  it('does not automatically recommend varicella when varicella history is selected', () => {
    const result = evaluatePatient(makePatient(['varicella_history']), zeroCounts())

    expect(result.conditionCautions).toEqual([
      expect.objectContaining({ conditionId: 'varicella_history', affectedVaccines: ['varicella'] }),
    ])
    expect(result.systematicStatuses.find(s => s.vaccineId === 'varicella')?.status).toBe('not_applicable')
    expect(result.catchupPlan.flatMap(visit => visit.vaccines).some(v => v.vaccineId === 'varicella')).toBe(false)
  })
})
