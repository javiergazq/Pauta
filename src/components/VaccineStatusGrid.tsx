import type { RequiredVaccine, VaccineId, DoseCount } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  requirements: RequiredVaccine[]
  doseCounts: DoseCount[]
  onChange: (vaccineId: VaccineId, count: number) => void
}

export function VaccineStatusGrid({ requirements, doseCounts, onChange }: Props) {
  const applicable = requirements.filter(r => r.applicable)

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h2 className="text-lg font-bold text-gray-800 mb-1">¿Cuántas dosis tiene?</h2>
      <p className="text-sm text-gray-500 mb-4">
        Toca el número de dosis recibidas de cada vacuna.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {applicable.map(req => {
          const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
          const count = doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0
          const isComplete = count >= req.minDoses
          const isMissing = count === 0

          const borderColor = isComplete
            ? 'border-green-400 bg-green-50'
            : isMissing
            ? 'border-red-300 bg-red-50'
            : 'border-yellow-400 bg-yellow-50'

          return (
            <div key={req.vaccineId} className={`border-2 rounded-xl p-3 transition-all ${borderColor}`}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${vaccine.color}`} />
                  <span className="font-semibold text-sm text-gray-800 leading-tight">
                    {vaccine.name}
                  </span>
                  {vaccine.type === 'live' && (
                    <span className="text-xs bg-purple-100 text-purple-700 rounded px-1 flex-shrink-0">atenuada</span>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs font-medium whitespace-nowrap">
                  {isComplete
                    ? <span className="text-green-700 font-semibold">✓ Al día</span>
                    : <span className="text-gray-500">{count}/{req.minDoses} dosis</span>
                  }
                </span>
              </div>

              {/* Selector: 0 hasta el máximo histórico posible (no solo el mínimo requerido) */}
              <div className="flex gap-1">
                {Array.from({ length: Math.max(req.minDoses, vaccine.maxDoses) + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange(req.vaccineId, i)}
                    className={`flex-1 py-2 text-sm rounded-lg font-bold transition-colors ${
                      count === i
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {req.note && (
                <p className="text-xs text-gray-400 mt-1.5 italic">{req.note}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
