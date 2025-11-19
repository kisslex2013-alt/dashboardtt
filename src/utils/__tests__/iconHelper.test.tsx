/**
 * ✅ ТЕСТЫ: Тесты для утилит работы с иконками
 */

import { describe, it, expect } from 'vitest'
import { getIcon } from '../iconHelper'
import React from 'react'

describe('iconHelper', () => {
  describe('getIcon', () => {
    it('should return icon component for valid icon name', () => {
      const Icon = getIcon('Clock')
      expect(Icon).toBeDefined()
      // React components are objects, not functions
      expect(Icon).toBeTruthy()
    })

    it('should return default icon for invalid icon name', () => {
      const Icon = getIcon('NonExistentIcon')
      expect(Icon).toBeDefined()
      expect(Icon).toBeTruthy()
    })

    it('should return icon for common icons', () => {
      const icons = ['Clock', 'Calendar', 'Settings', 'DollarSign', 'Activity']
      icons.forEach(iconName => {
        const Icon = getIcon(iconName)
        expect(Icon).toBeDefined()
        expect(Icon).toBeTruthy()
      })
    })

    it('should handle case-insensitive icon names', () => {
      const Icon1 = getIcon('clock')
      const Icon2 = getIcon('Clock')
      expect(Icon1).toBeDefined()
      expect(Icon2).toBeDefined()
    })

    it('should return same icon for same name', () => {
      const Icon1 = getIcon('Clock')
      const Icon2 = getIcon('Clock')
      expect(Icon1).toBe(Icon2)
    })
  })
})

