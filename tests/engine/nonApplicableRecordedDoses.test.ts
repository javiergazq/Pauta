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

describe('recorded non-applicable doses', () => {
  it('keeps an early varicella dose as a review warning without recommending it automatically', () => {
    const patient: PatientData = {
      birthDate: new Date('2025-07-09'),
      evaluationDate: new Date('2026-06-09'),
      sex: 'M',
      conditions: [],
    }
    const input: VaccinationInput = {
      mode: 'count',
      doseCounts: ALL_IDS.map(vaccineId => ({
        vaccineId,
        count: vaccineId === 'varicella' ? 1 : 0,
      })),
      doseDates: [],
    }

    const result = evaluatePatient(patient, input)

    expect(result.systematicStatuses.find(s => s.vaccineId === 'varicella')?.status).toBe('not_applicable')
    expect(result.catchupPlan.flatMap(visit => visit.vaccines).some(v => v.vaccineId === 'varicella')).toBe(false)
    expect(result.vaccineCautions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vaccineId: 'varicella',
          message: expect.stringContaining('no corresponde al calendario actual'),
        }),
      ]),
    )
  })
})
