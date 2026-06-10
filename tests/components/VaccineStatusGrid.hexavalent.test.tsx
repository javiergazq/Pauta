import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VaccineStatusGrid } from '../../src/components/VaccineStatusGrid'
import type { DoseCount, RequiredVaccine } from '../../src/types'

const requirements: RequiredVaccine[] = [
  { vaccineId: 'dtpa', minDoses: 3, applicable: true },
  { vaccineId: 'hepb', minDoses: 3, applicable: true },
  { vaccineId: 'polio', minDoses: 3, applicable: true },
  { vaccineId: 'hib', minDoses: 3, applicable: true },
  { vaccineId: 'pneumo', minDoses: 3, applicable: true },
]

const doseCounts: DoseCount[] = requirements.map(req => ({
  vaccineId: req.vaccineId,
  count: 0,
}))

describe('VaccineStatusGrid hexavalent shortcut', () => {
  it('updates DTPa, HepB, polio and Hib together', () => {
    const onChange = vi.fn()

    render(
      <VaccineStatusGrid
        requirements={requirements}
        doseCounts={doseCounts}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hexavalente 2 dosis' }))

    expect(onChange).toHaveBeenCalledWith('dtpa', 2)
    expect(onChange).toHaveBeenCalledWith('hepb', 2)
    expect(onChange).toHaveBeenCalledWith('polio', 2)
    expect(onChange).toHaveBeenCalledWith('hib', 2)
    expect(onChange).not.toHaveBeenCalledWith('pneumo', 2)
  })

  it('can expose vaccines outside the current age schedule for manual registration', () => {
    const onChange = vi.fn()
    const mixedRequirements: RequiredVaccine[] = [
      { vaccineId: 'dtpa', minDoses: 3, applicable: true },
      { vaccineId: 'varicella', minDoses: 0, applicable: false },
    ]
    const mixedDoseCounts: DoseCount[] = mixedRequirements.map(req => ({
      vaccineId: req.vaccineId,
      count: 0,
    }))

    render(
      <VaccineStatusGrid
        requirements={mixedRequirements}
        doseCounts={mixedDoseCounts}
        onChange={onChange}
      />,
    )

    expect(screen.queryByText('Varicela (Varivax®)')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /otras vacunas administradas/i }))

    const varicellaRow = screen.getByText('Varicela (Varivax®)').closest('div')
    expect(varicellaRow).not.toBeNull()
    fireEvent.click(within(varicellaRow!.parentElement!).getByRole('button', { name: '1' }))

    expect(onChange).toHaveBeenCalledWith('varicella', 1)
  })

  it('emits documentation details for polio and TV when recorded doses need clarification', () => {
    const onChange = vi.fn()
    const onDocumentationDetailChange = vi.fn()
    const docRequirements: RequiredVaccine[] = [
      { vaccineId: 'polio', minDoses: 3, applicable: true },
      { vaccineId: 'mmr', minDoses: 2, applicable: true },
    ]
    const docDoseCounts: DoseCount[] = [
      { vaccineId: 'polio', count: 1 },
      { vaccineId: 'mmr', count: 1 },
    ]

    render(
      <VaccineStatusGrid
        requirements={docRequirements}
        doseCounts={docDoseCounts}
        onChange={onChange}
        onDocumentationDetailChange={onDocumentationDetailChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Tipo documentado'), {
      target: { value: 'exclusive_bivalent_opv_after_2016' },
    })
    fireEvent.change(screen.getByLabelText('Componentes documentados'), {
      target: { value: 'measles_rubella_only' },
    })

    expect(onDocumentationDetailChange).toHaveBeenCalledWith('polio', {
      polioType: 'exclusive_bivalent_opv_after_2016',
    })
    expect(onDocumentationDetailChange).toHaveBeenCalledWith('mmr', {
      mmrType: 'measles_rubella_only',
    })
  })
})
