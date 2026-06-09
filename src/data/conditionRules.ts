import type { ConditionCaution, ConditionType, VaccineId } from '../types'

export type ConditionCategory =
  | 'history'
  | 'immunosuppression'
  | 'invasive_infection_risk'
  | 'chronic_condition'
  | 'perinatal'
  | 'other'

export type ConditionBehavior = 'warning_only' | 'implemented_adjustment'

export interface ConditionRule {
  id: ConditionType
  label: string
  category: ConditionCategory
  behavior: ConditionBehavior
  warning: string
  severity?: ConditionCaution['severity']
  affectedVaccines?: VaccineId[]
}

const CHRONIC_WARNING = 'Enfermedad crónica seleccionada: puede requerir recomendaciones específicas según campaña o protocolo de grupos de riesgo. Revisar indicaciones específicas antes de administrar.'
const ASPLENIA_WARNING = 'Asplenia/hipoesplenia: puede requerir pautas específicas frente a neumococo, meningococo e Hib. Revisar protocolo de grupos de riesgo.'
const COCHLEAR_WARNING = 'Implante coclear/fístula LCR: puede requerir pauta específica de neumococo por riesgo aumentado. Revisar protocolo específico.'

export const CONDITION_RULES: ConditionRule[] = [
  {
    id: 'varicella_history',
    label: 'Antecedente de varicela',
    category: 'history',
    behavior: 'implemented_adjustment',
    severity: 'warning',
    affectedVaccines: ['varicella'],
    warning: 'Antecedente de varicela indicado: revisar si precisa vacunación frente a varicela según antecedente, documentación y criterio clínico.',
  },
  {
    id: 'measles_immunity_or_history',
    label: 'Antecedente de sarampión / inmunidad frente a sarampión',
    category: 'history',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['mmr'],
    warning: 'Antecedente/inmunidad frente a sarampión indicado: revisar necesidad de triple vírica según documentación e inmunidad frente a sarampión, rubeola y parotiditis.',
  },
  {
    id: 'undocumented_doses',
    label: 'Dosis previas no documentadas o dudosas',
    category: 'history',
    behavior: 'warning_only',
    severity: 'warning',
    warning: 'Solo deben considerarse válidas las dosis documentadas. En caso de duda razonable, valorar iniciar o completar pauta según calendario acelerado.',
  },
  {
    id: 'severe_immunosuppression',
    label: 'Inmunosupresión severa',
    category: 'immunosuppression',
    behavior: 'warning_only',
    severity: 'critical',
    affectedVaccines: ['mmr', 'varicella'],
    warning: 'Inmunosupresión severa seleccionada: TV y varicela pueden estar contraindicadas. Revisar protocolo específico antes de administrar vacunas vivas.',
  },
  {
    id: 'immunosuppressive_treatment',
    label: 'Tratamiento inmunosupresor actual o reciente',
    category: 'immunosuppression',
    behavior: 'warning_only',
    severity: 'critical',
    affectedVaccines: ['mmr', 'varicella'],
    warning: 'Tratamiento inmunosupresor actual o reciente: revisar protocolo específico y precaución con vacunas vivas.',
  },
  {
    id: 'transplant_or_candidate',
    label: 'Trasplante o candidato a trasplante',
    category: 'immunosuppression',
    behavior: 'warning_only',
    severity: 'critical',
    affectedVaccines: ['mmr', 'varicella'],
    warning: 'Trasplante/candidato a trasplante: requiere pauta individualizada. Revisar protocolo específico de vacunación en inmunodeprimidos/grupos de riesgo.',
  },
  {
    id: 'immunosuppression',
    label: 'Inmunosupresión',
    category: 'immunosuppression',
    behavior: 'warning_only',
    severity: 'critical',
    affectedVaccines: ['mmr', 'varicella', 'hpv'],
    warning: 'Puede modificar la indicación de VPH y contraindicar TV o varicela si la inmunosupresión es grave. Revisar protocolo específico.',
  },
  {
    id: 'hiv',
    label: 'VIH',
    category: 'immunosuppression',
    behavior: 'warning_only',
    severity: 'critical',
    affectedVaccines: ['mmr', 'varicella', 'hpv'],
    warning: 'VIH: valorar situación inmunológica y protocolo específico. Si se indican TV o varicela, revisar cautela de vacunas vivas.',
  },
  {
    id: 'asplenia',
    label: 'Asplenia / hipoesplenia',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo', 'menb', 'menacwy', 'hib'],
    warning: ASPLENIA_WARNING,
  },
  {
    id: 'asplenia_hyposplenia',
    label: 'Asplenia / hipoesplenia',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo', 'menb', 'menacwy', 'hib'],
    warning: ASPLENIA_WARNING,
  },
  {
    id: 'complement_deficiency_or_anti_c5',
    label: 'Déficit de complemento / tratamiento anti-C5',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['menb', 'menacwy'],
    warning: 'Déficit de complemento o tratamiento anti-C5: riesgo aumentado de enfermedad meningocócica. Revisar pauta específica de MenB/MenACWY.',
  },
  {
    id: 'previous_invasive_meningococcal_disease',
    label: 'Antecedente de enfermedad meningocócica invasiva',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['menb', 'menacwy'],
    warning: 'Antecedente de enfermedad meningocócica invasiva: revisar indicación y pauta específica de MenB/MenACWY.',
  },
  {
    id: 'invasive_pneumococcal_risk',
    label: 'Riesgo de enfermedad neumocócica invasiva',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: 'Riesgo de enfermedad neumocócica invasiva: la pauta de VNC20 puede diferir del calendario estándar. Revisar protocolo específico.',
  },
  {
    id: 'cochlear_implant',
    label: 'Implante coclear / fístula LCR',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: COCHLEAR_WARNING,
  },
  {
    id: 'cochlear_implant_or_csf_leak',
    label: 'Implante coclear / fístula LCR',
    category: 'invasive_infection_risk',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: COCHLEAR_WARNING,
  },
  {
    id: 'chronic_disease',
    label: 'Enfermedad crónica',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'chronic_heart_disease',
    label: 'Cardiopatía crónica',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'chronic_lung_disease',
    label: 'Neumopatía crónica',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'chronic_liver_disease',
    label: 'Hepatopatía crónica',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'chronic_kidney_disease',
    label: 'Nefropatía crónica',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'diabetes',
    label: 'Diabetes mellitus',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'neuromuscular_or_respiratory_risk',
    label: 'Enfermedad neuromuscular / riesgo respiratorio',
    category: 'chronic_condition',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['pneumo'],
    warning: CHRONIC_WARNING,
  },
  {
    id: 'premature_lt35',
    label: 'Prematuro <35 semanas',
    category: 'perinatal',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['rotavirus'],
    warning: 'Prematuridad <35 semanas: revisar recomendaciones específicas según edad gestacional, edad cronológica y temporada. Algunas inmunizaciones pueden seguir indicaciones particulares.',
  },
  {
    id: 'maternal_hbsag_positive',
    label: 'Madre AgHBs positiva',
    category: 'perinatal',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['hepb'],
    warning: 'Madre AgHBs positiva: la pauta neonatal de hepatitis B requiere actuación específica en las primeras horas de vida y seguimiento posterior. Revisar protocolo.',
  },
  {
    id: 'maternal_hbsag_unknown',
    label: 'AgHBs materno desconocido',
    category: 'perinatal',
    behavior: 'warning_only',
    severity: 'warning',
    affectedVaccines: ['hepb'],
    warning: 'AgHBs materno desconocido: revisar actuación neonatal frente a hepatitis B según protocolo.',
  },
  {
    id: 'international_travel',
    label: 'Viaje internacional próximo',
    category: 'other',
    behavior: 'warning_only',
    severity: 'warning',
    warning: 'Viaje internacional: pueden estar indicadas vacunas fuera del calendario estándar. Derivar o revisar Centro de Vacunación Internacional.',
  },
]

export function getConditionWarnings(conditions: ConditionType[]): ConditionCaution[] {
  return conditions
    .map(conditionId => CONDITION_RULES.find(rule => rule.id === conditionId))
    .filter((rule): rule is ConditionRule => Boolean(rule))
    .map(rule => ({
      conditionId: rule.id,
      label: rule.label,
      message: rule.warning,
      severity: rule.severity ?? 'warning',
      affectedVaccines: rule.affectedVaccines,
    }))
}
