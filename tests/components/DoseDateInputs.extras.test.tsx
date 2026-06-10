import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DoseDateInputs } from '../../src/components/DoseDateInputs'
import type { DoseCount, DoseWithDate, RequiredVaccine } from '../../src/types'

describe('DoseDateInputs extras', () => {
  it('shows date fields for non-applicable vaccines when they have recorded doses', () => {
    const onChange = vi.fn()
    const requirements: RequiredVaccine[] = [
      { vaccineId: 'dtpa', minDoses: 3, applicable: true },
      { vaccineId: 'varicella', minDoses: 0, applicable: false },
    ]
    const doseCounts: DoseCount[] = [
      { vaccineId: 'dtpa', count: 0 },
      { vaccineId: 'varicella', count: 1 },
    ]
    const doseDates: DoseWithDate[] = [
      { vaccineId: 'dtpa', dates: [] },
      { vaccineId: 'varicella', dates: [] },
    ]

    render(
      <DoseDateInputs
        requirements={requirements}
        doseCounts={doseCounts}
        doseDates={doseDates}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /análisis con fechas/i }))

    const extras = screen.getByText('Fechas de otras vacunas registradas').closest('div')?.parentElement
    expect(extras).not.toBeNull()
    expect(within(extras!).getByText('Varicela (Varivax®)')).toBeInTheDocument()
    expect(within(extras!).getByLabelText('Dosis 1')).toBeInTheDocument()

    fireEvent.change(within(extras!).getByLabelText('Dosis 1'), { target: { value: '2026-01-15' } })

    expect(onChange).toHaveBeenCalledWith('varicella', 0, new Date('2026-01-15'))
  })
})
