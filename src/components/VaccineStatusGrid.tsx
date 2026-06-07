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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-bold text-gray-800">Dosis recibidas</h2>
        <p className="text-xs text-gray-400 mt-0.5">Toca el número de dosis que ya tiene puestas</p>
      </div>

      <div className="divide-y divide-gray-50">
        {applicable.map(req => {
          const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
          const count = doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0
          const isComplete = count >= req.minDoses
          const isMissing = count === 0
          const maxButtons = Math.max(req.minDoses, vaccine.maxDoses)

          // Franja lateral de color según estado
          const sideColor = isComplete
            ? 'bg-emerald-500'
            : isMissing
            ? 'bg-red-400'
            : 'bg-amber-400'

          return (
            <div key={req.vaccineId} className="flex items-stretch">
              {/* Franja lateral de estado */}
              <div className={`w-1 flex-shrink-0 ${sideColor}`} />

              <div className="flex-1 px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${vaccine.color}`} />
                      <span className="text-sm font-semibold text-gray-800 leading-tight">
                        {vaccine.name}
                      </span>
                    </div>
                    {vaccine.type === 'live' && (
                      <span className="text-xs text-purple-600 ml-4">vacuna atenuada</span>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {isComplete ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Al día</span>
                    ) : (
                      <span className="text-xs text-gray-400">{count}/{req.minDoses}</span>
                    )}
                  </div>
                </div>

                {/* Botones de selección — mínimo 48px de altura (táctil) */}
                <div className="flex gap-1.5">
                  {Array.from({ length: maxButtons + 1 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onChange(req.vaccineId, i)}
                      className={`flex-1 min-h-[48px] rounded-xl text-base font-bold transition-all ${
                        count === i
                          ? i === 0
                            ? 'bg-red-500 text-white shadow-sm scale-95'
                            : i >= req.minDoses
                            ? 'bg-emerald-500 text-white shadow-sm scale-95'
                            : 'bg-amber-400 text-white shadow-sm scale-95'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300'
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
