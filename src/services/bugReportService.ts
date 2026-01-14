import { supabase } from './supabase'

// Типы для баг-репортов
export type BugReportType = 'bug' | 'feature' | 'feedback'
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

export interface BugReportData {
  type: BugReportType
  title: string
  description: string
  severity?: BugSeverity
  contactEmail?: string
}

export interface BugReport extends BugReportData {
  id: string
  userId?: string
  status: BugStatus
  browserInfo?: BrowserInfo
  appVersion?: string
  pageUrl?: string
  createdAt: string
  resolvedAt?: string
}

export interface BrowserInfo {
  userAgent: string
  language: string
  platform: string
  screenSize: string
  viewport: string
  timezone: string
  cookiesEnabled: boolean
  onLine: boolean
}

/**
 * Сервис для работы с баг-репортами
 */
export const bugReportService = {
  /**
   * Собирает информацию о системе пользователя
   */
  collectSystemInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    }
  },

  /**
   * Получает версию приложения из package.json или localStorage
   */
  getAppVersion(): string {
    // Попробуем получить из localStorage (если сохраняется при билде)
    const storedVersion = localStorage.getItem('app_version')
    if (storedVersion) return storedVersion
    
    // Fallback на хардкод версию
    return '1.3.1'
  },

  /**
   * Отправляет новый баг-репорт
   */
  async submitReport(data: BugReportData): Promise<{ success: boolean; error?: string }> {
    try {
      const browserInfo = this.collectSystemInfo()
      const appVersion = this.getAppVersion()
      const pageUrl = window.location.href

      // Получаем user_id если пользователь авторизован
      const userId = localStorage.getItem('time-tracker-user-id')

      const { error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: userId || null,
          type: data.type,
          title: data.title,
          description: data.description,
          severity: data.severity || 'medium',
          contact_email: data.contactEmail || null,
          browser_info: browserInfo,
          app_version: appVersion,
          page_url: pageUrl,
        })

      if (error) {
        console.error('❌ Bug report submission failed:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Bug report submitted successfully')
      return { success: true }
    } catch (e) {
      console.error('❌ Bug report exception:', e)
      return { success: false, error: 'Ошибка при отправке репорта' }
    }
  },

  /**
   * Получает список репортов (для будущей админки)
   */
  async getReports(filters?: { status?: BugStatus; type?: BugReportType }): Promise<BugReport[]> {
    try {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error('❌ Failed to fetch reports:', error)
        return []
      }

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        description: row.description,
        severity: row.severity,
        status: row.status,
        contactEmail: row.contact_email,
        browserInfo: row.browser_info,
        appVersion: row.app_version,
        pageUrl: row.page_url,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      }))
    } catch (e) {
      console.error('❌ Get reports exception:', e)
      return []
    }
  },

  /**
   * Обновляет статус репорта (для будущей админки)
   */
  async updateStatus(reportId: string, status: BugStatus): Promise<boolean> {
    try {
      const updates: Record<string, unknown> = { status }
      
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('bug_reports')
        .update(updates)
        .eq('id', reportId)

      if (error) {
        console.error('❌ Failed to update status:', error)
        return false
      }

      return true
    } catch (e) {
      console.error('❌ Update status exception:', e)
      return false
    }
  },
}
