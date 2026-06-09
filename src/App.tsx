import { useState } from 'react'
import { Check, ArrowRight } from '@phosphor-icons/react'
import type {
  PatientData, VaccinationInput, VaccinationResult,
  VaccineId, DoseCount, DoseWithDate,
} from './types'
import { PatientForm } from './components/PatientForm'
import { VaccineStatusGrid } from './components/VaccineStatusGrid'
import { DoseDateInputs } from './components/DoseDateInputs'
import { ResultPanel } from './components/ResultPanel'
import { LegalNotice } from './components/LegalNotice'
import { getRequirements } from './engine/requirementEngine'
import { evaluatePatient } from './engine/vaccineEngine'
import { calculateAge } from './engine/ageCalculator'

type Step = 'patient' | 'status' | 'result'

const STEP_LABELS = ['Paciente', 'Vacunas', 'Resultado']
const STEP_MAP: Record<Step, number> = { patient: 0, status: 1, result: 2 }

function StepBar({ step }: { step: Step }) {
  const current = STEP_MAP[step]
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex min-w-0 flex-1 items-center">
          <div className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-1.5 py-2 transition-colors sm:justify-start sm:px-2.5 ${
            i < current ? 'bg-[var(--pauta-aqua-soft)] text-[var(--pauta-navy)]' :
            i === current ? 'bg-[var(--pauta-navy)] text-white shadow-sm' :
            'bg-slate-100 text-slate-500'
          }`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
              i < current ? 'bg-[var(--pauta-aqua)] text-white' :
              i === current ? 'bg-white text-[var(--pauta-navy)]' :
              'bg-white text-slate-400'
            }`}>
              {i < current ? <Check size={14} weight="bold" /> : i + 1}
            </div>
            <span className="hidden truncate text-xs font-semibold sm:inline">{label}</span>
          </div>
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

  const ageChip = ageData
    ? ageData.years > 0
      ? `${ageData.years}a${ageData.months % 12 > 0 ? `${ageData.months % 12}m` : ''}`
      : ageData.months > 0
      ? `${ageData.months}m`
      : `${ageData.weeks}sem`
    : ''

  const ageLabel = ageData
    ? ageData.years > 0
      ? `${ageData.years} año${ageData.years > 1 ? 's' : ''}${ageData.months % 12 > 0 ? ` ${ageData.months % 12} m` : ''}`
      : ageData.months > 0
      ? `${ageData.months} meses`
      : `${ageData.weeks} semanas`
    : ''

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-[var(--pauta-border)] bg-white/92 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <img
                src="/pauta-logo.png"
                alt="Pauta"
                className="h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[190px]"
              />
              <p className="mt-1 truncate text-xs font-medium text-slate-500">Calendarios vacunales · Andalucía 2026</p>
            </div>
            {step !== 'patient' && (
              <button
                onClick={handleReset}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <span className="sm:hidden">Nueva</span>
                <span className="hidden sm:inline">Nueva consulta</span>
              </button>
            )}
          </div>
          <StepBar step={step} />
        </div>
      </header>

      <main className={`mx-auto px-3 py-4 sm:px-4 sm:py-8 ${step === 'patient' ? 'max-w-4xl' : 'max-w-3xl'}`}>
        {step === 'patient' && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white/85 px-3 py-3 shadow-sm sm:px-5 sm:py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-[var(--pauta-navy)] sm:text-lg">Nueva valoración vacunal</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                    Datos mínimos del paciente y revisión de condiciones especiales solo cuando proceda.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 text-center text-[11px] font-bold text-slate-600 sm:min-w-72">
                  <span className="rounded-lg bg-white px-2 py-1.5 text-slate-900 shadow-sm">Paciente</span>
                  <span className="px-2 py-1.5">Dosis</span>
                  <span className="px-2 py-1.5">Resultado</span>
                </div>
              </div>
            </section>
            <PatientForm onSubmit={handlePatientSubmit} />
          </div>
        )}

        {step === 'status' && patient && ageData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-3 shadow-sm ring-1 ring-slate-200/70 sm:px-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--pauta-aqua-soft)] text-center text-xs font-black leading-tight text-[var(--pauta-navy)]">
                {ageChip}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Paciente de {ageLabel}</p>
                <p className="text-xs text-slate-500">Indica el número de dosis recibidas de cada vacuna</p>
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

            <div className="sticky bottom-3 z-10 sm:bottom-4">
              <button
                type="button"
                onClick={handleCalculate}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pauta-navy)] px-3 py-4 text-base font-black text-white shadow-[0_18px_45px_rgba(3,47,88,0.24)] transition hover:bg-[var(--pauta-navy-dark)] active:scale-[0.99] sm:text-lg"
              >
                Ver qué vacunas poner hoy
                <ArrowRight size={20} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <ResultPanel result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-2 text-center text-xs leading-5 text-slate-500">
        <p>Basado en el Calendario de Vacunaciones e Inmunizaciones de Andalucía 2026 · Junta de Andalucía, Consejería de Sanidad</p>
        <p>Javier Gázquez García · Enfermero, Almería</p>
        <p><LegalNotice /></p>
      </footer>
    </div>
  )
}
