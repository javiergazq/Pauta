import { useState } from 'react'
import type { PatientData, Sex, ConditionType } from '../types'

interface Props {
  onSubmit: (data: PatientData) => void
}

interface ClinicalCondition {
  id: ConditionType
  label: string
  detail: string
}

// Patologías concretas — el motor las interpreta como grupos de riesgo
const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  {
    id: 'immunosuppression',
    label: 'Inmunosupresión',
    detail: 'Quimioterapia activa, trasplante de órgano o progenitores, inmunodeficiencia primaria, corticoides a altas dosis (≥2 mg/kg/día prednisona)',
  },
  {
    id: 'hiv',
    label: 'VIH / SIDA',
    detail: 'Infección por VIH en cualquier estadio',
  },
  {
    id: 'asplenia',
    label: 'Asplenia / hipoesplenia',
    detail: 'Ausencia anatómica o funcional del bazo, anemia drepanocítica, talasemia mayor',
  },
  {
    id: 'chronic_disease',
    label: 'Enfermedad crónica',
    detail: 'Cardiopatía congénita o adquirida, enfermedad pulmonar crónica (asma grave, fibrosis quística), hepatopatía crónica, nefropatía crónica / diálisis, diabetes mellitus tipo 1 o 2',
  },
  {
    id: 'cochlear_implant',
    label: 'Implante coclear / fístula de LCR',
    detail: 'Portador de implante coclear (unilateral o bilateral) o fístula de líquido cefalorraquídeo',
  },
  {
    id: 'premature_lt35',
    label: 'Prematuro < 35 semanas',
    detail: 'Nacido con menos de 35 semanas de edad gestacional',
  },
]

export function PatientForm({ onSubmit }: Props) {
  const [selectedConditions, setSelectedConditions] = useState<Set<ConditionType>>(new Set())
  const [expandedCondition, setExpandedCondition] = useState<ConditionType | null>(null)

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

      {/* Condiciones clínicas */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Condiciones especiales</p>
        <p className="text-xs text-gray-400 mb-3">
          Selecciona si aplica alguna — el sistema ajustará las recomendaciones automáticamente.
        </p>
        <div className="space-y-2">
          {CLINICAL_CONDITIONS.map(c => {
            const selected = selectedConditions.has(c.id)
            const expanded = expandedCondition === c.id
            return (
              <div
                key={c.id}
                className={`border rounded-xl transition-all ${
                  selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleCondition(c.id)}
                    className={`w-5 h-5 rounded flex-shrink-0 border-2 transition-colors flex items-center justify-center ${
                      selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected && <span className="text-xs">✓</span>}
                  </button>
                  <span className={`text-sm font-medium flex-1 ${selected ? 'text-blue-800' : 'text-gray-700'}`}>
                    {c.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedCondition(expanded ? null : c.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1"
                  >
                    {expanded ? '▲' : 'ℹ'}
                  </button>
                </div>
                {expanded && (
                  <p className="text-xs text-gray-500 px-10 pb-3 leading-relaxed">
                    {c.detail}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        {selectedConditions.size === 0 && (
          <p className="text-xs text-gray-400 mt-2">Sin condiciones especiales → calendario sistemático estándar</p>
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
