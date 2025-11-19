import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../Button'
import { Plus } from '../../../utils/icons'
import * as axeCore from 'axe-core'

// Функция для запуска axe анализа
async function runAxe(container) {
  return new Promise((resolve) => {
    axeCore.run(container, (err, results) => {
      if (err) {
        resolve({ pass: false, violations: [{ id: 'error', description: err.message }] })
      } else {
        resolve({
          pass: results.violations.length === 0,
          violations: results.violations,
        })
      }
    })
  })
}

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
    if (!results.pass) {
      console.error('Accessibility violations:', results.violations)
    }
  })

  it('should have no violations with icon', async () => {
    const { container } = render(
      <Button icon={Plus} aria-label="Add item">
        Add
      </Button>
    )
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations when disabled', async () => {
    const { container } = render(
      <Button disabled aria-disabled="true">
        Disabled
      </Button>
    )
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations with different variants', async () => {
    const { container: primaryContainer } = render(<Button variant="primary">Primary</Button>)
    const primaryResults = await runAxe(primaryContainer)
    expect(primaryResults.pass).toBe(true)

    const { container: dangerContainer } = render(<Button variant="danger">Danger</Button>)
    const dangerResults = await runAxe(dangerContainer)
    expect(dangerResults.pass).toBe(true)
  })
})

