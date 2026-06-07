import { useState } from 'react'
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
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <span className="font-semibold text-gray-800">Análisis con fechas</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">opcional</span>
          <p className="text-xs text-gray-400 mt-0.5">
            Introduce fechas para detectar dosis inválidas por intervalo insuficiente
          </p>
        </div>
        <span className="text-gray-400 ml-4">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-5 pb-5 space-y-5 pt-4">
          {applicable.map(req => {
            const vaccine = VACCINES.find(v => v.id === req.vaccineId)!
            const entry = doseDates.find(d => d.vaccineId === req.vaccineId)
            const dates = entry?.dates ?? Array(req.minDoses).fill(null)

            return (
              <div key={req.vaccineId}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${vaccine.color}`} />
                  <span className="font-medium text-sm text-gray-800">{vaccine.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: req.minDoses }, (_, i) => {
                    const val = dates[i]
                    const dateStr = val instanceof Date
                      ? val.toISOString().split('T')[0]
                      : ''
                    return (
                      <div key={i}>
                        <label className="block text-xs text-gray-500 mb-1">Dosis {i + 1}</label>
                        <input
                          type="date"
                          value={dateStr}
                          onChange={e =>
                            onChange(req.vaccineId, i, e.target.value ? new Date(e.target.value) : null)
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
