import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DirayaNote } from '../../src/components/DirayaNote'
import type { ConditionCaution, VisitPlan } from '../../src/types'

describe('DirayaNote', () => {
  it('does not show the copy note when there is nothing to administer or review', () => {
    render(<DirayaNote todayVisit={undefined} conditionCautions={[]} />)

    expect(screen.queryByText('Nota para Diraya')).not.toBeInTheDocument()
  })

  it('shows the copy note when vaccines are scheduled today', () => {
    const todayVisit: VisitPlan = {
      label: 'HOY',
      date: new Date('2026-06-09'),
      vaccines: [{ vaccineId: 'dtpa', doseNumber: 1 }],
      hasLiveVaccines: false,
    }

    render(<DirayaNote todayVisit={todayVisit} conditionCautions={[]} />)

    expect(screen.getByText('Nota para Diraya')).toBeInTheDocument()
  })

  it('keeps the copy note for undocumented-dose review even without vaccines today', () => {
    const undocumentedDoseCaution: ConditionCaution = {
      conditionId: 'undocumented_doses',
      label: 'Dosis previas no documentadas o dudosas',
      severity: 'warning',
      message: 'Confirmar registro vacunal.',
    }

    render(<DirayaNote todayVisit={undefined} conditionCautions={[undocumentedDoseCaution]} />)

    expect(screen.getByText('Nota para Diraya')).toBeInTheDocument()
    expect(screen.getByText(/Nota: existen dosis previas no documentadas/)).toBeInTheDocument()
  })
})
