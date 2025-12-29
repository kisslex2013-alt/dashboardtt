import { Component } from 'react'
import PropTypes from 'prop-types'
import { AlertCircle, RefreshCw, Home } from '../../utils/icons'
import { logger } from '../../utils/logger'
import { logErrorToService, getUserFriendlyMessage } from '../../utils/errorHandler'

/**
 * 🛡️ ErrorBoundary - Компонент для обработки ошибок React
 *
 * 🎓 ПОЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ:
 *
 * ErrorBoundary - это специальный компонент React, который перехватывает ошибки
 * в дочерних компонентах и показывает дружелюбный интерфейс вместо "краша" приложения.
 *
 * Правила:
 * - ErrorBoundary ловит только ошибки в компонентах (не в обработчиках событий, async функциях)
 * - Должен быть класс-компонентом (React еще не поддерживает хуки для ErrorBoundary)
 * - Оборачивает части приложения для изоляции ошибок
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      userMessage: null,
    }
  }

  /**
   * Обновляет состояние при возникновении ошибки
   * @param {Error} error - объект ошибки
   * @param {Object} errorInfo - информация об ошибке
   */
  static getDerivedStateFromError(error) {
    // Обновляем состояние для показа UI ошибки
    return { hasError: true }
  }

  /**
   * Логирует информацию об ошибке
   * @param {Error} error - объект ошибки
   * @param {Object} errorInfo - информация об ошибке (stack trace)
   */
  componentDidCatch(error, errorInfo) {
    // Используем централизованную систему обработки ошибок
    logErrorToService(error, errorInfo)

    this.setState({
      error,
      errorInfo,
      userMessage: getUserFriendlyMessage(error), // Понятное сообщение для пользователя
    })

    // Вызываем callback из props, если он есть
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * Сбрасывает состояние ошибки
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      userMessage: null,
    })
  }

  /**
   * Перезагружает страницу
   */
  handleReload = () => {
    window.location.reload()
  }

  /**
   * Переходит на главную страницу
   */
  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Если есть fallback UI из props, используем его
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      // Показываем стандартный UI ошибки
      // ✅ A11Y: Улучшаем accessibility ErrorBoundary
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
          <div
            className="glass-effect rounded-xl p-8 max-w-2xl w-full border-2 border-red-200 dark:border-red-800"
            role="alert"
            aria-live="assertive"
            aria-label="Ошибка приложения"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Произошла ошибка
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {this.state.userMessage ||
                    'Что-то пошло не так. Не волнуйтесь, ваши данные в безопасности.'}
                </p>

                {/* Детали ошибки (только в режиме разработки) */}
                {import.meta.env.DEV && this.state.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    {/* ✅ A11Y: Улучшаем контраст для текста ошибок */}
                    <p className="text-sm font-mono text-red-900 dark:text-red-100 break-all">
                      <strong>Ошибка:</strong> {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-700 dark:text-red-300">
                          Stack trace
                        </summary>
                        {/* ✅ A11Y: Улучшаем контраст для stack trace */}
                        <pre className="mt-2 text-xs text-red-900 dark:text-red-100 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={this.handleReset}
                className="glass-button px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Попробовать снова
              </button>

              <button
                onClick={this.handleReload}
                className="glass-button px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-500 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Перезагрузить страницу
              </button>

              <button
                onClick={this.handleGoHome}
                className="glass-button px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-500 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>

            {/* Полезные советы */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Что можно сделать:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Попробуйте обновить страницу</li>
                <li>Очистите кеш браузера</li>
                <li>Проверьте консоль разработчика (F12) для подробностей</li>
                <li>Если проблема сохраняется, сообщите разработчикам</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    // Если ошибки нет, рендерим дочерние компоненты как обычно
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
}
