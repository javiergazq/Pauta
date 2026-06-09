import { CheckCircle, Warning, CaretDown, Info } from '@phosphor-icons/react'
import type { VaccinationResult } from '../types'
import { VisitCard } from './VisitCard'
import { DirayaNote } from './DirayaNote'
import { VACCINES } from '../data/vaccines'

interface Props {
  result: VaccinationResult
  onReset?: () => void
}

function formatEventAge(ageMonths: number): string {
  if (ageMonths >= 12 && ageMonths % 12 === 0) {
    const years = ageMonths / 12
    return `${years} año${years > 1 ? 's' : ''}`
  }
  return `${ageMonths} meses`
}

export function ResultPanel({ result }: Props) {
  const { vaccineStatuses, isUpToDate, hasDueToday, systematicStatuses, catchupPlan, ageData, rotavirusCaution, vaccineCautions, conditionCautions, countMode } = result
  const systematicApplicable = systematicStatuses.filter(s => s.status !== 'not_applicable')
  const alDia = systematicApplicable.filter(s => s.status === 'up_to_date')
  const tocaHoy = systematicApplicable.filter(s => s.status === 'due_today')
  const retrasadas = systematicApplicable.filter(s => s.status === 'overdue')
  const nonEmptyVisits = catchupPlan.filter(p => p.vaccines.length > 0)
  const todayVisit = catchupPlan.find(p => p.label === 'HOY')
  const futureVisits = nonEmptyVisits.filter(p => p.label !== 'HOY')
  const hasActionablePlan = (todayVisit?.vaccines.length ?? 0) > 0 || futureVisits.length > 0
  const hasLiveVaccineConditionCaution = conditionCautions.some(caution =>
    caution.affectedVaccines?.some(vaccineId => vaccineId === 'mmr' || vaccineId === 'varicella')
  )

  const ageLabel = ageData.years > 0
    ? `${ageData.years} año${ageData.years > 1 ? 's' : ''}${ageData.months % 12 > 0 ? ` ${ageData.months % 12} m` : ''}`
    : ageData.months > 0 ? `${ageData.months} meses` : `${ageData.weeks} semanas`

  return (
    <div className="space-y-4 pb-6">
      <div className={`rounded-2xl p-4 shadow-sm ring-1 sm:p-5 ${
        isUpToDate
          ? 'bg-emerald-600 text-white ring-emerald-600'
          : 'bg-amber-50 text-amber-950 ring-amber-300'
      }`}>
        {isUpToDate ? (
          <div className="flex items-center gap-3">
            <CheckCircle size={34} weight="fill" className="flex-shrink-0 text-white sm:size-10" />
            <div>
              <p className="text-lg font-bold sm:text-xl">Calendario al día</p>
              <p className="text-sm text-emerald-50">
                {ageLabel} · {hasDueToday ? 'Hoy toca administrar' : 'Sin dosis pendientes'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Warning size={28} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-amber-800">
                {tocaHoy.length > 0
                  ? `${retrasadas.length} retrasada${retrasadas.length > 1 ? 's' : ''} · ${tocaHoy.length} toca hoy`
                  : `${retrasadas.length} vacuna${retrasadas.length > 1 ? 's' : ''} retrasada${retrasadas.length > 1 ? 's' : ''}`
                }
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                {ageLabel} · {alDia.length} al día · revisar puesta al día
              </p>
            </div>
          </div>
        )}
      </div>

      {conditionCautions.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Warning size={22} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="space-y-2">
            <p className="text-sm font-bold text-amber-800">Avisos por condiciones especiales</p>
            <p className="text-sm text-amber-700">
              Este paciente presenta condiciones que pueden modificar recomendaciones vacunales. La app mantiene el calendario estándar y muestra avisos para revisar el protocolo específico antes de administrar.
            </p>
            {conditionCautions.map(caution => (
              <p
                key={caution.conditionId}
                className={`${caution.severity === 'critical' ? 'font-semibold text-red-700' : 'text-amber-700'} text-sm`}
              >
                <span className="font-semibold">{caution.label}:</span> {caution.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {hasLiveVaccineConditionCaution && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
          <Warning size={22} weight="fill" className="mt-0.5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-800">Precaución con vacunas vivas</p>
            <p className="mt-0.5 text-sm text-red-700">
              TV y varicela pueden estar contraindicadas en inmunosupresión significativa. Revisar situación clínica e indicaciones específicas antes de administrar.
            </p>
          </div>
        </div>
      )}

      {rotavirusCaution && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Warning size={22} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">Rotavirus: revisar antes de administrar</p>
            <p className="mt-0.5 text-sm text-amber-700">{rotavirusCaution}</p>
          </div>
        </div>
      )}

      {vaccineCautions.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Warning size={22} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="space-y-2">
            <p className="text-sm font-bold text-amber-800">Revisar antes de administrar</p>
            {vaccineCautions.map(caution => {
              const vaccine = VACCINES.find(v => v.id === caution.vaccineId)!
              return (
                <p key={caution.vaccineId} className="text-sm text-amber-700">
                  <span className="font-semibold">{vaccine.shortName}:</span> {caution.message}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {todayVisit && todayVisit.vaccines.length > 0 && (
        <div className="rounded-2xl border border-[color:rgba(14,167,181,0.35)] bg-[var(--pauta-navy)] p-4 shadow-sm sm:p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--pauta-aqua-soft)]">Administrar hoy</p>
          <div className="flex flex-wrap gap-2">
            {todayVisit.vaccines.map(v => {
              const vaccine = VACCINES.find(vac => vac.id === v.vaccineId)!
              return (
                <div key={v.vaccineId} className="flex min-w-[8rem] flex-1 items-center gap-2 rounded-xl bg-white/12 px-3 py-2 ring-1 ring-white/15 sm:min-w-0 sm:flex-none">
                  <span className={`h-3 w-3 rounded-full ${vaccine.color}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{vaccine.shortName}</p>
                    <p className="text-xs text-[var(--pauta-aqua-soft)]">{v.doseNumber}ª dosis</p>
                  </div>
                </div>
              )
            })}
          </div>
          {todayVisit.hasLiveVaccines && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-[var(--pauta-aqua-soft)]">
              <Warning size={14} weight="fill" className="mt-0.5 flex-shrink-0" />
              Vacunas atenuadas presentes: administrar el mismo día o separar 28 días o más
            </p>
          )}
        </div>
      )}

      {countMode && hasActionablePlan && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-100 p-4">
          <Info size={18} weight="fill" className="mt-0.5 flex-shrink-0 text-slate-500" />
          <p className="text-sm text-slate-600">Cálculo basado en número de dosis. Confirmar fecha de última dosis para verificar intervalos mínimos antes de administrar.</p>
        </div>
      )}

      {futureVisits.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-500">Próximas citas</p>
          <div className="space-y-3">
            {futureVisits.map(visit => (
              <VisitCard key={visit.label} visit={visit} isToday={false} />
            ))}
          </div>
        </div>
      )}

      <details className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none flex-col items-start gap-1 px-3 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Estado vacunal completo</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            {alDia.length} al día · {tocaHoy.length} toca hoy · {retrasadas.length} retrasada{retrasadas.length === 1 ? '' : 's'}
            <CaretDown size={12} />
          </span>
        </summary>
        <div className="grid grid-cols-1 gap-2 px-3 pb-4 pt-2 sm:grid-cols-3 sm:px-5">
          {systematicApplicable.map(s => {
            const vaccine = VACCINES.find(v => v.id === s.vaccineId)!
            const doseValidity = vaccineStatuses.find(vs => vs.vaccineId === s.vaccineId)?.doseValidity
            const colorClass =
              s.status === 'overdue'   ? 'bg-red-50 text-red-800 border-red-200' :
              s.status === 'due_today' ? 'bg-[var(--pauta-aqua-soft)] text-[var(--pauta-navy)] border-[color:rgba(14,167,181,0.28)]' :
                                         'bg-emerald-50 text-emerald-800 border-emerald-200'
            const label =
              s.status === 'overdue'   ? 'Retrasada' :
              s.status === 'due_today' ? 'Toca hoy' :
              s.nextEvent              ? `Al día · próx. ${formatEventAge(s.nextEvent.ageMonths)}` :
                                         'Completo'
            return (
              <div key={s.vaccineId} className={`rounded-xl border px-3 py-2 text-xs ${colorClass}`}>
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${vaccine.color}`} />
                  <span className="font-bold">{vaccine.shortName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {s.status === 'up_to_date' && !s.nextEvent && <CheckCircle size={12} weight="fill" />}
                  {label}
                </div>
                {doseValidity?.some(d => !d.isValid) && (
                  <div className="mt-0.5 flex items-center gap-1 font-semibold text-red-600">
                    <Warning size={12} weight="fill" />
                    dosis inválida
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </details>

      <DirayaNote todayVisit={todayVisit} conditionCautions={conditionCautions} />
    </div>
  )
}
