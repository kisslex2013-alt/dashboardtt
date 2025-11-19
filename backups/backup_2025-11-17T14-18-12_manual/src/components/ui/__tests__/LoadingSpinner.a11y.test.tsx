import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'
import * as axeCore from 'axe-core'

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

describe('LoadingSpinner Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LoadingSpinner />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations with text', async () => {
    const { container } = render(<LoadingSpinner text="Loading data..." />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })
})

