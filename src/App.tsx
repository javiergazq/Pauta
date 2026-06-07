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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white py-4 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">VacunaCheck Andalucía</h1>
          <p className="text-blue-200 text-sm">Calendarios acelerados · ANDAVAC 2026</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {step === 'patient' && (
          <PatientForm onSubmit={handlePatientSubmit} />
        )}

        {step === 'status' && patient && ageData && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex justify-between items-center">
              <span>
                Paciente de{' '}
                <strong>
                  {ageData.years > 0 && `${ageData.years}a `}
                  {ageData.months % 12 > 0 && `${ageData.months % 12}m`}
                  {ageData.years === 0 && ageData.months === 0 && `${ageData.weeks} semanas`}
                </strong>
                {' '}· Marca las dosis recibidas
              </span>
              <button onClick={handleReset} className="text-blue-400 underline text-xs ml-4">
                Volver
              </button>
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

            <button
              type="button"
              onClick={handleCalculate}
              className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
            >
              Calcular plan de vacunación →
            </button>
          </>
        )}

        {step === 'result' && result && (
          <ResultPanel result={result} onReset={handleReset} />
        )}

      </main>
    </div>
  )
}
