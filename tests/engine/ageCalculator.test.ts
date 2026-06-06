import { describe, it, expect } from 'vitest'
import { calculateAge, getAgeGroup } from '../../src/engine/ageCalculator'

describe('calculateAge', () => {
  it('devuelve 0 para evaluación el mismo día del nacimiento', () => {
    const date = new Date('2024-01-01')
    const result = calculateAge(date, date)
    expect(result.days).toBe(0)
    expect(result.months).toBe(0)
    expect(result.years).toBe(0)
    expect(result.group).toBe('under7')
  })

  it('calcula correctamente 6 meses', () => {
    const result = calculateAge(new Date('2024-01-15'), new Date('2024-07-15'))
    expect(result.months).toBe(6)
    expect(result.years).toBe(0)
    expect(result.group).toBe('under7')
  })

  it('calcula correctamente 2 años exactos', () => {
    const result = calculateAge(new Date('2022-01-01'), new Date('2024-01-01'))
    expect(result.months).toBe(24)
    expect(result.years).toBe(2)
  })

  it('calcula semanas correctamente (70 días = 10 semanas)', () => {
    const result = calculateAge(new Date('2024-01-01'), new Date('2024-03-11'))
    expect(result.weeks).toBe(10)
  })

  it('devuelve under7 para 83 meses (6 años 11 meses)', () => {
    const result = calculateAge(new Date('2017-07-01'), new Date('2024-06-01'))
    expect(result.group).toBe('under7')
  })

  it('devuelve 7to18 para exactamente 7 años', () => {
    const result = calculateAge(new Date('2017-01-01'), new Date('2024-01-01'))
    expect(result.group).toBe('7to18')
  })
})

describe('getAgeGroup', () => {
  it('under7 para 0 meses', () => expect(getAgeGroup(0)).toBe('under7'))
  it('under7 para 83 meses (6a 11m)', () => expect(getAgeGroup(83)).toBe('under7'))
  it('7to18 para exactamente 84 meses (7 años)', () => expect(getAgeGroup(84)).toBe('7to18'))
  it('7to18 para 180 meses (15 años)', () => expect(getAgeGroup(180)).toBe('7to18'))
  it('7to18 para 215 meses (17a 11m)', () => expect(getAgeGroup(215)).toBe('7to18'))
  it('7to18 para exactamente 216 meses (18 años)', () => expect(getAgeGroup(216)).toBe('7to18'))
})
