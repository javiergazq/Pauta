import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import type { RequiredVaccine, VaccineId, DoseCount, VaccineDocumentationDetail } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  requirements: RequiredVaccine[]
  doseCounts: DoseCount[]
  documentationDetails?: VaccineDocumentationDetail[]
  onChange: (vaccineId: VaccineId, count: number) => void
  onDocumentationDetailChange?: (vaccineId: VaccineId, detail: Partial<VaccineDocumentationDetail>) => void
}

const HEXAVALENT_IDS: VaccineId[] = ['dtpa', 'hepb', 'polio', 'hib']

export function VaccineStatusGrid({
  requirements,
  doseCounts,
  documentationDetails = [],
  onChange,
  onDocumentationDetailChange,
}: Props) {
  const [showNonApplicable, setShowNonApplicable] = useState(false)
  const applicable = requirements.filter(r => r.applicable)
  const nonApplicable = requirements.filter(r => !r.applicable)
  const applicableIds = new Set(applicable.map(req => req.vaccineId))
  const hasHexavalentGroup = HEXAVALENT_IDS.every(vaccineId => applicableIds.has(vaccineId))
  const hexavalentCounts = HEXAVALENT_IDS.map(vaccineId =>
    doseCounts.find(d => d.vaccineId === vaccineId)?.count ?? 0
  )
  const hexavalentSelected = hexavalentCounts.every(count => count === hexavalentCounts[0])
    ? hexavalentCounts[0]
    : null
  const recordedNonApplicable = nonApplicable.filter(req =>
    (doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0) > 0
  )

  function setHexavalentCount(count: number) {
    HEXAVALENT_IDS.forEach(vaccineId => {
      if (applicableIds.has(vaccineId)) {
        onChange(vaccineId, count)
      }
    })
  }

  function renderDocumentationDetail(vaccineId: VaccineId, count: number) {
    if (count === 0 || !onDocumentationDetailChange) return null
    const detail = documentationDetails.find(d => d.vaccineId === vaccineId)

    if (vaccineId === 'polio') {
      return (
        <label className="mt-2 block text-xs font-semibold text-slate-600" htmlFor="polio-documentation-type">
          Tipo documentado
          <select
            id="polio-documentation-type"
            value={detail?.polioType ?? 'standard_ipv_or_trivalent'}
            onChange={event => onDocumentationDetailChange(vaccineId, { polioType: event.target.value as VaccineDocumentationDetail['polioType'] })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--pauta-aqua)] focus:ring-2 focus:ring-[color:rgba(14,167,181,0.16)]"
          >
            <option value="standard_ipv_or_trivalent">VPI / VPO trivalente o pauta mixta</option>
            <option value="exclusive_bivalent_opv_after_2016">Solo VPO bivalente desde abril 2016</option>
            <option value="unknown">No consta tipo de polio</option>
          </select>
        </label>
      )
    }

    if (vaccineId === 'mmr') {
      return (
        <label className="mt-2 block text-xs font-semibold text-slate-600" htmlFor="mmr-documentation-type">
          Componentes documentados
          <select
            id="mmr-documentation-type"
            value={detail?.mmrType ?? 'complete_mmr'}
            onChange={event => onDocumentationDetailChange(vaccineId, { mmrType: event.target.value as VaccineDocumentationDetail['mmrType'] })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--pauta-aqua)] focus:ring-2 focus:ring-[color:rgba(14,167,181,0.16)]"
          >
            <option value="complete_mmr">Triple vírica completa</option>
            <option value="measles_rubella_only">Sarampión + rubeola, sin parotiditis</option>
            <option value="measles_only">Solo sarampión</option>
            <option value="rubella_only">Solo rubeola</option>
            <option value="unknown">No constan componentes</option>
          </select>
        </label>
      )
    }

    return null
  }

  function renderDoseRow(req: RequiredVaccine, variant: 'standard' | 'extra' = 'standard') {
    const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
    const count = doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0
    const maxButtons = Math.max(req.minDoses, vaccine.maxDoses)

    return (
      <div key={req.vaccineId} className={variant === 'extra' ? 'px-3 py-3 sm:px-4' : 'px-3 py-3.5 sm:px-4'}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${vaccine.color}`} />
          <span className="text-sm font-bold leading-tight text-slate-800">
            {vaccine.name}
          </span>
          {vaccine.type === 'live' && (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-xs font-semibold text-violet-700">atenuada</span>
          )}
          {variant === 'extra' && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">fuera de edad actual</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: maxButtons + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(req.vaccineId, i)}
              className={`min-h-[48px] min-w-10 flex-1 rounded-xl text-base font-black transition-all sm:min-w-0 ${
                count === i
                  ? 'scale-95 bg-[var(--pauta-navy)] text-white shadow-sm ring-2 ring-[color:rgba(14,167,181,0.28)]'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95'
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        {count > 0 && (
          <p className="mt-1.5 text-xs font-semibold text-[var(--pauta-navy)]">
            {count} dosis registrada{count > 1 ? 's' : ''}
          </p>
        )}

        {renderDocumentationDetail(req.vaccineId, count)}

        {req.note && (
          <p className="mt-1 text-xs italic text-slate-500">{req.note}</p>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white/95 shadow-sm ring-1 ring-slate-200/70">
      <div className="border-b border-slate-100 px-3 pb-3 pt-4 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight text-[var(--pauta-navy)]">Dosis recibidas</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Pulsa el número de dosis que ya tiene puestas. La app calculará el plan al finalizar.
            </p>
          </div>

          {hasHexavalentGroup && (
            <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm sm:min-w-[18rem]">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[var(--pauta-navy)]">Hexavalente</span>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:inline">
                  DTPa · HepB · Polio · Hib
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map(count => (
                  <button
                    key={count}
                    type="button"
                    aria-label={`Hexavalente ${count} dosis`}
                    onClick={() => setHexavalentCount(count)}
                    className={`h-8 rounded-lg text-sm font-black transition-all ${
                      hexavalentSelected === count
                        ? 'bg-[var(--pauta-navy)] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-[var(--pauta-aqua-soft)] hover:text-[var(--pauta-navy)] active:scale-95'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {applicable.map(req => renderDoseRow(req))}

        {nonApplicable.length > 0 && (
          <div className="bg-slate-50/70">
            <button
              type="button"
              onClick={() => setShowNonApplicable(open => !open)}
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-slate-100 sm:px-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700">Otras vacunas administradas</p>
                <p className="text-xs leading-5 text-slate-500">
                  Para dosis registradas en otro país o fuera del calendario actual por edad.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {recordedNonApplicable.length > 0 && (
                  <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-[var(--pauta-navy)] ring-1 ring-slate-200">
                    {recordedNonApplicable.length}
                  </span>
                )}
                <CaretDown
                  size={16}
                  className={`text-slate-500 transition-transform ${showNonApplicable ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {showNonApplicable && (
              <div className="divide-y divide-slate-100 border-t border-slate-200 bg-white">
                {nonApplicable.map(req => renderDoseRow(req, 'extra'))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
