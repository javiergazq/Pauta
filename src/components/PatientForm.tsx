import { useState } from 'react'
import type { PatientData, Sex, ConditionType } from '../types'

interface Props {
  onSubmit: (data: PatientData) => void
}

interface ClinicalCondition {
  id: ConditionType
  label: string
  detail: string
  affects: string  // qué vacunas o pautas se ven afectadas
}

const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  {
    id: 'immunosuppression',
    label: 'Inmunosupresión',
    detail: 'Quimioterapia activa · trasplante de órgano sólido o de progenitores hematopoyéticos · inmunodeficiencia primaria · corticoides sistémicos a dosis altas (≥2 mg/kg/día de prednisona o equivalente durante >14 días)',
    affects: 'VPH: pauta de 3 dosis · Varicela y Triple vírica: contraindicadas si inmunodepresión severa',
  },
  {
    id: 'hiv',
    label: 'Infección por VIH',
    detail: 'Niños y adolescentes con infección por VIH, independientemente del estadio clínico o carga viral. Si CD4 <15% o <200 células/μL, valorar como inmunosupresión grave.',
    affects: 'Mismo manejo que inmunosupresión · VPH: pauta de 3 dosis',
  },
  {
    id: 'asplenia',
    label: 'Asplenia / hipoesplenia',
    detail: 'Asplenia anatómica (esplenectomía) o funcional · anemia drepanocítica (hemoglobina SS, SC, Sβ-talasemia) · talasemia mayor · otras hemoglobinopatías graves',
    affects: 'VNC20: dosis adicionales grupo riesgo ENI · MenACWY y MenB: indicación ampliada',
  },
  {
    id: 'chronic_disease',
    label: 'Enfermedad crónica significativa',
    detail: 'Cardiopatía congénita o adquirida hemodinámicamente significativa · enfermedad pulmonar crónica (asma grave, EPOC, fibrosis quística, displasia broncopulmonar) · hepatopatía crónica (cirrosis, hepatitis crónica activa) · nefropatía crónica o síndrome nefrótico · insuficiencia renal o diálisis · diabetes mellitus tipo 1 o 2 · obesidad mórbida',
    affects: 'VNC20: indicación en grupos de riesgo de ENI · Gripe anual (v2)',
  },
  {
    id: 'cochlear_implant',
    label: 'Implante coclear / fístula de LCR',
    detail: 'Portador de implante coclear unilateral o bilateral · fístula congénita o adquirida de líquido cefalorraquídeo (incluye fístula post-traumática o post-quirúrgica)',
    affects: 'VNC20: indicación prioritaria por alto riesgo de meningitis neumocócica',
  },
  {
    id: 'premature_lt35',
    label: 'Prematuro < 35 semanas',
    detail: 'Nacido con menos de 35 semanas de edad gestacional, independientemente del peso al nacer. El calendario vacunal se aplica por edad cronológica, no corregida, salvo excepciones.',
    affects: 'MenB: indicación en 2ª temporada VRS · Rotavirus: consentimiento informado en <27 sem',
  },
]

export function PatientForm({ onSubmit }: Props) {
  const [selectedConditions, setSelectedConditions] = useState<Set<ConditionType>>(new Set())

  function toggleCondition(id: ConditionType) {
    setSelectedConditions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-white rounded-2xl shadow-md">
      <h2 className="text-lg font-bold text-gray-800">Datos del paciente</h2>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="birthDate"
            required
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
          <select
            name="sex"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      {/* Condiciones clínicas — siempre visibles con descripción */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-0.5">Condiciones especiales</p>
        <p className="text-xs text-gray-400 mb-3">
          Marca si aplica — la app ajusta las recomendaciones automáticamente.
        </p>
        <div className="space-y-2">
          {CLINICAL_CONDITIONS.map(c => {
            const selected = selectedConditions.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCondition(c.id)}
                className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${
                  selected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox visual */}
                  <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${
                    selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                  }`}>
                    {selected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${selected ? 'text-blue-800' : 'text-gray-800'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {c.detail}
                    </p>
                    {selected && (
                      <p className="text-xs text-blue-600 font-medium mt-1.5">
                        Ajuste: {c.affects}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selectedConditions.size === 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Sin condiciones → calendario sistemático estándar
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        Ver calendario vacunal →
      </button>
    </form>
  )
}
