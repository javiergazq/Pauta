import type { VisitPlan } from '../types'
import { VACCINES } from '../data/vaccines'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  visit: VisitPlan
  isToday: boolean
}

export function VisitCard({ visit, isToday }: Props) {
  if (visit.vaccines.length === 0) return null

  return (
    <div className={`rounded-2xl border-2 p-4 ${
      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold text-lg ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
          {visit.label}
        </span>
        {!isToday && visit.vaccines[0]?.minDate && (
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-1">
            desde {format(visit.vaccines[0].minDate, "d MMM yyyy", { locale: es })}
          </span>
        )}
      </div>

      {/* Chips de vacunas */}
      <div className="flex flex-wrap gap-2">
        {visit.vaccines.map(v => {
          const vaccine = VACCINES.find(vac => vac.id === v.vaccineId)!
          return (
            <div
              key={v.vaccineId}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white text-sm font-semibold ${vaccine.color}`}
            >
              {vaccine.shortName}
              <span className="opacity-75 text-xs">{v.doseNumber}ª</span>
            </div>
          )
        })}
      </div>

      {/* Aviso vacunas atenuadas */}
      {visit.hasLiveVaccines && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
          ⚠ Vacunas atenuadas (TV, VVZ, RV): administrar todas el mismo día o separar ≥28 días entre ellas.
        </p>
      )}
    </div>
  )
}
