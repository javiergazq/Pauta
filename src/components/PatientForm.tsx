import { useState } from 'react'
import type { Icon } from '@phosphor-icons/react'
import {
  ArrowRight,
  Baby,
  CaretDown,
  CaretUp,
  Check,
  ClipboardText,
  Drop,
  Ear,
  Heartbeat,
  Shield,
  Syringe,
  Virus,
} from '@phosphor-icons/react'
import type { ConditionType, PatientData, Sex } from '../types'

interface Props {
  onSubmit: (data: PatientData) => void
}

interface ClinicalCondition {
  id: ConditionType
  label: string
  shortDetail: string
  fullDetail: string
  affects: string
  icon: Icon
}

interface ConditionSection {
  title: string
  description: string
  conditionIds: ConditionType[]
}

const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  {
    id: 'varicella_history',
    label: 'Antecedente de varicela',
    icon: ClipboardText,
    shortDetail: 'Varicela pasada o antecedente clínico compatible/documentado',
    fullDetail: 'Antecedente clínico compatible, varicela pasada o documentación de enfermedad. La app no recomienda automáticamente VVZ y deja aviso de revisión.',
    affects: 'VVZ: no recomendar automáticamente; revisar indicación según antecedente, documentación y criterio clínico.',
  },
  {
    id: 'measles_immunity_or_history',
    label: 'Antecedente de sarampión / inmunidad frente a sarampión',
    icon: ClipboardText,
    shortDetail: 'Antecedente documentado, serología o criterio clínico',
    fullDetail: 'La triple vírica incluye sarampión, rubeola y parotiditis. Un antecedente aislado de sarampión no equivale automáticamente a pauta completa.',
    affects: 'TV: revisar necesidad según documentación e inmunidad frente a sarampión, rubeola y parotiditis.',
  },
  {
    id: 'undocumented_doses',
    label: 'Dosis previas no documentadas o dudosas',
    icon: ClipboardText,
    shortDetail: 'Información verbal sin registro oficial o carné de vacunación',
    fullDetail: 'Cuando la familia refiere dosis previas pero no hay documento, registro vacunal o fecha verificable, solo deben contarse como válidas las dosis documentadas.',
    affects: 'Aviso: ante duda razonable, valorar iniciar o completar pauta según calendario acelerado.',
  },
  {
    id: 'severe_immunosuppression',
    label: 'Inmunosupresión severa',
    icon: Shield,
    shortDetail: 'Inmunodeficiencia grave, quimioterapia o tratamiento inmunosupresor intenso',
    fullDetail: 'Inmunodepresión severa por enfermedad o tratamiento. Antes de administrar vacunas atenuadas debe confirmarse el grado de inmunosupresión.',
    affects: 'TV y varicela: pueden estar contraindicadas; revisar protocolo.',
  },
  {
    id: 'immunosuppressive_treatment',
    label: 'Tratamiento inmunosupresor actual o reciente',
    icon: Shield,
    shortDetail: 'Corticoides a dosis altas, biológicos, quimioterapia u otros inmunosupresores',
    fullDetail: 'Tratamiento actual o reciente que puede modificar la seguridad y oportunidad de vacunas vivas y otras recomendaciones.',
    affects: 'Aviso: revisar protocolo específico y precaución con vacunas vivas.',
  },
  {
    id: 'transplant_or_candidate',
    label: 'Trasplante o candidato a trasplante',
    icon: Shield,
    shortDetail: 'Órgano sólido o progenitores hematopoyéticos; evaluación pre/postrasplante',
    fullDetail: 'Paciente trasplantado o en evaluación para trasplante. Requiere pauta individualizada.',
    affects: 'Aviso: revisar protocolo específico de vacunación en inmunodeprimidos/grupos de riesgo.',
  },
  {
    id: 'hiv',
    label: 'VIH',
    icon: Virus,
    shortDetail: 'Infección por VIH. Valorar situación inmunológica y protocolo específico',
    fullDetail: 'Niños y adolescentes con infección por VIH. Si CD4 bajo o inmunosupresión significativa, revisar especialmente vacunas atenuadas.',
    affects: 'Aviso: revisar protocolo específico; cautela con TV y varicela según situación inmunológica.',
  },
  {
    id: 'asplenia_hyposplenia',
    label: 'Asplenia / hipoesplenia',
    icon: Drop,
    shortDetail: 'Asplenia anatómica o funcional, drepanocitosis, esplenectomía',
    fullDetail: 'Asplenia anatómica o funcional, anemia drepanocítica, esplenectomía u otras situaciones similares.',
    affects: 'Neumococo, meningococo e Hib: revisar protocolo de grupos de riesgo.',
  },
  {
    id: 'complement_deficiency_or_anti_c5',
    label: 'Déficit de complemento / tratamiento anti-C5',
    icon: Drop,
    shortDetail: 'Eculizumab, ravulizumab u otros inhibidores del complemento',
    fullDetail: 'Déficit de complemento o tratamiento anti-C5 con aumento del riesgo de enfermedad meningocócica.',
    affects: 'MenB/MenACWY: revisar pauta específica.',
  },
  {
    id: 'previous_invasive_meningococcal_disease',
    label: 'Antecedente de enfermedad meningocócica invasiva',
    icon: Drop,
    shortDetail: 'Historia previa de EMI o indicación de riesgo meningocócico',
    fullDetail: 'Antecedente de enfermedad meningocócica invasiva o situación clínica con indicación de riesgo meningocócico.',
    affects: 'MenB/MenACWY: revisar indicación y pauta específica.',
  },
  {
    id: 'invasive_pneumococcal_risk',
    label: 'Riesgo de enfermedad neumocócica invasiva',
    icon: Drop,
    shortDetail: 'Condición clínica de riesgo de ENI según protocolo',
    fullDetail: 'Condición clínica que puede modificar la pauta de VNC20 respecto al calendario estándar.',
    affects: 'VNC20: revisar protocolo específico.',
  },
  {
    id: 'cochlear_implant_or_csf_leak',
    label: 'Implante coclear / fístula LCR',
    icon: Ear,
    shortDetail: 'Implante coclear, candidato a implante o fístula de líquido cefalorraquídeo',
    fullDetail: 'Portador o candidato a implante coclear, o fístula de líquido cefalorraquídeo.',
    affects: 'Neumococo: revisar pauta específica.',
  },
  {
    id: 'chronic_heart_disease',
    label: 'Cardiopatía crónica',
    icon: Heartbeat,
    shortDetail: 'Cardiopatía crónica con posible indicación de grupo de riesgo',
    fullDetail: 'Cardiopatía crónica que puede requerir recomendaciones específicas según protocolo.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'chronic_lung_disease',
    label: 'Neumopatía crónica',
    icon: Heartbeat,
    shortDetail: 'Asma grave, fibrosis quística, DBP u otra enfermedad pulmonar crónica',
    fullDetail: 'Neumopatía crónica que puede requerir recomendaciones específicas según protocolo.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'chronic_liver_disease',
    label: 'Hepatopatía crónica',
    icon: Heartbeat,
    shortDetail: 'Enfermedad hepática crónica',
    fullDetail: 'Hepatopatía crónica que puede requerir recomendaciones específicas según protocolo.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'chronic_kidney_disease',
    label: 'Nefropatía crónica',
    icon: Heartbeat,
    shortDetail: 'Nefropatía crónica o diálisis',
    fullDetail: 'Nefropatía crónica que puede requerir recomendaciones específicas según protocolo.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'diabetes',
    label: 'Diabetes mellitus',
    icon: Heartbeat,
    shortDetail: 'Diabetes mellitus tipo 1 o 2',
    fullDetail: 'Diabetes mellitus con posible indicación de recomendaciones específicas según campaña o protocolo.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'neuromuscular_or_respiratory_risk',
    label: 'Enfermedad neuromuscular / riesgo respiratorio',
    icon: Heartbeat,
    shortDetail: 'Trastorno neuromuscular o condición con riesgo respiratorio',
    fullDetail: 'Condición neuromuscular o trastorno con riesgo respiratorio que puede requerir recomendaciones específicas.',
    affects: 'Aviso: revisar indicaciones específicas antes de administrar.',
  },
  {
    id: 'premature_lt35',
    label: 'Prematuro <35 semanas',
    icon: Baby,
    shortDetail: 'Nacimiento con edad gestacional inferior a 35 semanas',
    fullDetail: 'Nacido con menos de 35 semanas de edad gestacional. El calendario se aplica por edad cronológica salvo excepciones.',
    affects: 'Prematuridad: revisar recomendaciones específicas según edad gestacional, edad cronológica y temporada.',
  },
  {
    id: 'maternal_hbsag_positive',
    label: 'Madre AgHBs positiva',
    icon: Syringe,
    shortDetail: 'Recién nacido de madre con hepatitis B',
    fullDetail: 'Situación de madre AgHBs positiva o riesgo perinatal de hepatitis B. Puede requerir vacuna al nacimiento, inmunoglobulina y seguimiento.',
    affects: 'HepB: revisar protocolo perinatal específico.',
  },
  {
    id: 'maternal_hbsag_unknown',
    label: 'AgHBs materno desconocido',
    icon: Syringe,
    shortDetail: 'Resultado materno no disponible en primeras 24 horas',
    fullDetail: 'Situación neonatal en la que el resultado materno de AgHBs no está disponible en las primeras 24 horas.',
    affects: 'HepB: revisar actuación neonatal frente a hepatitis B según protocolo.',
  },
  {
    id: 'international_travel',
    label: 'Viaje internacional próximo',
    icon: ClipboardText,
    shortDetail: 'Viaje a zona con recomendaciones vacunales específicas',
    fullDetail: 'Viaje internacional próximo. Puede requerir vacunas fuera del calendario estándar y planificación con antelación.',
    affects: 'Aviso: revisar Centro de Vacunación Internacional 4-8 semanas antes si es posible.',
  },
]

const CONDITION_SECTIONS: ConditionSection[] = [
  {
    title: 'Antecedentes vacunales/infecciosos',
    description: 'Antecedentes que pueden cambiar la interpretación de dosis o inmunidad previa.',
    conditionIds: ['varicella_history', 'measles_immunity_or_history', 'undocumented_doses'],
  },
  {
    title: 'Inmunosupresión y situaciones de inmunocompromiso',
    description: 'Condiciones que pueden modificar vacunas atenuadas o pautas por riesgo.',
    conditionIds: ['severe_immunosuppression', 'immunosuppressive_treatment', 'transplant_or_candidate', 'hiv'],
  },
  {
    title: 'Riesgo de infección invasiva',
    description: 'Patologías donde la app avisa y mantiene el cálculo estándar salvo reglas implementadas.',
    conditionIds: ['asplenia_hyposplenia', 'complement_deficiency_or_anti_c5', 'previous_invasive_meningococcal_disease', 'invasive_pneumococcal_risk', 'cochlear_implant_or_csf_leak'],
  },
  {
    title: 'Enfermedades crónicas',
    description: 'Subgrupos clínicos que pueden requerir indicaciones específicas.',
    conditionIds: ['chronic_heart_disease', 'chronic_lung_disease', 'chronic_liver_disease', 'chronic_kidney_disease', 'diabetes', 'neuromuscular_or_respiratory_risk'],
  },
  {
    title: 'Situaciones perinatales',
    description: 'Situaciones del nacimiento que requieren comprobar protocolos específicos.',
    conditionIds: ['premature_lt35', 'maternal_hbsag_positive', 'maternal_hbsag_unknown'],
  },
  {
    title: 'Otros factores que requieren revisión',
    description: 'Factores fuera del calendario estándar infantil.',
    conditionIds: ['international_travel'],
  },
]

const CONDITIONS_BY_ID = new Map(CLINICAL_CONDITIONS.map(condition => [condition.id, condition]))

export function PatientForm({ onSubmit }: Props) {
  const [selectedConditions, setSelectedConditions] = useState<Set<ConditionType>>(new Set())
  const [expandedId, setExpandedId] = useState<ConditionType | null>(null)
  const [conditionsOpen, setConditionsOpen] = useState(false)

  function toggleCondition(id: ConditionType) {
    setSelectedConditions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    onSubmit({
      birthDate: new Date(data.get('birthDate') as string),
      sex: data.get('sex') as Sex,
      evaluationDate: new Date(),
      conditions: Array.from(selectedConditions),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div>
        <h2 className="text-xl font-black tracking-tight text-[var(--pauta-navy)]">Datos del paciente</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">Introduce la fecha de nacimiento para calcular el calendario</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
            Fecha de nacimiento
          </label>
          <input
            aria-label="Fecha de nacimiento"
            type="date"
            name="birthDate"
            required
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[var(--pauta-aqua)] focus:bg-white focus:outline-none"
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Sexo</label>
          <select
            name="sex"
            required
            className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-[var(--pauta-aqua)] focus:bg-white focus:outline-none"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
        <button
          type="button"
          onClick={() => setConditionsOpen(open => !open)}
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-slate-100 sm:px-4"
        >
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Condiciones especiales
              </span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Opcional</span>
              {selectedConditions.size > 0 && (
                <span className="rounded-lg bg-[var(--pauta-aqua-soft)] px-2 py-1 text-xs font-bold text-[var(--pauta-navy)] ring-1 ring-[color:rgba(14,167,181,0.25)]">
                  {selectedConditions.size} seleccionada{selectedConditions.size > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm leading-5 text-slate-500">
              Abrir solo si hay antecedentes o grupos de riesgo que revisar.
            </p>
          </div>
          <CaretDown
            size={18}
            className={`shrink-0 text-slate-500 transition-transform ${conditionsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {conditionsOpen && (
          <div className="space-y-4 border-t border-slate-200 bg-white px-3 py-4 sm:px-4">
            {CONDITION_SECTIONS.map(section => (
              <div key={section.title} className="space-y-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">{section.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{section.description}</p>
                </div>

                {section.conditionIds.map(conditionId => {
                  const c = CONDITIONS_BY_ID.get(conditionId)!
                  const selected = selectedConditions.has(c.id)
                  const expanded = expandedId === c.id
                  const ConditionIcon = c.icon
                  const CaretIcon = expanded ? CaretUp : CaretDown

                  return (
                    <div
                      key={c.id}
                      className={`overflow-hidden rounded-xl border transition-all ${
                        selected ? 'border-[color:rgba(14,167,181,0.55)] shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      <div className={`flex items-center transition-colors ${
                        selected ? 'bg-[var(--pauta-aqua-soft)]' : 'bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <button
                          type="button"
                          onClick={() => toggleCondition(c.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left transition active:scale-[0.995] sm:gap-3"
                        >
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all sm:h-9 sm:w-9 ${
                            selected ? 'bg-[var(--pauta-navy)] text-white' : 'border border-slate-200 bg-white text-slate-400'
                          }`}>
                            <ConditionIcon size={18} weight={selected ? 'fill' : 'regular'} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold ${selected ? 'text-[var(--pauta-navy)]' : 'text-slate-800'}`}>
                              {c.label}
                            </p>
                            <p className="line-clamp-2 text-xs text-slate-500 sm:truncate">{c.shortDetail}</p>
                          </div>
                          {selected && (
                            <Check size={16} weight="bold" className="flex-shrink-0 text-[var(--pauta-navy)]" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalle de ${c.label}`}
                          onClick={() => setExpandedId(expanded ? null : c.id)}
                          className="flex-shrink-0 self-stretch px-3 text-slate-400 transition hover:text-slate-700"
                        >
                          <CaretIcon size={14} />
                        </button>
                      </div>

                      {expanded && (
                        <div className={`border-t px-3 py-3 sm:px-4 ${selected ? 'border-[color:rgba(14,167,181,0.18)] bg-[var(--pauta-aqua-soft)]/60' : 'border-slate-100 bg-white'}`}>
                          <p className="text-xs leading-relaxed text-slate-600">{c.fullDetail}</p>
                          {selected && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <ArrowRight size={12} weight="bold" className="mt-0.5 flex-shrink-0 text-[var(--pauta-navy)]" />
                              <p className="text-xs font-semibold text-[var(--pauta-navy)]">{c.affects}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {selectedConditions.size === 0 && (
          <p className="border-t border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium text-slate-500">
            Sin condiciones especiales seleccionadas: calendario sistemático estándar.
          </p>
        )}
        {selectedConditions.size > 0 && (
          <div className="border-t border-[color:rgba(14,167,181,0.25)] bg-[var(--pauta-aqua-soft)] px-3 py-2">
            <p className="text-xs font-bold text-[var(--pauta-navy)]">Condiciones seleccionadas</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(selectedConditions).map(conditionId => (
                <span key={conditionId} className="rounded-lg border border-[color:rgba(14,167,181,0.25)] bg-white px-2 py-1 text-xs font-medium text-[var(--pauta-navy)]">
                  {CONDITIONS_BY_ID.get(conditionId)?.label ?? conditionId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pauta-navy)] px-3 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(3,47,88,0.24)] transition hover:bg-[var(--pauta-navy-dark)] active:scale-[0.99]"
      >
        Ver calendario vacunal
        <ArrowRight size={18} weight="bold" />
      </button>
    </form>
  )
}
