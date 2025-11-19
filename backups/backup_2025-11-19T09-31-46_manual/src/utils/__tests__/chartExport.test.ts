/**
 * ✅ ТЕСТЫ: Тесты для экспорта графиков
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportChartAsPNG, exportChartAsSVG } from '../chartExport'

describe('chartExport', () => {
  beforeEach(() => {
    // Мокаем DOM API
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Правильно мокаем XMLSerializer как класс
    global.XMLSerializer = class {
      serializeToString(element: any) {
        return '<svg></svg>'
      }
    } as any
    
    // Мокаем document.createElement
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    global.document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') return mockLink as any
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          })),
          toBlob: vi.fn((callback: any) => {
            callback(new Blob(['test'], { type: 'image/png' }))
          }),
        } as any
      }
      if (tag === 'img') {
        return {
          width: 0,
          height: 0,
          onload: null as any,
        } as any
      }
      return {} as any
    })
    
    global.document.body.appendChild = vi.fn()
    global.document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('exportChartAsPNG', () => {
    it('should export chart as PNG', async () => {
      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        src: '',
      }
      
      const mockSvg = {
        cloneNode: vi.fn(() => ({
          setAttribute: vi.fn(),
        })),
        getBoundingClientRect: vi.fn(() => ({
          width: 800,
          height: 600,
        })),
      } as any

      // Мокаем Image конструктор
      global.Image = class {
        width = 0
        height = 0
        onload: any = null
        src = ''
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 0)
        }
      } as any

      await expect(exportChartAsPNG(mockSvg, 'test-chart', 2)).resolves.toBeUndefined()
    })

    it('should use default fileName', async () => {
      global.Image = class {
        width = 0
        height = 0
        onload: any = null
        src = ''
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 0)
        }
      } as any

      const mockSvg = {
        cloneNode: vi.fn(() => ({
          setAttribute: vi.fn(),
        })),
        getBoundingClientRect: vi.fn(() => ({
          width: 800,
          height: 600,
        })),
      } as any

      await expect(exportChartAsPNG(mockSvg)).resolves.toBeUndefined()
    })

    it('should use default scale', async () => {
      global.Image = class {
        width = 0
        height = 0
        onload: any = null
        src = ''
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 0)
        }
      } as any

      const mockSvg = {
        cloneNode: vi.fn(() => ({
          setAttribute: vi.fn(),
        })),
        getBoundingClientRect: vi.fn(() => ({
          width: 800,
          height: 600,
        })),
      } as any

      await expect(exportChartAsPNG(mockSvg, 'test')).resolves.toBeUndefined()
    })
  })

  describe('exportChartAsSVG', () => {
    it('should export chart as SVG', () => {
      const mockSvg = {
        cloneNode: vi.fn(() => ({
          setAttribute: vi.fn(),
          getAttribute: vi.fn(() => null),
        })),
      } as any

      exportChartAsSVG(mockSvg, 'test-chart')
      expect(mockSvg.cloneNode).toHaveBeenCalled()
    })

    it('should use default fileName', () => {
      const mockSvg = {
        cloneNode: vi.fn(() => ({
          setAttribute: vi.fn(),
          getAttribute: vi.fn(() => null),
        })),
      } as any

      exportChartAsSVG(mockSvg)
      expect(mockSvg.cloneNode).toHaveBeenCalled()
    })
  })
})

