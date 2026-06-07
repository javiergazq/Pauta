// El grid es entrada de datos pura — NO calcula si el paciente está "al día".
// Ese juicio lo hace el motor (vaccineEngine) al pulsar "Calcular".
// Mostrar verde/rojo aquí sería incorrecto porque minDoses es el objetivo catch-up
// total, no las dosis esperadas para la edad exacta del paciente.
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
      <div className="px-4 pt-4 pb-2 border-b border-gray-50">
        <h2 className="text-base font-bold text-gray-800">Dosis recibidas</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Pulsa el número de dosis que ya tiene puestas. La app calculará el plan al finalizar.
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {applicable.map(req => {
          const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
          const count = doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0
          const maxButtons = Math.max(req.minDoses, vaccine.maxDoses)

          return (
            <div key={req.vaccineId} className="px-4 py-3">
              {/* Nombre de la vacuna */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${vaccine.color}`} />
                <span className="text-sm font-semibold text-gray-800 leading-tight">
                  {vaccine.name}
                </span>
                {vaccine.type === 'live' && (
                  <span className="text-xs text-purple-500 bg-purple-50 rounded px-1.5 py-0.5">atenuada</span>
                )}
              </div>

              {/* Botones de selección — mínimo 48px altura (táctil) */}
              <div className="flex gap-1.5">
                {Array.from({ length: maxButtons + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange(req.vaccineId, i)}
                    className={`flex-1 min-h-[48px] rounded-xl text-base font-bold transition-all ${
                      count === i
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 scale-95'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {/* Dosis seleccionada */}
              {count > 0 && (
                <p className="text-xs text-blue-600 mt-1.5 font-medium">
                  {count} dosis registrada{count > 1 ? 's' : ''}
                </p>
              )}

              {req.note && (
                <p className="text-xs text-gray-400 mt-1 italic">{req.note}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
