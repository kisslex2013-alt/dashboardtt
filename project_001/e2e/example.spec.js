import { test, expect } from '@playwright/test'

/**
 * ✅ E2E ТЕСТЫ: Пример базового теста
 * 
 * Этот файл демонстрирует структуру E2E тестов.
 * Добавьте сюда тесты для критичных пользовательских сценариев.
 */

test.describe('Time Tracker Dashboard', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // ✅ ИСПРАВЛЕНО: Ждем загрузки DOM и основного контента
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root', { state: 'attached', timeout: 5000 })
    
    // Проверяем, что приложение загрузилось
    await expect(page).toHaveTitle(/Time Tracker/i)
    
    // Проверяем наличие основных элементов
    const header = page.locator('header, [role="banner"]').first()
    await expect(header).toBeVisible({ timeout: 5000 })
  })

  test('should display entries list', async ({ page }) => {
    await page.goto('/')
    
    // Ждем загрузки списка записей
    const entriesList = page.locator('[data-testid="entries-list"], .glass-effect').first()
    await expect(entriesList).toBeVisible({ timeout: 10000 })
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('/')
    
    // Ищем кнопку переключения темы
    const themeToggle = page.locator('button[aria-label*="тема"], button[aria-label*="theme"]').first()
    
    if (await themeToggle.isVisible()) {
      const initialClass = await page.locator('html').getAttribute('class')
      
      await themeToggle.click()
      
      // Ждем изменения темы
      await page.waitForTimeout(500)
      
      const newClass = await page.locator('html').getAttribute('class')
      expect(newClass).not.toBe(initialClass)
    }
  })
})

