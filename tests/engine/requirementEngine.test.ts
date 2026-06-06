import { describe, it, expect } from 'vitest'
import { getRequirements } from '../../src/engine/requirementEngine'
import { PatientData } from '../../src/types'

function makePatient(
  birthDate: string,
  evalDate: string,
  sex: 'M' | 'F' = 'M',
  conditions: any[] = []
): PatientData {
  return { birthDate: new Date(birthDate), sex, evaluationDate: new Date(evalDate), conditions }
}

function get(reqs: ReturnType<typeof getRequirements>, id: string) {
  const r = reqs.find(r => r.vaccineId === id)
  if (!r) throw new Error(`Vacuna no encontrada: ${id}`)
  return r
}

// ── Menores de 7 años: 15 meses ───────────────────────────────────────────────
describe('under7 — 15 meses', () => {
  const reqs = getRequirements(makePatient('2024-01-01', '2025-04-15'))

  it('DTPa: 3 dosis', () => expect(get(reqs, 'dtpa').minDoses).toBe(3))
  it('HepB: 3 dosis', () => expect(get(reqs, 'hepb').minDoses).toBe(3))
  it('Polio: 3 dosis (<24 meses pauta 2+1)', () => expect(get(reqs, 'polio').minDoses).toBe(3))
  it('HiB: 1 dosis (15-59 meses)', () => expect(get(reqs, 'hib').minDoses).toBe(1))
  it('Neumococo: 2 dosis (12-23 meses)', () => expect(get(reqs, 'pneumo').minDoses).toBe(2))
  it('TV: 1 dosis (<24 meses)', () => expect(get(reqs, 'mmr').minDoses).toBe(1))
  it('VVZ: 1 dosis (<24 meses)', () => expect(get(reqs, 'varicella').minDoses).toBe(1))
  it('Rotavirus: no aplicable (>24 semanas de vida)', () => {
    expect(get(reqs, 'rotavirus').applicable).toBe(false)
  })
  it('Tdpa: no aplicable en <7 años', () => expect(get(reqs, 'tdtdpa').applicable).toBe(false))
  it('VPH: no aplicable en <7 años', () => expect(get(reqs, 'hpv').applicable).toBe(false))
})

// ── Menores de 7 años: 3 años ─────────────────────────────────────────────────
describe('under7 — 3 años (36 meses)', () => {
  const reqs = getRequirements(makePatient('2022-06-15', '2025-06-15'))

  it('Polio: 4 dosis (≥24 meses pauta 2+1 + refuerzo 6 años)', () => {
    expect(get(reqs, 'polio').minDoses).toBe(4)
  })
  it('TV: 2 dosis (≥24 meses)', () => expect(get(reqs, 'mmr').minDoses).toBe(2))
  it('VVZ: 2 dosis (≥24 meses)', () => expect(get(reqs, 'varicella').minDoses).toBe(2))
  it('HiB: 1 dosis (15-59 meses)', () => expect(get(reqs, 'hib').minDoses).toBe(1))
  it('Neumococo: 1 dosis (24-59 meses)', () => expect(get(reqs, 'pneumo').minDoses).toBe(1))
})

// ── Rotavirus — límites por semanas de vida ───────────────────────────────────
describe('Rotavirus — semanas de vida', () => {
  it('aplicable para bebé de 9 semanas (~63 días)', () => {
    const reqs = getRequirements(makePatient('2025-01-01', '2025-03-10'))
    expect(get(reqs, 'rotavirus').applicable).toBe(true)
    expect(get(reqs, 'rotavirus').minDoses).toBe(2)
  })

  it('NO aplicable para bebé de 25 semanas (>24 semanas de vida)', () => {
    const reqs = getRequirements(makePatient('2024-01-01', '2024-07-01'))
    expect(get(reqs, 'rotavirus').applicable).toBe(false)
  })
})

// ── Meningococo B — corte por fecha de nacimiento ─────────────────────────────
describe('MenB — nacido antes/después 1/10/2021', () => {
  it('NO aplica si nació el 30/09/2021 (antes del corte)', () => {
    const reqs = getRequirements(makePatient('2021-09-30', '2022-06-01'))
    expect(get(reqs, 'menb').applicable).toBe(false)
  })

  it('SÍ aplica si nació el 01/10/2021 (en el corte)', () => {
    const reqs = getRequirements(makePatient('2021-10-01', '2022-06-01'))
    expect(get(reqs, 'menb').applicable).toBe(true)
  })

  it('MenB <24 meses: 3 dosis', () => {
    const reqs = getRequirements(makePatient('2024-01-01', '2025-06-01'))
    expect(get(reqs, 'menb').minDoses).toBe(3)
  })

  it('MenB 24-72 meses: 2 dosis', () => {
    const reqs = getRequirements(makePatient('2022-01-01', '2025-06-15'))
    expect(get(reqs, 'menb').minDoses).toBe(2)
  })

  it('MenB >6 años: no aplicable (solo grupos de riesgo fuera del sistemático)', () => {
    const reqs = getRequirements(makePatient('2016-01-01', '2025-06-15'))
    expect(get(reqs, 'menb').applicable).toBe(false)
  })
})

// ── HiB — dosis según edad ────────────────────────────────────────────────────
describe('HiB — dosis según edad', () => {
  it('<12 meses: 3 dosis (primovacunación completa)', () => {
    const reqs = getRequirements(makePatient('2025-01-01', '2025-09-01')) // 8 meses
    expect(get(reqs, 'hib').minDoses).toBe(3)
  })

  it('12-14 meses: 2 dosis', () => {
    const reqs = getRequirements(makePatient('2024-01-01', '2025-02-01')) // 13 meses
    expect(get(reqs, 'hib').minDoses).toBe(2)
  })

  it('15-59 meses: 1 dosis', () => {
    const reqs = getRequirements(makePatient('2022-01-01', '2025-01-15')) // 36 meses
    expect(get(reqs, 'hib').minDoses).toBe(1)
  })

  it('≥60 meses: no aplicable (sólo riesgo)', () => {
    const reqs = getRequirements(makePatient('2019-01-01', '2025-06-01')) // 77 meses
    expect(get(reqs, 'hib').applicable).toBe(false)
  })
})

// ── 7 a 18 años ───────────────────────────────────────────────────────────────
describe('7to18 — 12 años', () => {
  const reqs = getRequirements(makePatient('2013-06-15', '2025-06-15'))

  it('Td/Tdpa: 5 dosis (3 primovac + 2 recuerdos)', () => {
    expect(get(reqs, 'tdtdpa').minDoses).toBe(5)
  })
  it('Polio: 3 dosis', () => expect(get(reqs, 'polio').minDoses).toBe(3))
  it('HepB: 3 dosis (7-18 años)', () => expect(get(reqs, 'hepb').minDoses).toBe(3))
  it('TV: 2 dosis', () => expect(get(reqs, 'mmr').minDoses).toBe(2))
  it('VVZ: 2 dosis', () => expect(get(reqs, 'varicella').minDoses).toBe(2))
  it('VPH: 1 dosis (12-21 años)', () => expect(get(reqs, 'hpv').minDoses).toBe(1))
  it('MenACWY: 1 dosis', () => expect(get(reqs, 'menacwy').minDoses).toBe(1))
  it('DTPa: no aplicable (≥7 años)', () => expect(get(reqs, 'dtpa').applicable).toBe(false))
})

// ── VPH — inmunosupresión ─────────────────────────────────────────────────────
describe('VPH — condiciones', () => {
  it('1 dosis en 12-21 años sin inmunosupresión', () => {
    const reqs = getRequirements(makePatient('2013-01-01', '2025-06-01'))
    expect(get(reqs, 'hpv').minDoses).toBe(1)
  })

  it('3 dosis si inmunosupresión (pauta 0-2-6 meses)', () => {
    const reqs = getRequirements(
      makePatient('2013-01-01', '2025-06-01', 'F', ['immunosuppression'])
    )
    expect(get(reqs, 'hpv').minDoses).toBe(3)
  })
})
