import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('svg')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies size classes', () => {
    const { container, rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = container.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner?.getAttribute('class') || '').toContain('w-4')
    
    rerender(<LoadingSpinner size="lg" />)
    spinner = container.querySelector('svg')
    expect(spinner?.getAttribute('class') || '').toContain('w-12')
  })
})

