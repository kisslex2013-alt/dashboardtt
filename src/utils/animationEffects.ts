/**
 * 🎬 Дополнительные микро-анимации и эффекты
 *
 * Расширение для существующих анимаций
 */

/**
 * Confetti эффект при достижении цели
 */
export const triggerConfetti = () => {
  // Простая CSS-анимация конфетти
  const confettiContainer = document.createElement('div')
  confettiContainer.className = 'confetti-container'
  confettiContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div')
    piece.style.cssText = `
      position: absolute;
      width: ${5 + Math.random() * 10}px;
      height: ${5 + Math.random() * 10}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      top: -20px;
      left: ${Math.random() * 100}%;
      opacity: 1;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      transform: rotate(${Math.random() * 360}deg);
      animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
    `
    confettiContainer.appendChild(piece)
  }

  document.body.appendChild(confettiContainer)

  setTimeout(() => {
    document.body.removeChild(confettiContainer)
  }, 4000)
}

/**
 * Success toast с анимацией
 */
export const showSuccessToast = (message: string) => {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

// Добавить стили для анимаций
const style = document.createElement('style')
style.textContent = `
  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`

if (typeof document !== 'undefined') {
  document.head.appendChild(style)
}

export default {
  triggerConfetti,
  showSuccessToast,
}
