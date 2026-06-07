import { useState } from 'react'
import type { Icon } from '@phosphor-icons/react'
import {
  Shield, Virus, Drop, Heartbeat, Ear, Baby,
  Check, CaretDown, CaretUp, ArrowRight,
} from '@phosphor-icons/react'
import type { PatientData, Sex, ConditionType } from '../types'

interface Props {
  onSubmit: (data: PatientData) => void
}

interface ClinicalCondition {
  id: ConditionType
  label: string
  shortDetail: string  // visible siempre
  fullDetail: string   // visible al expandir
  affects: string
  icon: Icon
}

const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  {
    id: 'immunosuppression',
    label: 'Inmunosupresión',
    icon: Shield,
    shortDetail: 'Quimioterapia · trasplante · inmunodeficiencia · corticoides altas dosis',
    fullDetail: 'Quimioterapia activa, trasplante de órgano sólido o de progenitores hematopoyéticos, inmunodeficiencia primaria, corticoides sistémicos ≥2 mg/kg/día prednisona durante >14 días, biológicos inmunosupresores.',
    affects: 'VPH: pauta 3 dosis · TV y Varicela: contraindicadas si inmunodepresión severa',
  },
  {
    id: 'hiv',
    label: 'VIH / SIDA',
    icon: Virus,
    shortDetail: 'Infección por VIH en cualquier estadio',
    fullDetail: 'Niños y adolescentes con infección por VIH, independientemente del estadio clínico, CD4 o carga viral. Si CD4 <15% o <200 células/μL, considerado inmunosupresión grave.',
    affects: 'VPH: pauta 3 dosis · Igual manejo que inmunosupresión',
  },
  {
    id: 'asplenia',
    label: 'Asplenia / hipoesplenia',
    icon: Drop,
    shortDetail: 'Asplenia anatómica o funcional · drepanocitosis · talasemia mayor',
    fullDetail: 'Asplenia anatómica (esplenectomía) o funcional, anemia drepanocítica (HbSS, SC, Sβ-talasemia), talasemia mayor u otras hemoglobinopatías graves con asplenia funcional.',
    affects: 'VNC20: dosis extra (riesgo ENI) · MenACWY y MenB: indicación ampliada',
  },
  {
    id: 'chronic_disease',
    label: 'Enfermedad crónica',
    icon: Heartbeat,
    shortDetail: 'Cardiopatía · neumopatía · hepatopatía · nefropatía · diabetes',
    fullDetail: 'Cardiopatía congénita o adquirida hemodinámicamente significativa, enfermedad pulmonar crónica (asma grave, fibrosis quística, DBP), hepatopatía crónica, nefropatía crónica o diálisis, diabetes mellitus tipo 1 o 2, obesidad mórbida.',
    affects: 'VNC20: indicación grupo riesgo ENI · Gripe anual (próxima versión)',
  },
  {
    id: 'cochlear_implant',
    label: 'Implante coclear / fístula LCR',
    icon: Ear,
    shortDetail: 'Implante coclear · fístula de líquido cefalorraquídeo',
    fullDetail: 'Portador de implante coclear unilateral o bilateral, fístula congénita o adquirida de líquido cefalorraquídeo (post-traumática o post-quirúrgica).',
    affects: 'VNC20: indicación prioritaria (alto riesgo meningitis neumocócica)',
  },
  {
    id: 'premature_lt35',
    label: 'Prematuro < 35 semanas',
    icon: Baby,
    shortDetail: 'Nacido con < 35 semanas de edad gestacional',
    fullDetail: 'Nacido con menos de 35 semanas de EG, independientemente del peso. El calendario se aplica por edad cronológica salvo excepciones. En <27 semanas, se requiere consentimiento informado para Rotavirus.',
    affects: 'MenB: indicación en 2ª temporada VRS · Rotavirus: CI en <27 semanas',
  },
]

export function PatientForm({ onSubmit }: Props) {
  const [selectedConditions, setSelectedConditions] = useState<Set<ConditionType>>(new Set())
  const [expandedId, setExpandedId] = useState<ConditionType | null>(null)

  function toggleCondition(id: ConditionType) {
    setSelectedConditions(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-white rounded-2xl shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Datos del paciente</h2>
        <p className="text-xs text-gray-400 mt-0.5">Introduce la fecha de nacimiento para calcular el calendario</p>
      </div>

      {/* Fecha y sexo */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-44">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="birthDate"
            required
            max={new Date().toISOString().split('T')[0]}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sexo</label>
          <select
            name="sex"
            required
            className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors h-[42px]"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      {/* Condiciones clínicas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Condiciones especiales
          </label>
          <span className="text-xs text-gray-400">Opcional</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Selecciona si aplica, la app ajusta las recomendaciones automáticamente.
        </p>

        <div className="space-y-2">
          {CLINICAL_CONDITIONS.map(c => {
            const selected = selectedConditions.has(c.id)
            const expanded = expandedId === c.id
            const ConditionIcon = c.icon
            const CaretIcon = expanded ? CaretUp : CaretDown

            return (
              <div
                key={c.id}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  selected ? 'border-blue-400' : 'border-gray-100'
                }`}
              >
                {/* Fila principal — tap para seleccionar */}
                <button
                  type="button"
                  onClick={() => toggleCondition(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                    selected ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                    selected ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-200'
                  }`}>
                    <ConditionIcon size={18} weight={selected ? 'fill' : 'regular'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${selected ? 'text-blue-800' : 'text-gray-800'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{c.shortDetail}</p>
                  </div>
                  {selected && (
                    <Check size={16} weight="bold" className="text-blue-600 flex-shrink-0" />
                  )}
                  {/* Botón expandir */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setExpandedId(expanded ? null : c.id)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                  >
                    <CaretIcon size={14} />
                  </button>
                </button>

                {/* Detalle expandible */}
                {expanded && (
                  <div className={`px-4 py-3 border-t ${selected ? 'border-blue-100 bg-blue-50/50' : 'border-gray-100 bg-white'}`}>
                    <p className="text-xs text-gray-600 leading-relaxed">{c.fullDetail}</p>
                    {selected && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <ArrowRight size={12} weight="bold" className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 font-medium">{c.affects}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedConditions.size === 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Sin condiciones → calendario sistemático estándar
          </p>
        )}
        {selectedConditions.size > 0 && (
          <p className="text-xs text-emerald-600 mt-2 text-center font-medium">
            {selectedConditions.size} condición{selectedConditions.size > 1 ? 'es' : ''} seleccionada{selectedConditions.size > 1 ? 's' : ''} · recomendaciones ajustadas
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        Ver calendario vacunal
        <ArrowRight size={18} weight="bold" />
      </button>
    </form>
  )
}
