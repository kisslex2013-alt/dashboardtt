/**
 * 🔘 Компонент переключателя (Toggle Switch)
 * 
 * Компактный переключатель в стиле проекта
 */

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Toggle({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'sm',
  className = ''
}: ToggleProps) {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11'
  }
  
  const thumbSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4'
  }
  
  const thumbTranslateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-6' : 'translate-x-1'
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) {
          onChange(!checked)
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`
        relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white transition-transform duration-200 ease-in-out
          ${thumbSizeClasses[size]}
          ${thumbTranslateClasses[size]}
        `}
      />
    </button>
  )
}

