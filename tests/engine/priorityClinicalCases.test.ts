import { describe, expect, it } from 'vitest'
import { evaluatePatient } from '../../src/engine/vaccineEngine'
import type { PatientData, VaccinationInput, VaccinationResult, VaccineId } from '../../src/types'

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

function statusOf(result: VaccinationResult, vaccineId: VaccineId) {
  const status = result.systematicStatuses.find(s => s.vaccineId === vaccineId)
  if (!status) throw new Error(`No status for ${vaccineId}`)
  return status
}

function todayIds(result: VaccinationResult): VaccineId[] {
  return result.catchupPlan.find(p => p.label === 'HOY')?.vaccines.map(v => v.vaccineId) ?? []
}

function plannedIds(result: VaccinationResult): VaccineId[] {
  return result.catchupPlan.flatMap(p => p.vaccines.map(v => v.vaccineId))
}

function assertCoherent(result: VaccinationResult) {
  const today = todayIds(result)
  const planned = plannedIds(result)
  const cautions = new Set(result.vaccineCautions.map(c => c.vaccineId))
  if (result.rotavirusCaution) cautions.add('rotavirus')

  for (const status of result.systematicStatuses) {
    if (status.status === 'up_to_date') {
      expect(today, `${status.vaccineId} is up_to_date but appears today`).not.toContain(status.vaccineId)
    }
    if (status.status === 'due_today') {
      expect(today, `${status.vaccineId} is due_today but not in today's plan`).toContain(status.vaccineId)
    }
    if (status.status === 'overdue') {
      const hasExit = planned.includes(status.vaccineId) || cautions.has(status.vaccineId)
      expect(hasExit, `${status.vaccineId} is overdue without plan or caution`).toBe(true)
    }
  }
}

describe('casos clinicos prioritarios', () => {
  it('1. 5 meses con 2 hexavalentes: hexavalente al dia y no aparece hoy', () => {
    const result = evaluatePatient(
      makePatient('2026-01-08', '2026-06-08'),
      countInput({
        dtpa: 2,
        hepb: 2,
        polio: 2,
        hib: 2,
      })
    )

    for (const id of ['dtpa', 'hepb', 'polio', 'hib'] satisfies VaccineId[]) {
      expect(statusOf(result, id).status).toBe('up_to_date')
      expect(statusOf(result, id).nextEvent?.ageMonths).toBe(11)
      expect(todayIds(result)).not.toContain(id)
      expect(plannedIds(result)).not.toContain(id)
    }
    expect(todayIds(result)).toEqual(expect.arrayContaining(['pneumo', 'menacwy', 'menb']))
    assertCoherent(result)
  })

  it('1b. 5 meses con 0 MenB: segunda dosis no antes de 8 semanas y sin refuerzo a +2 meses', () => {
    const result = evaluatePatient(
      makePatient('2026-01-08', '2026-06-08'),
      countInput({
        dtpa: 2,
        hepb: 2,
        polio: 2,
        hib: 2,
      })
    )

    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 1 })]))
    expect(result.catchupPlan.find(p => p.label === '+1 mes')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb' })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 2 })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
    expect(result.catchupPlan.find(p => p.label === '+8 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
  })

  it('2. 24 meses con 1 Hib: Hib esta al dia y no entra en plan', () => {
    const result = evaluatePatient(
      makePatient('2024-06-08', '2026-06-08'),
      mostlyComplete({ hib: 1 })
    )

    expect(statusOf(result, 'hib').status).toBe('up_to_date')
    expect(todayIds(result)).not.toContain('hib')
    expect(plannedIds(result)).not.toContain('hib')
    assertCoherent(result)
  })

  it('3. 3 anos con 0 MenB nacido tras 01/10/2021: MenB hoy y segunda en +1 mes', () => {
    const result = evaluatePatient(
      makePatient('2023-06-08', '2026-06-08'),
      mostlyComplete({ menb: 0 })
    )

    expect(statusOf(result, 'menb').status).toBe('overdue')
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 1 })]))
    expect(result.catchupPlan.find(p => p.label === '+1 mes')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 2 })]))
    assertCoherent(result)
  })

  it('4. 3 anos y 1 mes con 1 varicela: VVZ toca hoy y no esta retrasada', () => {
    const result = evaluatePatient(
      makePatient('2023-05-08', '2026-06-08'),
      mostlyComplete({ mmr: 1, varicella: 1 })
    )

    expect(statusOf(result, 'varicella').status).toBe('due_today')
    expect(statusOf(result, 'varicella').nextEvent?.dose).toBe(2)
    expect(todayIds(result)).toEqual(expect.arrayContaining(['mmr', 'varicella']))
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.hasLiveVaccines).toBe(true)
    assertCoherent(result)
  })

  it('5. 3 anos con 1 VNC20 sin fecha: no queda en limbo y muestra cautela', () => {
    const result = evaluatePatient(
      makePatient('2023-06-08', '2026-06-08'),
      mostlyComplete({ pneumo: 1 })
    )

    expect(statusOf(result, 'pneumo').status).toBe('up_to_date')
    expect(todayIds(result)).not.toContain('pneumo')
    expect(plannedIds(result)).not.toContain('pneumo')
    expect(result.vaccineCautions).toEqual(
      expect.arrayContaining([expect.objectContaining({ vaccineId: 'pneumo' })])
    )
    assertCoherent(result)
  })

  it('6. 22 semanas con 0 rotavirus: no recomienda RV automaticamente y muestra aviso especifico', () => {
    const result = evaluatePatient(
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

    expect(todayIds(result)).not.toContain('rotavirus')
    expect(plannedIds(result)).not.toContain('rotavirus')
    expect(result.rotavirusCaution).toMatch(/Rotavirus/)
    expect(result.catchupPlan.every(p => !p.hasLiveVaccines)).toBe(true)
    assertCoherent(result)
  })
})

describe('bloque 1 - calendario sistematico normal', () => {
  it('1. 2 meses exactos con 0 dosis: calendario al dia y hoy tocan 7 vacunas', () => {
    const result = evaluatePatient(
      makePatient('2026-04-08', '2026-06-08'),
      countInput({})
    )

    expect(result.isUpToDate).toBe(true)
    expect(result.hasDueToday).toBe(true)
    expect(todayIds(result)).toEqual(expect.arrayContaining([
      'dtpa',
      'hepb',
      'polio',
      'hib',
      'pneumo',
      'menb',
      'rotavirus',
    ] satisfies VaccineId[]))
    expect(todayIds(result)).not.toContain('menacwy')
    expect(result.systematicStatuses.filter(s => s.status === 'up_to_date')).toHaveLength(0)
    expect(result.systematicStatuses.filter(s => s.status === 'due_today')).toHaveLength(7)
    expect(result.systematicStatuses.filter(s => s.status === 'overdue')).toHaveLength(0)
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.hasLiveVaccines).toBe(false)
    assertCoherent(result)
  })

  it('2. 4 meses exactos con 0 dosis: 7 retrasadas y MenACWY toca hoy', () => {
    const result = evaluatePatient(
      makePatient('2026-02-08', '2026-06-08'),
      countInput({})
    )

    expect(statusOf(result, 'menacwy').status).toBe('due_today')
    for (const id of ['dtpa', 'hepb', 'polio', 'hib', 'pneumo', 'menb', 'rotavirus'] satisfies VaccineId[]) {
      expect(statusOf(result, id).status).toBe('overdue')
    }
    expect(result.systematicStatuses.filter(s => s.status === 'due_today')).toHaveLength(1)
    expect(result.systematicStatuses.filter(s => s.status === 'overdue')).toHaveLength(7)
    expect(todayIds(result)).toEqual(expect.arrayContaining([
      'dtpa',
      'hepb',
      'polio',
      'hib',
      'pneumo',
      'menacwy',
      'menb',
      'rotavirus',
    ] satisfies VaccineId[]))
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.hasLiveVaccines).toBe(false)
    assertCoherent(result)
  })
})

describe('bloque 2 - rescate real', () => {
  it('4. 7 meses con 1 hexavalente: administra segunda hexavalente y rescates indicados', () => {
    const result = evaluatePatient(
      makePatient('2025-11-08', '2026-06-08'),
      countInput({
        dtpa: 1,
        hepb: 1,
        polio: 1,
        hib: 1,
      })
    )

    expect(todayIds(result)).toEqual(expect.arrayContaining([
      'dtpa',
      'hepb',
      'polio',
      'hib',
      'pneumo',
      'menacwy',
      'menb',
    ] satisfies VaccineId[]))
    expect(todayIds(result)).not.toContain('rotavirus')
    expect(plannedIds(result)).toEqual(expect.arrayContaining(['dtpa', 'hepb', 'polio', 'hib'] satisfies VaccineId[]))
    assertCoherent(result)
  })

  it('4b. 7 meses con 0 MenB: segunda dosis no antes de 8 semanas y refuerzo mas adelante', () => {
    const result = evaluatePatient(
      makePatient('2025-11-08', '2026-06-08'),
      countInput({
        dtpa: 1,
        hepb: 1,
        polio: 1,
        hib: 1,
      })
    )

    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 1 })]))
    expect(result.catchupPlan.find(p => p.label === '+1 mes')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb' })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 2 })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
    expect(result.catchupPlan.find(p => p.label === '+8 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
    assertCoherent(result)
  })

  it('6. 3 anos con 0 VNC20: VNC20 retrasada y se administra hoy', () => {
    const result = evaluatePatient(
      makePatient('2023-06-08', '2026-06-08'),
      mostlyComplete({ pneumo: 0 })
    )

    expect(statusOf(result, 'pneumo').status).toBe('overdue')
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'pneumo', doseNumber: 1 })]))
    assertCoherent(result)
  })
})

describe('bloque 3 - MenB', () => {
  it('8b. 19 meses con 0 MenB: segunda dosis a +2 meses y refuerzo mucho mas adelante', () => {
    const result = evaluatePatient(
      makePatient('2024-11-08', '2026-06-08'),
      mostlyComplete({ menb: 0 })
    )

    expect(result.catchupPlan.find(p => p.label === 'HOY')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 1 })]))
    expect(result.catchupPlan.find(p => p.label === '+1 mes')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb' })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 2 })]))
    expect(result.catchupPlan.find(p => p.label === '+2 meses')?.vaccines)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
    expect(result.catchupPlan.find(p => p.label === '+14 meses')?.vaccines)
      .toEqual(expect.arrayContaining([expect.objectContaining({ vaccineId: 'menb', doseNumber: 3 })]))
    assertCoherent(result)
  })

  it('9. 3 anos con 1 MenB nacido tras 01/10/2021: no desaparece y pide confirmar intervalo por recuento', () => {
    const result = evaluatePatient(
      makePatient('2023-06-08', '2026-06-08'),
      mostlyComplete({ menb: 1 })
    )

    expect(statusOf(result, 'menb').status).toBe('overdue')
    expect(plannedIds(result)).toContain('menb')
    expect(result.countMode).toBe(true)
    assertCoherent(result)
  })

  it('10. 3 anos con 0 MenB nacido antes de 01/10/2021 y sin riesgo: MenB no aplicable', () => {
    const result = evaluatePatient(
      makePatient('2021-09-30', '2024-09-30'),
      countInput({})
    )

    expect(statusOf(result, 'menb').status).toBe('not_applicable')
    expect(todayIds(result)).not.toContain('menb')
    expect(plannedIds(result)).not.toContain('menb')
    assertCoherent(result)
  })
})

describe('bloque 4 - TV y varicela', () => {
  it('11. 18 meses con 1 TV: TV al dia con proxima a 24 meses', () => {
    const result = evaluatePatient(
      makePatient('2024-12-08', '2026-06-08'),
      mostlyComplete({ mmr: 1 })
    )

    expect(statusOf(result, 'mmr').status).toBe('up_to_date')
    expect(statusOf(result, 'mmr').nextEvent?.ageMonths).toBe(24)
    expect(todayIds(result)).not.toContain('mmr')
    assertCoherent(result)
  })

  it('12. 30 meses con 1 TV: segunda TV toca hoy durante transicion 2026', () => {
    const result = evaluatePatient(
      makePatient('2023-12-08', '2026-06-08'),
      mostlyComplete({ mmr: 1 })
    )

    expect(statusOf(result, 'mmr').status).toBe('due_today')
    expect(statusOf(result, 'mmr').nextEvent?.dose).toBe(2)
    expect(todayIds(result)).toContain('mmr')
    assertCoherent(result)
  })

  it('14. 4 anos con 1 varicela: segunda VVZ retrasada y aparece en plan', () => {
    const result = evaluatePatient(
      makePatient('2022-06-08', '2026-06-08'),
      mostlyComplete({ varicella: 1 })
    )

    expect(statusOf(result, 'varicella').status).toBe('overdue')
    expect(plannedIds(result)).toContain('varicella')
    assertCoherent(result)
  })
})

describe('bloque 5 - rotavirus', () => {
  it('15. 18 semanas con 0 RV: RV puede aparecer hoy y no activa aviso generico de atenuadas', () => {
    const result = evaluatePatient(
      makePatient('2026-02-02', '2026-06-08'),
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

    expect(todayIds(result)).toContain('rotavirus')
    expect(result.rotavirusCaution).toBeNull()
    expect(result.catchupPlan.find(p => p.label === 'HOY')?.hasLiveVaccines).toBe(false)
    assertCoherent(result)
  })

  it('17. 23 semanas con 1 RV sin fecha: no recomienda automaticamente y pide confirmar fecha', () => {
    const result = evaluatePatient(
      makePatient('2025-12-29', '2026-06-08'),
      countInput({
        dtpa: 2,
        hepb: 2,
        polio: 2,
        hib: 2,
        pneumo: 2,
        menb: 2,
        menacwy: 1,
        rotavirus: 1,
      })
    )

    expect(todayIds(result)).not.toContain('rotavirus')
    expect(plannedIds(result)).not.toContain('rotavirus')
    expect(result.rotavirusCaution).toMatch(/fecha exacta/)
    expect(result.rotavirusCaution).toMatch(/24 semanas/)
    expect(result.catchupPlan.every(p => !p.hasLiveVaccines)).toBe(true)
    assertCoherent(result)
  })

  it('18. 25 semanas con 0 RV: RV queda fuera de indicacion automatica y no activa aviso de atenuadas', () => {
    const result = evaluatePatient(
      makePatient('2025-12-15', '2026-06-08'),
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

    expect(statusOf(result, 'rotavirus').status).toBe('not_applicable')
    expect(todayIds(result)).not.toContain('rotavirus')
    expect(plannedIds(result)).not.toContain('rotavirus')
    expect(result.catchupPlan.every(p => !p.hasLiveVaccines)).toBe(true)
    assertCoherent(result)
  })
})
