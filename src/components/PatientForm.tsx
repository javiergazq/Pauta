import type { PatientData, Sex, ConditionType } from '../types'

interface Props {
  onSubmit: (data: PatientData) => void
}

const CONDITIONS: { id: ConditionType; label: string }[] = [
  { id: 'immunosuppression', label: 'Inmunosupresión' },
  { id: 'risk_pneumo',       label: 'Riesgo neumococo' },
  { id: 'risk_meningo',      label: 'Riesgo meningococo' },
  { id: 'risk_hpv',          label: 'Riesgo VPH' },
]

export function PatientForm({ onSubmit }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    onSubmit({
      birthDate: new Date(data.get('birthDate') as string),
      sex: data.get('sex') as Sex,
      evaluationDate: new Date(),
      conditions: CONDITIONS.filter(c => data.get(c.id) === 'on').map(c => c.id),
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

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Condiciones especiales</p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <label
              key={c.id}
              className="flex items-center gap-1.5 text-sm bg-gray-100 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 select-none"
            >
              <input type="checkbox" name={c.id} className="accent-blue-600" />
              {c.label}
            </label>
          ))}
        </div>
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
