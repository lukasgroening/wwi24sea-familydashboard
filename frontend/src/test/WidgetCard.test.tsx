import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WidgetCard from '../components/WidgetCard'

function FakeWidget() {
  return <div>Hier steht der Widget-Inhalt</div>
}

describe('WidgetCard', () => {
  const createWidget = (overrides = {}) => ({
    id: 'test-widget',
    name: 'Wetter',
    description: 'Zeigt das Wetter an',
    component: FakeWidget,
    defaultSize: 'medium' as const,
    ...overrides,
  })

  it('zeigt den Widget-Namen an', () => {
    render(<WidgetCard widget={createWidget()} />)
    expect(screen.getByText('Wetter')).toBeInTheDocument()
  })

  it('rendert die Widget-Komponente (den Inhalt)', () => {
    render(<WidgetCard widget={createWidget()} />)
    expect(screen.getByText('Hier steht der Widget-Inhalt')).toBeInTheDocument()
  })

  it('zeigt auch bei einem anderen Namen den richtigen Text', () => {
    render(<WidgetCard widget={createWidget({ name: 'Kalender' })} />)

    expect(screen.getByText('Kalender')).toBeInTheDocument()
  })

  it('wendet zusätzliche CSS-Klassen an', () => {
    const { container } = render(
      <WidgetCard widget={createWidget()} className="meine-extra-klasse" />
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.classList.contains('meine-extra-klasse')).toBe(true)
  })
})
