/**
 * ✅ ТЕСТЫ: Тесты для утилит генерации UUID
 */

import { describe, it, expect } from 'vitest'
import { generateUUID, generateShortId } from '../uuid'

describe('uuid', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID()
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })

    it('should generate UUIDs with correct length', () => {
      const uuid = generateUUID()
      expect(uuid.length).toBe(36) // UUID format: 8-4-4-4-12 = 36 characters
    })

    it('should generate multiple unique UUIDs', () => {
      const uuids = Array.from({ length: 100 }, () => generateUUID())
      const uniqueUuids = new Set(uuids)
      expect(uniqueUuids.size).toBe(100) // All should be unique
    })
  })

  describe('generateShortId', () => {
    it('should generate a short ID', () => {
      const id = generateShortId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique short IDs', () => {
      const id1 = generateShortId()
      const id2 = generateShortId()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs with consistent format', () => {
      const ids = Array.from({ length: 10 }, () => generateShortId())
      // All IDs should have format: timestamp-randomstring (with hyphen)
      ids.forEach(id => {
        expect(id).toMatch(/^\d+-[a-zA-Z0-9]+$/)
      })
    })

    it('should generate multiple unique short IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateShortId())
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100) // All should be unique
    })
  })
})

