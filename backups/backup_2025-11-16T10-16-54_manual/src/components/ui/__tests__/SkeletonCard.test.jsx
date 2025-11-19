import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkeletonCard, SkeletonList, SkeletonGrid } from '../SkeletonCard'

describe('SkeletonCard', () => {
  it('renders default skeleton', () => {
    const { container } = render(<SkeletonCard />)
    const skeleton = container.querySelector('.glass-effect')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders entry variant', () => {
    const { container } = render(<SkeletonCard variant="entry" />)
    const skeleton = container.querySelector('.glass-effect')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders statistic variant', () => {
    const { container } = render(<SkeletonCard variant="statistic" />)
    const skeleton = container.querySelector('.glass-effect')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders listItem variant', () => {
    const { container } = render(<SkeletonCard variant="listItem" />)
    const skeleton = container.querySelector('.glass-effect')
    expect(skeleton).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<SkeletonCard className="custom-class" />)
    const skeleton = container.querySelector('.custom-class')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('SkeletonList', () => {
  it('renders multiple skeleton cards', () => {
    const { container } = render(<SkeletonList count={3} />)
    const skeletons = container.querySelectorAll('.glass-effect')
    expect(skeletons).toHaveLength(3)
  })

  it('uses correct variant', () => {
    const { container } = render(<SkeletonList count={2} variant="entry" />)
    const skeletons = container.querySelectorAll('.glass-effect')
    expect(skeletons).toHaveLength(2)
  })
})

describe('SkeletonGrid', () => {
  it('renders skeleton cards in grid', () => {
    const { container } = render(<SkeletonGrid count={6} columns={3} />)
    const skeletons = container.querySelectorAll('.glass-effect')
    expect(skeletons).toHaveLength(6)
  })

  it('applies grid classes', () => {
    const { container } = render(<SkeletonGrid count={4} columns={2} />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })
})

