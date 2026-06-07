import { useState } from 'react'
import type {
  PatientData, VaccinationInput, VaccinationResult,
  VaccineId, DoseCount, DoseWithDate,
} from './types'
import { PatientForm } from './components/PatientForm'
import { VaccineStatusGrid } from './components/VaccineStatusGrid'
import { DoseDateInputs } from './components/DoseDateInputs'
import { ResultPanel } from './components/ResultPanel'
import { getRequirements } from './engine/requirementEngine'
import { evaluatePatient } from './engine/vaccineEngine'
import { calculateAge } from './engine/ageCalculator'

type Step = 'patient' | 'status' | 'result'

const STEP_LABELS = ['Paciente', 'Vacunas', 'Resultado']
const STEP_MAP: Record<Step, number> = { patient: 0, status: 1, result: 2 }

function StepBar({ step }: { step: Step }) {
  const current = STEP_MAP[step]
  return (
    <div className="flex items-center gap-0 mb-1">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current ? 'bg-blue-600 text-white' :
              i === current ? 'bg-white text-blue-700 ring-2 ring-blue-600' :
              'bg-blue-800 text-blue-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${i === current ? 'text-white' : 'text-blue-300'}`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-blue-400' : 'bg-blue-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState<Step>('patient')
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [doseCounts, setDoseCounts] = useState<DoseCount[]>([])
  const [doseDates, setDoseDates] = useState<DoseWithDate[]>([])
  const [result, setResult] = useState<VaccinationResult | null>(null)

  function handlePatientSubmit(data: PatientData) {
    const reqs = getRequirements(data)
    setPatient(data)
    setDoseCounts(reqs.map(r => ({ vaccineId: r.vaccineId, count: 0 })))
    setDoseDates(reqs.map(r => ({ vaccineId: r.vaccineId, dates: [] })))
    setStep('status')
  }

  function handleDoseCountChange(vaccineId: VaccineId, count: number) {
    setDoseCounts(prev => prev.map(d => d.vaccineId === vaccineId ? { ...d, count } : d))
  }

  function handleDoseDateChange(vaccineId: VaccineId, doseIndex: number, date: Date | null) {
    setDoseDates(prev => prev.map(d => {
      if (d.vaccineId !== vaccineId) return d
      const newDates = [...d.dates]
      newDates[doseIndex] = date
      return { ...d, dates: newDates }
    }))
  }

  function handleCalculate() {
    if (!patient) return
    const hasDates = doseDates.some(d => d.dates.some(Boolean))
    const input: VaccinationInput = {
      mode: hasDates ? 'dates' : 'count',
      doseCounts,
      doseDates,
    }
    setResult(evaluatePatient(patient, input))
    setStep('result')
  }

  function handleReset() {
    setStep('patient')
    setPatient(null)
    setDoseCounts([])
    setDoseDates([])
    setResult(null)
  }

  const requirements = patient ? getRequirements(patient) : []
  const ageData = patient ? calculateAge(patient.birthDate, patient.evaluationDate) : null

  const ageLabel = ageData
    ? ageData.years > 0
      ? `${ageData.years}a${ageData.months % 12 > 0 ? ` ${ageData.months % 12}m` : ''}`
      : ageData.months > 0
      ? `${ageData.months} meses`
      : `${ageData.weeks} semanas`
    : ''

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header con identidad y barra de progreso */}
      <header className="bg-blue-700 text-white px-4 pt-4 pb-5 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-none">PautaVac</h1>
              <p className="text-blue-300 text-xs mt-0.5">Calendarios vacunales · Andalucía 2026</p>
            </div>
            {step !== 'patient' && (
              <button
                onClick={handleReset}
                className="text-xs text-blue-300 border border-blue-500 rounded-lg px-3 py-1.5 hover:bg-blue-600 transition-colors"
              >
                Nueva consulta
              </button>
            )}
          </div>
          <StepBar step={step} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ─── Paso 1: Datos del paciente ─── */}
        {step === 'patient' && (
          <>
            <PatientForm onSubmit={handlePatientSubmit} />
            <p className="text-center text-xs text-gray-400 pb-2">
              Basado en el Calendario de Vacunaciones e Inmunizaciones de Andalucía 2026
              · Junta de Andalucía, Consejería de Sanidad
            </p>
          </>
        )}

        {/* ─── Paso 2: Estado vacunal ─── */}
        {step === 'status' && patient && ageData && (
          <>
            {/* Chip de paciente */}
            <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {ageLabel}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Marca las dosis recibidas</p>
                <p className="text-xs text-gray-400">Pulsa el número de dosis que ya tiene puestas</p>
              </div>
            </div>

            <VaccineStatusGrid
              requirements={requirements}
              doseCounts={doseCounts}
              onChange={handleDoseCountChange}
            />

            <DoseDateInputs
              requirements={requirements}
              doseDates={doseDates}
              onChange={handleDoseDateChange}
            />

            {/* CTA principal — grande y claro */}
            <div className="sticky bottom-4 z-10">
              <button
                type="button"
                onClick={handleCalculate}
                className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xl"
              >
                Ver qué vacunas poner hoy →
              </button>
            </div>
          </>
        )}

        {/* ─── Paso 3: Resultado ─── */}
        {step === 'result' && result && (
          <ResultPanel result={result} onReset={handleReset} />
        )}

      </main>
    </div>
  )
}
