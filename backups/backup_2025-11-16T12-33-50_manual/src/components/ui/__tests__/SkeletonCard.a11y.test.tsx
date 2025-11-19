import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonCard, SkeletonList, SkeletonGrid } from '../SkeletonCard'
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

describe('SkeletonCard Accessibility', () => {
  it('should have no accessibility violations for default variant', async () => {
    const { container } = render(<SkeletonCard />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations for entry variant', async () => {
    const { container } = render(<SkeletonCard variant="entry" />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations for statistic variant', async () => {
    const { container } = render(<SkeletonCard variant="statistic" />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations for SkeletonList', async () => {
    const { container } = render(<SkeletonList count={3} />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })

  it('should have no violations for SkeletonGrid', async () => {
    const { container } = render(<SkeletonGrid count={6} columns={3} />)
    const results = await runAxe(container)
    expect(results.pass).toBe(true)
  })
})

