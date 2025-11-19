import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'
import { Plus } from '../../../utils/icons'

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('renders with icon', () => {
    render(<Button icon={Plus}>Add</Button>)
    
    const button = screen.getByRole('button', { name: /add/i })
    const icon = button.querySelector('svg')
    
    expect(icon).toBeInTheDocument()
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    let button = screen.getByRole('button', { name: /primary/i })
    expect(button.className).toMatch(/bg-blue-600/)
    
    rerender(<Button variant="danger">Danger</Button>)
    button = screen.getByRole('button', { name: /danger/i })
    expect(button.className).toMatch(/bg-red-500/)
  })

  it('applies size styles', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button', { name: /small/i })
    expect(button.className).toMatch(/px-\d|py-\d/)
    
    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: /large/i })
    expect(button.className).toMatch(/px-\d|py-\d/)
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button', { name: /custom/i })
    expect(button.className).toContain('custom-class')
  })

  it('has correct type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).toHaveAttribute('type', 'submit')
  })
})

