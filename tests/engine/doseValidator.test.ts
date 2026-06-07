import { describe, it, expect } from 'vitest'
import { validateDoses, countValidDoses } from '../../src/engine/doseValidator'

const DTPA = [42, 56, 180]  // intervalos DTPa: 6sem | 8sem | 6 meses

describe('validateDoses — intervalos correctos', () => {
  it('marca todas las dosis como válidas si se respetan los intervalos', () => {
    const doses = [
      new Date('2024-01-01'),  // 1ª
      new Date('2024-02-15'),  // 45 días → mínimo 42 ✓
      new Date('2024-04-15'),  // 60 días → mínimo 56 ✓
    ]
    const result = validateDoses(doses, DTPA)
    expect(result.every(d => d.isValid)).toBe(true)
  })

  it('la 1ª dosis siempre es válida', () => {
    const result = validateDoses([new Date('2024-01-01')], DTPA)
    expect(result[0].isValid).toBe(true)
  })

  it('array vacío devuelve array vacío', () => {
    expect(validateDoses([], DTPA)).toHaveLength(0)
  })
})

describe('validateDoses — periodo de gracia (4 días)', () => {
  it('dosis VÁLIDA si se pone exactamente 4 días antes del mínimo (42-4=38 días)', () => {
    const doses = [
      new Date('2024-01-01'),
      new Date('2024-02-08'),  // 38 días = 42-4 → válida por gracia
    ]
    const result = validateDoses(doses, DTPA)
    expect(result[1].isValid).toBe(true)
  })

  it('dosis INVÁLIDA si se pone 5 días antes del mínimo (42-5=37 días)', () => {
    const doses = [
      new Date('2024-01-01'),
      new Date('2024-02-07'),  // 37 días = 42-5 → inválida
    ]
    const result = validateDoses(doses, DTPA)
    expect(result[1].isValid).toBe(false)
    expect(result[1].reason).toBe('too_early')
  })

  it('dosis INVÁLIDA si se pone 10 días antes del mínimo', () => {
    const doses = [
      new Date('2024-01-01'),
      new Date('2024-02-02'),  // 32 días = 42-10 → inválida
    ]
    const result = validateDoses(doses, DTPA)
    expect(result[1].isValid).toBe(false)
  })
})

describe('validateDoses — dosis inválida no reinicia el intervalo', () => {
  it('el intervalo de la 3ª se cuenta desde la 2ª aunque sea inválida', () => {
    const doses = [
      new Date('2024-01-01'),
      new Date('2024-01-15'),  // 14 días → inválida (mínimo 42)
      new Date('2024-03-15'),  // 60 días desde 2ª → 2ª→3ª mínimo 56 ✓
    ]
    const result = validateDoses(doses, DTPA)
    expect(result[0].isValid).toBe(true)
    expect(result[1].isValid).toBe(false)
    expect(result[2].isValid).toBe(true)
  })
})

describe('countValidDoses', () => {
  it('cuenta solo las dosis marcadas como válidas', () => {
    const validities = [
      { doseIndex: 0, isValid: true },
      { doseIndex: 1, isValid: false, reason: 'too_early' as const },
      { doseIndex: 2, isValid: true },
    ]
    expect(countValidDoses(validities)).toBe(2)
  })

  it('devuelve 0 para array vacío', () => {
    expect(countValidDoses([])).toBe(0)
  })

  it('devuelve el total si todas son válidas', () => {
    const validities = [
      { doseIndex: 0, isValid: true },
      { doseIndex: 1, isValid: true },
      { doseIndex: 2, isValid: true },
    ]
    expect(countValidDoses(validities)).toBe(3)
  })
})
