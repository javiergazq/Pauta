import type { VaccinationResult } from '../types'
import { VisitCard } from './VisitCard'
import { VACCINES } from '../data/vaccines'

interface Props {
  result: VaccinationResult
  onReset: () => void
}

export function ResultPanel({ result, onReset }: Props) {
  const { vaccineStatuses, isUpToDate, catchupPlan, ageData } = result
  const applicable = vaccineStatuses.filter(s => s.status !== 'not_applicable')
  const missing = applicable.filter(s => s.status !== 'complete')
  const nonEmptyVisits = catchupPlan.filter(p => p.vaccines.length > 0)

  const ageLabel = ageData.years > 0
    ? `${ageData.years} año${ageData.years > 1 ? 's' : ''}${ageData.months % 12 > 0 ? ` ${ageData.months % 12} m` : ''}`
    : ageData.months > 0
    ? `${ageData.months} meses`
    : `${ageData.weeks} semanas`

  return (
    <div className="space-y-4">
      {/* Cabecera de resultado */}
      <div className={`rounded-2xl p-5 border-2 ${
        isUpToDate
          ? 'bg-green-50 border-green-400'
          : 'bg-amber-50 border-amber-400'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xl font-bold ${isUpToDate ? 'text-green-700' : 'text-amber-700'}`}>
              {isUpToDate
                ? '✓ Calendario al día'
                : `⚠ Faltan ${missing.length} vacuna${missing.length > 1 ? 's' : ''}`
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">{ageLabel}</p>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-gray-400 underline hover:text-gray-600 whitespace-nowrap"
          >
            Nueva consulta
          </button>
        </div>
      </div>

      {/* Resumen por vacuna */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-3">Estado vacunal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {applicable.map(s => {
            const vaccine = VACCINES.find(v => v.id === s.vaccineId)!
            const colorClass =
              s.status === 'complete' ? 'bg-green-100 text-green-800 border-green-200' :
              s.status === 'missing'  ? 'bg-red-100 text-red-800 border-red-200' :
                                        'bg-yellow-100 text-yellow-800 border-yellow-200'
            return (
              <div key={s.vaccineId} className={`rounded-xl border px-3 py-2 text-xs ${colorClass}`}>
                <div className="font-bold">{vaccine.shortName}</div>
                <div className="mt-0.5">
                  {s.status === 'complete'
                    ? '✓ Completo'
                    : `${s.valid}/${s.required} dosis`
                  }
                </div>
                {s.doseValidity?.some(d => !d.isValid) && (
                  <div className="text-red-600 font-semibold mt-0.5">⚠ dosis inválida</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan de visitas */}
      {!isUpToDate && nonEmptyVisits.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Plan de vacunación</h3>
          <div className="space-y-3">
            {catchupPlan.map((visit, i) => (
              <VisitCard key={visit.label} visit={visit} isToday={i === 0} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Fuente: Guía Calendarios Acelerados ANDAVAC 2026 (feb. 2026)
          </p>
        </div>
      )}
    </div>
  )
}
