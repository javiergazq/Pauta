import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultPanel } from '../../src/components/ResultPanel'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import type { PatientData, VaccinationInput, VaccineId } from '../../src/types'

const ALL_IDS: VaccineId[] = [
  'dtpa',
  'hepb',
  'polio',
  'hib',
  'pneumo',
  'menb',
  'menacwy',
  'mmr',
  'varicella',
  'rotavirus',
  'tdtdpa',
  'hpv',
]

function resultWithConditions(conditions: PatientData['conditions']) {
  const patient: PatientData = {
    birthDate: new Date('2023-06-08'),
    evaluationDate: new Date('2026-06-08'),
    sex: 'M',
    conditions,
  }
  const input: VaccinationInput = {
    mode: 'count',
    doseCounts: ALL_IDS.map(vaccineId => ({ vaccineId, count: 0 })),
    doseDates: [],
  }
  return evaluatePatient(patient, input)
}

describe('Condition warnings in ResultPanel', () => {
  it('shows selected special-condition warnings before the vaccination plan', () => {
    render(<ResultPanel result={resultWithConditions(['asplenia'])} />)

    expect(screen.getByText('Avisos por condiciones especiales')).toBeInTheDocument()
    expect(screen.getByText(/puede requerir pautas específicas/)).toBeInTheDocument()
    expect(screen.getByText(/Revisar protocolo/)).toBeInTheDocument()
  })

  it('shows critical live-vaccine caution for severe immunosuppression', () => {
    render(<ResultPanel result={resultWithConditions(['severe_immunosuppression'])} />)

    expect(screen.getByText('Avisos por condiciones especiales')).toBeInTheDocument()
    expect(screen.getByText('Precaución con vacunas vivas')).toBeInTheDocument()
    expect(screen.getAllByText(/TV y varicela pueden estar contraindicadas/).length).toBeGreaterThan(0)
  })

  it('includes undocumented dose warning in the Diraya note', () => {
    render(<ResultPanel result={resultWithConditions(['undocumented_doses'])} />)

    expect(screen.getByText(/Nota: existen dosis previas no documentadas/)).toBeInTheDocument()
  })
})
