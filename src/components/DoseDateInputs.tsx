import { useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import type { RequiredVaccine, VaccineId, DoseWithDate } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  requirements: RequiredVaccine[]
  doseDates: DoseWithDate[]
  onChange: (vaccineId: VaccineId, doseIndex: number, date: Date | null) => void
}

export function DoseDateInputs({ requirements, doseDates, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const applicable = requirements.filter(r => r.applicable)

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
            Introduce fechas para detectar dosis inválidas por intervalo insuficiente
          </p>
        </div>
        <span className="ml-4 text-slate-400">
          {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-100 px-3 pb-5 pt-4 sm:px-5">
          {applicable.map(req => {
            const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
            const entry = doseDates.find(d => d.vaccineId === req.vaccineId)
            const dates = entry?.dates ?? Array(req.minDoses).fill(null)

            return (
              <div key={req.vaccineId}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-3 w-3 flex-shrink-0 rounded-full ${vaccine.color}`} />
                  <span className="text-sm font-semibold text-slate-800">{vaccine.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: req.minDoses }, (_, i) => {
                    const val = dates[i]
                    const dateStr = val instanceof Date
                      ? val.toISOString().split('T')[0]
                      : ''
                    return (
                      <div key={i} className="min-w-[9rem] flex-1 sm:flex-none">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Dosis {i + 1}</label>
                        <input
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
          })}
        </div>
      )}
    </div>
  )
}
