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
  if (isToday) return null

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col items-start gap-1 border-b border-gray-100 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <span className="font-bold text-gray-700">{visit.label}</span>
        {visit.vaccines[0]?.minDate && (
          <span className="text-xs text-gray-400">
            desde {format(visit.vaccines[0].minDate, 'd MMM yyyy', { locale: es })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 px-3 py-3 sm:px-4">
        {visit.vaccines.map(v => {
          const vaccine = VACCINES.find(vac => vac.id === v.vaccineId)!
          return (
            <div
              key={v.vaccineId}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white ${vaccine.color}`}
            >
              {vaccine.shortName}
              <span className="text-xs opacity-75">{v.doseNumber}ª</span>
            </div>
          )
        })}
      </div>

      {visit.hasLiveVaccines && (
        <p className="flex items-start gap-1.5 px-3 pb-3 text-xs text-amber-600 sm:px-4">
          <Warning size={14} weight="fill" className="mt-0.5 flex-shrink-0" />
          Vacunas atenuadas: administrar el mismo día o separar 28 días o más
        </p>
      )}
    </div>
  )
}
