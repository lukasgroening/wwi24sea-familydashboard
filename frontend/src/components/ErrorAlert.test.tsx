import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorAlert from './ErrorAlert'

describe('ErrorAlert', () => {
  it('rendert nichts wenn message leer ist', () => {
    const { container } = render(<ErrorAlert message="" />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert nichts wenn message null ist', () => {
    const { container } = render(<ErrorAlert message={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert nichts wenn message undefined ist', () => {
    const { container } = render(<ErrorAlert message={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('zeigt die Fehlermeldung an', () => {
    render(<ErrorAlert message="Fehler beim Speichern." />)
    expect(screen.getByText('Fehler beim Speichern.')).toBeInTheDocument()
  })

  it('hat role="alert" für Accessibility', () => {
    render(<ErrorAlert message="Ein Fehler ist aufgetreten." />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('zeigt keinen Schließen-Button ohne onDismiss', () => {
    render(<ErrorAlert message="Fehler" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('zeigt Schließen-Button wenn onDismiss übergeben wird', () => {
    render(<ErrorAlert message="Fehler" onDismiss={() => {}} />)
    expect(screen.getByRole('button', { name: /schließen/i })).toBeInTheDocument()
  })

  it('ruft onDismiss auf wenn Schließen-Button geklickt wird', async () => {
    const onDismiss = vi.fn()
    render(<ErrorAlert message="Fehler" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /schließen/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('hat keinen Border-Style ohne onDismiss (FormError-Stil)', () => {
    render(<ErrorAlert message="Fehler" />)
    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('style')).not.toContain('var(--color-danger-200)')
  })

  it('hat Border-Style mit onDismiss (DismissibleError-Stil)', () => {
    render(<ErrorAlert message="Fehler" onDismiss={() => {}} />)
    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('style')).toContain('var(--color-danger-200)')
  })
})
