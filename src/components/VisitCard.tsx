import { Warning } from '@phosphor-icons/react'
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

  // La tarjeta HOY se renderiza en ResultPanel directamente como hero
  // Este componente es para las visitas futuras
  if (isToday) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="font-bold text-gray-700">{visit.label}</span>
        {visit.vaccines[0]?.minDate && (
          <span className="text-xs text-gray-400">
            desde {format(visit.vaccines[0].minDate, "d MMM yyyy", { locale: es })}
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-wrap gap-2">
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

      {visit.hasLiveVaccines && (
        <p className="text-xs text-amber-600 px-4 pb-3 flex items-start gap-1.5">
          <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
          Vacunas atenuadas: administrar el mismo día o separar 28 días o más
        </p>
      )}
    </div>
  )
}
