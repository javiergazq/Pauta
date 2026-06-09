import { describe, expect, it } from 'vitest'
import { getConditionWarnings } from '../../src/data/conditionRules'
import type { ConditionType } from '../../src/types'

describe('conditionRules', () => {
  it('returns a warning-only message for asplenia without implying automatic recalculation', () => {
    const warnings = getConditionWarnings(['asplenia'])

    expect(warnings).toEqual([
      expect.objectContaining({
        conditionId: 'asplenia',
        severity: 'warning',
      }),
    ])
    expect(warnings[0].message).toMatch(/neumococo/)
    expect(warnings[0].message).toMatch(/meningococo/)
    expect(warnings[0].message).toMatch(/Revisar protocolo/)
  })

  it('returns a critical live-vaccine warning for severe immunosuppression', () => {
    const warnings = getConditionWarnings(['severe_immunosuppression'])

    expect(warnings).toEqual([
      expect.objectContaining({
        conditionId: 'severe_immunosuppression',
        severity: 'critical',
        affectedVaccines: ['mmr', 'varicella'],
      }),
    ])
    expect(warnings[0].message).toMatch(/TV y varicela/)
    expect(warnings[0].message).toMatch(/contraindicadas/)
  })

  it('supports multiple selected conditions', () => {
    const conditions: ConditionType[] = ['undocumented_doses', 'maternal_hbsag_positive']
    const warnings = getConditionWarnings(conditions)

    expect(warnings.map(w => w.conditionId)).toEqual(['undocumented_doses', 'maternal_hbsag_positive'])
    expect(warnings[0].message).toMatch(/dosis documentadas/)
    expect(warnings[1].message).toMatch(/hepatitis B/)
  })

  it('contains warning-only rules for the expanded special-condition set', () => {
    const conditions: ConditionType[] = [
      'varicella_history',
      'measles_immunity_or_history',
      'immunosuppressive_treatment',
      'transplant_or_candidate',
      'complement_deficiency_or_anti_c5',
      'previous_invasive_meningococcal_disease',
      'invasive_pneumococcal_risk',
      'chronic_heart_disease',
      'chronic_lung_disease',
      'chronic_liver_disease',
      'chronic_kidney_disease',
      'diabetes',
      'neuromuscular_or_respiratory_risk',
      'maternal_hbsag_unknown',
      'international_travel',
    ]

    const warnings = getConditionWarnings(conditions)

    expect(warnings).toHaveLength(conditions.length)
    expect(warnings.map(w => w.conditionId)).toEqual(conditions)
    expect(warnings.find(w => w.conditionId === 'varicella_history')?.message).toMatch(/Antecedente de varicela/)
    expect(warnings.find(w => w.conditionId === 'complement_deficiency_or_anti_c5')?.message).toMatch(/MenB\/MenACWY/)
  })
})
