import { render, screen, within } from '@testing-library/react'
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

function makePatient(birthDate: string, evalDate: string): PatientData {
  return {
    birthDate: new Date(birthDate),
    evaluationDate: new Date(evalDate),
    sex: 'M',
    conditions: [],
  }
}

function countInput(counts: Partial<Record<VaccineId, number>>): VaccinationInput {
  return {
    mode: 'count',
    doseCounts: ALL_IDS.map(vaccineId => ({ vaccineId, count: counts[vaccineId] ?? 0 })),
    doseDates: [],
  }
}

function mostlyComplete(overrides: Partial<Record<VaccineId, number>> = {}): VaccinationInput {
  return countInput({
    dtpa: 4,
    hepb: 3,
    polio: 4,
    hib: 1,
    pneumo: 1,
    menb: 2,
    menacwy: 2,
    mmr: 2,
    varicella: 2,
    rotavirus: 0,
    tdtdpa: 0,
    hpv: 0,
    ...overrides,
  })
}

function renderResult(patient: PatientData, input: VaccinationInput) {
  return render(<ResultPanel result={evaluatePatient(patient, input)} />)
}

function todayCard() {
  return screen.getByText('Administrar hoy').closest('div')
}

describe('ResultPanel - casos prioritarios visibles', () => {
  it('2 meses con 0 dosis muestra calendario al dia, 7 vacunas hoy y sin aviso de atenuadas por RV', () => {
    renderResult(makePatient('2026-04-08', '2026-06-08'), countInput({}))

    expect(screen.getByText('Calendario al día')).toBeInTheDocument()
    expect(screen.getByText(/Hoy toca administrar/)).toBeInTheDocument()

    const card = todayCard()
    expect(card).not.toBeNull()
    const inCard = within(card!)
    for (const label of ['DTPa', 'HepB', 'Polio', 'HiB', 'VNC20', 'MenB', 'RV']) {
      expect(inCard.getByText(label)).toBeInTheDocument()
    }
    expect(screen.queryByText(/Vacunas atenuadas presentes/)).not.toBeInTheDocument()
  })

  it('5 meses con 2 hexavalentes no muestra DTPa/HepB/Polio/HiB en Administrar hoy', () => {
    renderResult(
      makePatient('2026-01-08', '2026-06-08'),
      countInput({
        dtpa: 2,
        hepb: 2,
        polio: 2,
        hib: 2,
      })
    )

    const card = todayCard()
    expect(card).not.toBeNull()
    expect(card).toHaveTextContent('VNC20')
    expect(card).toHaveTextContent('MenACWY')
    expect(card).toHaveTextContent('MenB')
    expect(card).not.toHaveTextContent('DTPa')
    expect(card).not.toHaveTextContent('HepB')
    expect(card).not.toHaveTextContent('Polio')
    expect(card).not.toHaveTextContent('HiB')
  })

  it('3 anos con 1 VNC20 sin fecha muestra revisar antes de administrar', () => {
    renderResult(
      makePatient('2023-06-08', '2026-06-08'),
      mostlyComplete({ pneumo: 1 })
    )

    expect(screen.getByText('Revisar antes de administrar')).toBeInTheDocument()
    expect(screen.getByText(/VNC20:/)).toBeInTheDocument()
    expect(screen.getByText(/Confirmar fecha/)).toBeInTheDocument()
  })

  it('22 semanas con 0 RV muestra aviso especifico y no tarjeta de administrar hoy por RV', () => {
    renderResult(
      makePatient('2026-01-05', '2026-06-08'),
      countInput({
        dtpa: 2,
        hepb: 2,
        polio: 2,
        hib: 2,
        pneumo: 2,
        menb: 2,
        menacwy: 1,
      })
    )

    expect(screen.getByText('Rotavirus: revisar antes de administrar')).toBeInTheDocument()
    expect(screen.getByText(/La pauta Rotarix debe poder completarse antes de las 24 semanas/)).toBeInTheDocument()
    expect(screen.queryByText('Administrar hoy')).not.toBeInTheDocument()
    expect(screen.queryByText(/Vacunas atenuadas presentes/)).not.toBeInTheDocument()
  })
})
