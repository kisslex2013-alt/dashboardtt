/**
 * ✅ ТЕСТЫ: Тесты для утилит анимаций
 */

import { describe, it, expect } from 'vitest'
import {
  ANIMATION_DURATIONS,
  ANIMATION_EASING,
  TRANSFORM_VALUES,
  getTransition,
  getTransitionClass,
  getTransitionStyle,
} from '../animations'

describe('animations', () => {
  describe('ANIMATION_DURATIONS', () => {
    it('should have correct duration values', () => {
      expect(ANIMATION_DURATIONS.FAST).toBe(150)
      expect(ANIMATION_DURATIONS.NORMAL).toBe(300)
      expect(ANIMATION_DURATIONS.SLOW).toBe(500)
    })
  })

  describe('ANIMATION_EASING', () => {
    it('should have easing functions', () => {
      expect(ANIMATION_EASING.EASE_OUT).toBe('ease-out')
      expect(ANIMATION_EASING.EASE_IN_OUT).toBe('ease-in-out')
      expect(ANIMATION_EASING.STANDARD).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    })
  })

  describe('TRANSFORM_VALUES', () => {
    it('should have correct transform values', () => {
      expect(TRANSFORM_VALUES.LIFT_LIGHT).toBe(-2)
      expect(TRANSFORM_VALUES.LIFT_MEDIUM).toBe(-4)
      expect(TRANSFORM_VALUES.LIFT_LARGE).toBe(-8)
      expect(TRANSFORM_VALUES.SCALE_LIGHT).toBe(1.02)
      expect(TRANSFORM_VALUES.SCALE_MEDIUM).toBe(1.05)
      expect(TRANSFORM_VALUES.SCALE_EXPRESSIVE).toBe(1.1)
      expect(TRANSFORM_VALUES.SCALE_ACTIVE).toBe(0.95)
      expect(TRANSFORM_VALUES.ROTATE_CHEVRON).toBe(180)
      expect(TRANSFORM_VALUES.ROTATE_ICON_HOVER).toBe(12)
    })
  })

  describe('getTransition', () => {
    it('should generate transition string for single property', () => {
      const result = getTransition(['transform'], 300, 'ease-out')
      expect(result).toBe('transform 300ms ease-out')
    })

    it('should generate transition string for multiple properties', () => {
      const result = getTransition(['transform', 'opacity'], 300, 'ease-out')
      expect(result).toBe('transform 300ms ease-out, opacity 300ms ease-out')
    })

    it('should use default values', () => {
      const result = getTransition()
      expect(result).toContain('all')
      expect(result).toContain(`${ANIMATION_DURATIONS.NORMAL}ms`)
      expect(result).toContain(ANIMATION_EASING.STANDARD)
    })

    it('should use custom duration and easing', () => {
      const result = getTransition(['opacity'], 500, 'ease-in')
      expect(result).toBe('opacity 500ms ease-in')
    })
  })

  describe('getTransitionClass', () => {
    it('should generate transition class for fast speed', () => {
      const result = getTransitionClass('fast')
      expect(result).toContain('transition-all')
      expect(result).toContain(`${ANIMATION_DURATIONS.FAST}ms`)
    })

    it('should generate transition class for normal speed', () => {
      const result = getTransitionClass('normal')
      expect(result).toContain('transition-all')
      expect(result).toContain(`${ANIMATION_DURATIONS.NORMAL}ms`)
    })

    it('should generate transition class for slow speed', () => {
      const result = getTransitionClass('slow')
      expect(result).toContain('transition-all')
      expect(result).toContain(`${ANIMATION_DURATIONS.SLOW}ms`)
    })

    it('should default to normal speed', () => {
      const result = getTransitionClass()
      expect(result).toContain(`${ANIMATION_DURATIONS.NORMAL}ms`)
    })
  })

  describe('getTransitionStyle', () => {
    it('should generate transition style object', () => {
      const result = getTransitionStyle(['transform'], 300, 'ease-out')
      expect(result).toHaveProperty('transition')
      expect(result.transition).toBe('transform 300ms ease-out')
    })

    it('should use default values', () => {
      const result = getTransitionStyle()
      expect(result).toHaveProperty('transition')
      expect(result.transition).toBeTruthy()
      expect(typeof result.transition).toBe('string')
    })
  })
})

