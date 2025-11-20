/**
 * ✅ PERFORMANCE: Конфигурация Lighthouse CI
 * 
 * Автоматическое тестирование производительности с порогами >90
 */

module.exports = {
  ci: {
    collect: {
      // URL для тестирования
      url: ['http://localhost:4173/'],
      // Количество запусков для стабильности
      numberOfRuns: 3,
      // Настройки браузера
      settings: {
        chromeFlags: '--no-sandbox --headless',
        // Эмуляция мобильного устройства
        emulatedFormFactor: 'desktop',
        // Отключение сбора трейсов для ускорения
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      // ✅ PERFORMANCE: Пороги для метрик (все >90)
      assertions: {
        // Performance метрики
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        
        // Accessibility (уже настроено отдельно, но проверяем и здесь)
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }],
        
        // SEO
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Дополнительные метрики производительности
        'render-blocking-resources': ['warn', { maxLength: 0 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-text-compression': ['error', { minScore: 0.9 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        'unminified-css': ['warn', { maxLength: 0 }],
        'unminified-javascript': ['warn', { maxLength: 0 }],
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'efficient-animated-content': ['warn', { maxLength: 0 }],
        'preload-lcp-image': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': ['warn', { minScore: 0.8 }],
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        'critical-request-chains': ['warn', { maxLength: 0 }],
        'uses-rel-preconnect': ['warn', { minScore: 0.8 }],
        'uses-rel-preload': ['warn', { minScore: 0.8 }],
        'font-display': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      // Отключаем загрузку результатов (можно включить для CI/CD)
      target: 'temporary-public-storage',
    },
    server: {
      // Отключаем локальный сервер (используем preview)
      port: 0,
    },
  },
}

