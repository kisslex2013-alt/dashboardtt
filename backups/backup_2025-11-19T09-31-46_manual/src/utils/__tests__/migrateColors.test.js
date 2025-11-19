/**
 * ✅ ТЕСТЫ: Тесты для migrateColors.js
 */

import { describe, it, expect } from 'vitest'
import {
  migrateCategoriesToSemanticColors,
  needsColorMigration,
} from '../migrateColors'

describe('migrateColors', () => {
  describe('migrateCategoriesToSemanticColors', () => {
    it('should migrate remix/development category to deepWork', () => {
      const categories = [
        { name: 'Remix Development', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#6366F1')
    })

    it('should migrate marketing category to communication', () => {
      const categories = [
        { name: 'Marketing', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#F59E0B')
    })

    it('should migrate design category to creative', () => {
      const categories = [
        { name: 'Design', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#EC4899')
    })

    it('should migrate management/consulting to consulting', () => {
      const categories = [
        { name: 'Management', color: '#FF0000' },
        { name: 'Consulting', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#06B6D4')
      expect(result[1].color).toBe('#06B6D4')
    })

    it('should migrate teaching to learning', () => {
      const categories = [
        { name: 'Teaching', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#8B5CF6')
    })

    it('should migrate other category', () => {
      const categories = [
        { name: 'Other', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#6B7280')
    })

    it('should handle case-insensitive names', () => {
      const categories = [
        { name: 'REMIX DEVELOPMENT', color: '#FF0000' },
        { name: 'marketing', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#6366F1')
      expect(result[1].color).toBe('#F59E0B')
    })

    it('should preserve other properties', () => {
      const categories = [
        { id: '1', name: 'Remix', color: '#FF0000', rate: 1000 },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].id).toBe('1')
      expect(result[0].rate).toBe(1000)
      expect(result[0].color).toBe('#6366F1')
    })

    it('should handle empty array', () => {
      const result = migrateCategoriesToSemanticColors([])
      expect(result).toEqual([])
    })

    it('should handle unknown category names', () => {
      const categories = [
        { name: 'Unknown Category', color: '#FF0000' },
      ]

      const result = migrateCategoriesToSemanticColors(categories)
      expect(result[0].color).toBe('#FF0000') // Сохраняет оригинальный цвет
    })
  })

  describe('needsColorMigration', () => {
    it('should return false when colors are already semantic', () => {
      const categories = [
        { name: 'Remix Development', color: '#6366F1' },
      ]

      expect(needsColorMigration(categories)).toBe(false)
    })

    it('should return true when colors need migration', () => {
      const categories = [
        { name: 'Remix Development', color: '#FF0000' },
      ]

      expect(needsColorMigration(categories)).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(needsColorMigration([])).toBe(false)
    })

    it('should return false for unknown categories', () => {
      const categories = [
        { name: 'Unknown Category', color: '#FF0000' },
      ]

      expect(needsColorMigration(categories)).toBe(false)
    })

    it('should check multiple categories', () => {
      const categories = [
        { name: 'Remix Development', color: '#6366F1' }, // Уже мигрировано
        { name: 'Marketing', color: '#FF0000' }, // Нужна миграция
      ]

      expect(needsColorMigration(categories)).toBe(true)
    })
  })
})

