import { useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import type { RequiredVaccine, VaccineId, DoseCount, DoseWithDate } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  requirements: RequiredVaccine[]
  doseCounts: DoseCount[]
  doseDates: DoseWithDate[]
  onChange: (vaccineId: VaccineId, doseIndex: number, date: Date | null) => void
}

export function DoseDateInputs({ requirements, doseCounts, doseDates, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const applicable = requirements.filter(r => r.applicable)
  const recordedExtras = requirements.filter(r =>
    !r.applicable && (doseCounts.find(d => d.vaccineId === r.vaccineId)?.count ?? 0) > 0
  )

  function renderDateRow(req: RequiredVaccine, fields: number, variant: 'standard' | 'extra' = 'standard') {
    const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
    const entry = doseDates.find(d => d.vaccineId === req.vaccineId)
    const dates = entry?.dates ?? Array(fields).fill(null)

    return (
      <div key={req.vaccineId}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`h-3 w-3 flex-shrink-0 rounded-full ${vaccine.color}`} />
          <span className="text-sm font-semibold text-slate-800">{vaccine.name}</span>
          {variant === 'extra' && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">fuera de edad actual</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: fields }, (_, i) => {
            const val = dates[i]
            const dateStr = val instanceof Date
              ? val.toISOString().split('T')[0]
              : ''
            const inputId = `date-${req.vaccineId}-${i}`
            return (
              <div key={i} className="min-w-[9rem] flex-1 sm:flex-none">
                <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-slate-500">Dosis {i + 1}</label>
                <input
                  id={inputId}
                  type="date"
                  value={dateStr}
                  onChange={e =>
                    onChange(req.vaccineId, i, e.target.value ? new Date(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pauta-aqua)]"
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white/95 shadow-sm ring-1 ring-slate-200/70">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="flex w-full items-center justify-between px-3 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
      >
        <div className="min-w-0">
          <span className="font-bold text-[var(--pauta-navy)]">Análisis con fechas</span>
          <span className="ml-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">opcional</span>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Introduce fechas para detectar dosis inválidas por intervalo insuficiente o edad mínima
          </p>
        </div>
        <span className="ml-4 text-slate-400">
          {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-100 px-3 pb-5 pt-4 sm:px-5">
          {applicable.map(req => renderDateRow(req, req.minDoses))}

          {recordedExtras.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Fechas de otras vacunas registradas</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Para comprobar dosis anotadas fuera del calendario actual por edad o procedencia.
                </p>
              </div>
              {recordedExtras.map(req => {
                const count = doseCounts.find(d => d.vaccineId === req.vaccineId)?.count ?? 0
                return renderDateRow(req, count, 'extra')
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
