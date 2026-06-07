import { CheckCircle, Warning, CaretDown } from '@phosphor-icons/react'
import type { VaccinationResult } from '../types'
import { VisitCard } from './VisitCard'
import { DirayaNote } from './DirayaNote'
import { VACCINES } from '../data/vaccines'

interface Props {
  result: VaccinationResult
  onReset: () => void
}

export function ResultPanel({ result, onReset: _onReset }: Props) {
  const { vaccineStatuses, isUpToDate, catchupPlan, ageData } = result
  const applicable = vaccineStatuses.filter(s => s.status !== 'not_applicable')
  const missing = applicable.filter(s => s.status !== 'complete')
  const complete = applicable.filter(s => s.status === 'complete')
  const nonEmptyVisits = catchupPlan.filter(p => p.vaccines.length > 0)
  const todayVisit = catchupPlan.find(p => p.label === 'HOY')
  const futureVisits = nonEmptyVisits.filter(p => p.label !== 'HOY')

  const ageLabel = ageData.years > 0
    ? `${ageData.years} año${ageData.years > 1 ? 's' : ''}${ageData.months % 12 > 0 ? ` ${ageData.months % 12} m` : ''}`
    : ageData.months > 0 ? `${ageData.months} meses` : `${ageData.weeks} semanas`

  return (
    <div className="space-y-4 pb-6">

      {/* ─── Estado global ─── */}
      <div className={`rounded-2xl p-5 ${
        isUpToDate
          ? 'bg-emerald-500 text-white'
          : 'bg-white border-2 border-amber-400'
      }`}>
        {isUpToDate ? (
          <div className="flex items-center gap-3">
            <CheckCircle size={40} weight="fill" className="text-white flex-shrink-0" />
            <div>
              <p className="text-xl font-bold">Calendario al día</p>
              <p className="text-emerald-100 text-sm">{ageLabel} · Sin dosis pendientes</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Warning size={28} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 font-bold text-lg">
                {missing.length} vacuna{missing.length > 1 ? 's' : ''} pendiente{missing.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-500 text-sm mt-0.5">
                {ageLabel} · {complete.length} al día · {missing.length} por completar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── HOY: tarjeta hero ─── */}
      {todayVisit && todayVisit.vaccines.length > 0 && (
        <div className="bg-blue-600 rounded-2xl p-5 shadow-lg">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-3">Administrar hoy</p>
          <div className="flex flex-wrap gap-2">
            {todayVisit.vaccines.map(v => {
              const vaccine = VACCINES.find(vac => vac.id === v.vaccineId)!
              return (
                <div key={v.vaccineId} className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${vaccine.color}`} />
                  <div>
                    <p className="text-white font-bold text-sm">{vaccine.shortName}</p>
                    <p className="text-blue-200 text-xs">{v.doseNumber}ª dosis</p>
                  </div>
                </div>
              )
            })}
          </div>
          {todayVisit.hasLiveVaccines && (
            <p className="text-blue-100 text-xs mt-3 bg-white/10 rounded-lg px-3 py-2 flex items-start gap-1.5">
              <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
              Vacunas atenuadas presentes: administrar el mismo día o separar 28 días o más
            </p>
          )}
        </div>
      )}

      {/* ─── Próximas visitas ─── */}
      {futureVisits.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Próximas citas</p>
          <div className="space-y-3">
            {futureVisits.map(visit => (
              <VisitCard key={visit.label} visit={visit} isToday={false} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Resumen estado vacunal (colapsado) ─── */}
      <details className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <summary className="px-5 py-4 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-50 list-none flex justify-between items-center">
          Estado vacunal completo
          <span className="text-gray-400 text-xs flex items-center gap-1.5">
            {complete.length}/{applicable.length} al día
            <CaretDown size={12} />
          </span>
        </summary>
        <div className="px-5 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {applicable.map(s => {
            const vaccine = VACCINES.find(v => v.id === s.vaccineId)!
            const colorClass =
              s.status === 'complete' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              s.status === 'missing'  ? 'bg-red-50 text-red-800 border-red-200' :
                                        'bg-amber-50 text-amber-800 border-amber-200'
            return (
              <div key={s.vaccineId} className={`rounded-xl border px-3 py-2 text-xs ${colorClass}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${vaccine.color}`} />
                  <span className="font-bold">{vaccine.shortName}</span>
                </div>
                <div className="flex items-center gap-1">
                  {s.status === 'complete' && <CheckCircle size={12} weight="fill" />}
                  {s.status === 'complete' ? 'Completo' : `${s.valid}/${s.required} dosis`}
                </div>
                {s.doseValidity?.some(d => !d.isValid) && (
                  <div className="text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Warning size={12} weight="fill" />
                    dosis inválida
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </details>

      {/* ─── Nota Diraya ─── */}
      <DirayaNote todayVisit={todayVisit} />
    </div>
  )
}
