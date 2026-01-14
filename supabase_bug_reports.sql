-- ============================================
-- Bug Reports System for Time Tracker Dashboard
-- ============================================

-- Создание таблицы для баг-репортов
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Пользователь (опционально для анонимных репортов)
  user_id TEXT,
  
  -- Тип репорта: bug, feature, feedback
  type TEXT NOT NULL DEFAULT 'bug' CHECK (type IN ('bug', 'feature', 'feedback')),
  
  -- Основная информация
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Серьёзность: low, medium, high, critical
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Статус: new, in_progress, resolved, closed
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  
  -- Системная информация (автособирается)
  browser_info JSONB,
  app_version TEXT,
  page_url TEXT,
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Email для обратной связи (опционально)
  contact_email TEXT
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_type ON bug_reports(type);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);

-- RLS (Row Level Security) политики
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Политика: любой может создавать репорты (анонимные разрешены)
CREATE POLICY "Anyone can insert bug reports" 
  ON bug_reports 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Политика: только авторизованные могут читать свои репорты
CREATE POLICY "Users can read own reports" 
  ON bug_reports 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid()::text OR user_id IS NULL);

-- Комментарии для документации
COMMENT ON TABLE bug_reports IS 'Таблица для хранения баг-репортов и обратной связи от пользователей';
COMMENT ON COLUMN bug_reports.type IS 'Тип: bug (баг), feature (идея), feedback (отзыв)';
COMMENT ON COLUMN bug_reports.severity IS 'Серьёзность: low, medium, high, critical';
COMMENT ON COLUMN bug_reports.status IS 'Статус обработки: new, in_progress, resolved, closed';
COMMENT ON COLUMN bug_reports.browser_info IS 'JSON с информацией о браузере и ОС';
