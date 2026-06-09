import { describe, it, expect } from 'vitest'
import { generateCatchupPlan } from '../../src/engine/catchupEngine'
import type { VaccineId, VaccineStatus } from '../../src/types'

function missing(id: VaccineId, required = 3): VaccineStatus {
  return { vaccineId: id, required, received: 0, valid: 0, missing: required, status: 'missing' }
}

function partial(id: VaccineId, valid: number, required: number): VaccineStatus {
  return { vaccineId: id, required, received: valid, valid, missing: required - valid, status: 'partial' }
}

function complete(id: VaccineId): VaccineStatus {
  return { vaccineId: id, required: 2, received: 2, valid: 2, missing: 0, status: 'complete' }
}

const evalDate = new Date('2025-01-15')

describe('generateCatchupPlan — under7', () => {
  it('incluye DTPa en HOY si falta', () => {
    const plan = generateCatchupPlan([missing('dtpa'), complete('hepb')], 'under7', evalDate)
    const today = plan.find(p => p.label === 'HOY')!
    expect(today.vaccines.some(v => v.vaccineId === 'dtpa')).toBe(true)
  })

  it('NO incluye vacunas completas', () => {
    const plan = generateCatchupPlan([missing('dtpa'), complete('mmr')], 'under7', evalDate)
    const allIds = plan.flatMap(p => p.vaccines.map(v => v.vaccineId))
    expect(allIds).not.toContain('mmr')
  })

  it('plan vacío (solo visitas sin vacunas) si todo completo', () => {
    const plan = generateCatchupPlan([complete('dtpa'), complete('hepb')], 'under7', evalDate)
    expect(plan.every(p => p.vaccines.length === 0)).toBe(true)
  })

  it('offsetDays correctos: HOY=0, +1mes=30, +2meses=60, +8meses=240', () => {
    const plan = generateCatchupPlan([missing('dtpa')], 'under7', evalDate)
    expect(plan.find(p => p.label === 'HOY')!.offsetDays).toBe(0)
    expect(plan.find(p => p.label === '+1 mes')!.offsetDays).toBe(30)
    expect(plan.find(p => p.label === '+2 meses')!.offsetDays).toBe(60)
    expect(plan.find(p => p.label === '+8 meses')!.offsetDays).toBe(240)
  })

  it('minDate calculada correctamente para +2 meses', () => {
    const plan = generateCatchupPlan([missing('dtpa')], 'under7', evalDate)
    const visit2m = plan.find(p => p.label === '+2 meses')!
    if (visit2m.vaccines.length > 0) {
      const expectedDate = new Date('2025-03-16') // 15 enero + 60 días
      expect(visit2m.vaccines[0].minDate.toDateString()).toBe(expectedDate.toDateString())
    }
  })

  it('número de dosis correcto para paciente parcialmente vacunado (1 DTPa válida)', () => {
    const plan = generateCatchupPlan([partial('dtpa', 1, 3)], 'under7', evalDate)
    const today = plan.find(p => p.label === 'HOY')!
    const dtpa = today.vaccines.find(v => v.vaccineId === 'dtpa')!
    expect(dtpa.doseNumber).toBe(2)  // ya tiene 1, la siguiente es la 2ª
  })

  it('no asigna más dosis de las necesarias', () => {
    // Tiene 2 DTPa válidas, necesita 3 → solo falta 1
    const plan = generateCatchupPlan([partial('dtpa', 2, 3)], 'under7', evalDate)
    const dtpaInPlan = plan.flatMap(p => p.vaccines.filter(v => v.vaccineId === 'dtpa'))
    expect(dtpaInPlan).toHaveLength(1)
  })

  it('TV y VVZ aparecen en la misma visita (regla atenuadas)', () => {
    const plan = generateCatchupPlan([missing('mmr', 2), missing('varicella', 2)], 'under7', evalDate)
    // HOY debe contener ambas
    const today = plan.find(p => p.label === 'HOY')!
    const hasTV = today.vaccines.some(v => v.vaccineId === 'mmr')
    const hasVVZ = today.vaccines.some(v => v.vaccineId === 'varicella')
    expect(hasTV && hasVVZ).toBe(true)
  })

  it('hasLiveVaccines=true en visita con TV y VVZ', () => {
    const plan = generateCatchupPlan([missing('mmr', 2), missing('varicella', 2)], 'under7', evalDate)
    const today = plan.find(p => p.label === 'HOY')!
    expect(today.hasLiveVaccines).toBe(true)
  })
})

describe('generateCatchupPlan — 7to18', () => {
  it('Tdpa aparece en HOY, +1 mes y +6 meses', () => {
    const plan = generateCatchupPlan([missing('tdtdpa', 5)], '7to18', evalDate)
    const visits = plan.filter(p => p.vaccines.some(v => v.vaccineId === 'tdtdpa'))
    expect(visits).toHaveLength(3)
  })

  it('VPH solo en HOY (1 dosis)', () => {
    const plan = generateCatchupPlan([missing('hpv', 1)], '7to18', evalDate)
    const hpvVisits = plan.filter(p => p.vaccines.some(v => v.vaccineId === 'hpv'))
    expect(hpvVisits).toHaveLength(1)
    expect(hpvVisits[0].label).toBe('HOY')
  })
})
