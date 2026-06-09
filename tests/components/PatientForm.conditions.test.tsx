import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PatientForm } from '../../src/components/PatientForm'

function openConditions() {
  fireEvent.click(screen.getByRole('button', { name: /condiciones especiales/i }))
}

describe('PatientForm special conditions', () => {
  it('groups special conditions by clinical section and includes documentation/perinatal warnings', () => {
    render(<PatientForm onSubmit={vi.fn()} />)
    openConditions()

    expect(screen.getByText('Antecedentes vacunales/infecciosos')).toBeInTheDocument()
    expect(screen.getByText('Situaciones perinatales')).toBeInTheDocument()
    expect(screen.getByText('Inmunosupresión y situaciones de inmunocompromiso')).toBeInTheDocument()
    expect(screen.getByText('Riesgo de infección invasiva')).toBeInTheDocument()
    expect(screen.getByText('Enfermedades crónicas')).toBeInTheDocument()
    expect(screen.getByText('Otros factores que requieren revisión')).toBeInTheDocument()

    expect(screen.getByText('Antecedente de varicela')).toBeInTheDocument()
    expect(screen.getByText('Dosis previas no documentadas o dudosas')).toBeInTheDocument()
    expect(screen.getByText('Madre AgHBs positiva')).toBeInTheDocument()
    expect(screen.getByText('Inmunosupresión severa')).toBeInTheDocument()
    expect(screen.getByText('Déficit de complemento / tratamiento anti-C5')).toBeInTheDocument()
    expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument()
  })

  it('submits newly exposed warning-only conditions', () => {
    const onSubmit = vi.fn()
    render(<PatientForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '2023-06-08' },
    })
    openConditions()
    fireEvent.click(screen.getByText('Dosis previas no documentadas o dudosas'))
    fireEvent.click(screen.getByText('Madre AgHBs positiva'))
    fireEvent.click(screen.getByRole('button', { name: /ver calendario vacunal/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: ['undocumented_doses', 'maternal_hbsag_positive'],
      }),
    )
  })

  it('shows a compact summary of selected conditions', () => {
    render(<PatientForm onSubmit={vi.fn()} />)

    openConditions()
    fireEvent.click(screen.getByText('Antecedente de varicela'))
    fireEvent.click(screen.getByText('Déficit de complemento / tratamiento anti-C5'))

    expect(screen.getByText('Condiciones seleccionadas')).toBeInTheDocument()
    expect(screen.getAllByText('Antecedente de varicela')).toHaveLength(2)
    expect(screen.getAllByText('Déficit de complemento / tratamiento anti-C5')).toHaveLength(2)
  })
})
