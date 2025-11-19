import { defineConfig, devices } from '@playwright/test'

/**
 * ✅ E2E ТЕСТЫ: Конфигурация Playwright
 * 
 * См. https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время выполнения одного теста */
  timeout: 30 * 1000,
  
  expect: {
    /* Максимальное время для expect assertions */
    timeout: 5000,
  },
  
  /* Запускать тесты в файлах параллельно */
  fullyParallel: true,
  
  /* Не запускать тесты в CI/CD, если не указано явно */
  forbidOnly: !!process.env.CI,
  
  /* Повторять тесты только в CI/CD при падении */
  retries: process.env.CI ? 2 : 0,
  
  /* Количество воркеров для параллельного запуска */
  workers: process.env.CI ? 1 : undefined,
  
  /* Репортер для использования */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  /* Общие настройки для всех проектов */
  use: {
    /* Базовый URL для использования в действиях типа `await page.goto('/')` */
    baseURL: 'http://localhost:5173',
    
    /* Собирать trace при повторных попытках при падении теста */
    trace: 'on-first-retry',
    
    /* Скриншоты при падении */
    screenshot: 'only-on-failure',
    
    /* Видео при падении */
    video: 'retain-on-failure',
  },

  /* Настройка проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Тестирование на мобильных устройствах */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Запускать dev сервер перед тестами */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

