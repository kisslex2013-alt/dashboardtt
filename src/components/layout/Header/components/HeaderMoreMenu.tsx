import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Settings, HelpCircle, Info } from '../../../../utils/icons'
import { useHeaderDropdowns } from '../hooks/useHeaderDropdowns'

interface Props {
  onShowSoundSettings?: () => void
  onShowTutorial: () => void
  onShowAbout: () => void
}

export function HeaderMoreMenu({
  onShowSoundSettings,
  onShowTutorial,
  onShowAbout
}: Props) {
  const {
    isDropdownOpen,
    setIsDropdownOpen,
    shouldMountDropdown,
    isAnimatingDropdown,
    isExitingDropdown,
    dropdownRef,
    dropdownPosition,
    setDropdownPosition
  } = useHeaderDropdowns()

  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownRef, setIsDropdownOpen])

  useEffect(() => {
    if (shouldMountDropdown && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const offset = 8
        const dropdownWidth = 224 // w-56 is 14rem = 224px

        let right = viewportWidth - rect.right
        if (right + dropdownWidth > viewportWidth) {
          right = Math.max(offset, viewportWidth - dropdownWidth - offset)
        }
        if (right < 0) right = offset

        setDropdownPosition({ top: rect.bottom + offset, right })
      }

      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [shouldMountDropdown, setDropdownPosition])

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`glass-button p-2 rounded-lg transition-normal ${
          isDropdownOpen ? 'bg-blue-500/10 text-blue-500' : 'hover-lift-scale click-shrink'
        }`}
        title="Дополнительно"
        data-tour="settings"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {shouldMountDropdown && createPortal(
        <div
          ref={dropdownRef}
          className={`
            fixed z-[999999] mt-2
            w-56 glass-effect border border-white/20 dark:border-gray-700/50 
            shadow-2xl rounded-2xl overflow-hidden
            transition-all duration-200 transform origin-top-right
            ${
              isAnimatingDropdown && !isExitingDropdown
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }
          `}
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <div className="p-2 space-y-1">
            {onShowSoundSettings && (
              <button
                onClick={() => { onShowSoundSettings(); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200"
                data-icon-id="header-settings"
              >
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Настройки</span>
              </button>
            )}

            <button
              onClick={() => { onShowTutorial(); setIsDropdownOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200"
              data-icon-id="header-help"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Справка <span className="text-xs text-gray-400 ml-1">(F1)</span></span>
            </button>

            <button
              onClick={() => { onShowAbout(); setIsDropdownOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200"
              data-icon-id="header-about"
            >
              <Info className="w-4 h-4 text-purple-500" />
              <span>О приложении</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
