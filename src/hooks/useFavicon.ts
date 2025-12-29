/**
 * 🎨 Хук для управления анимацией фавикона браузера
 */

import { useEffect, useRef } from 'react'
import { useNotificationsSettings } from '../store/useSettingsStore'

type AnimationStyle = 'pulse' | 'blink' | 'rotate' | 'wave' | 'gradient' | 'morph' | 'particles' | 'breathe' | 'data-pulse'
type AnimationSpeed = 'slow' | 'normal' | 'fast'

interface FaviconState {
  isTimerActive: boolean
  isPaused: boolean
  faviconAnimationEnabled: boolean
  faviconAnimationStyle: AnimationStyle
  faviconAnimationColor: string
  faviconAnimationSpeed: AnimationSpeed
}

export function useFavicon(isTimerActive: boolean, isPaused: boolean): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifications = useNotificationsSettings()
  const {
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed,
  } = notifications

  const stateRef = useRef<FaviconState>({
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle: faviconAnimationStyle as AnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed: faviconAnimationSpeed as AnimationSpeed,
  })

  useEffect(() => {
    stateRef.current = {
      isTimerActive,
      isPaused,
      faviconAnimationEnabled,
      faviconAnimationStyle: faviconAnimationStyle as AnimationStyle,
      faviconAnimationColor,
      faviconAnimationSpeed: faviconAnimationSpeed as AnimationSpeed,
    }
  }, [
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed,
  ])

  const updateFavicon = (url: string): void => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
  }

  const drawFavicon = (
    isPaused: boolean,
    animationValue: number = 1,
    styleOverride: AnimationStyle | null = null,
    colorOverride: string | null = null
  ): string => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')!
      const currentState = stateRef.current
      const color = colorOverride || currentState.faviconAnimationColor || '#3b82f6'
      const style = styleOverride || currentState.faviconAnimationStyle || 'pulse'
      const enabled = currentState.faviconAnimationEnabled

      if (isPaused || !enabled) {
        ctx.fillStyle = isPaused ? '#9ca3af' : color
        ctx.beginPath()
        ctx.arc(16, 16, 14, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        switch (style) {
          case 'pulse': {
            ctx.fillStyle = color
            ctx.beginPath()
            const radius = 14 * animationValue
            ctx.arc(16, 16, Math.max(5, radius), 0, 2 * Math.PI)
            ctx.fill()
            break
          }

          case 'blink': {
            ctx.globalAlpha = animationValue
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(16, 16, 14, 0, 2 * Math.PI)
            ctx.fill()
            ctx.globalAlpha = 1
            break
          }

          case 'rotate':
            ctx.save()
            ctx.translate(16, 16)
            ctx.rotate(animationValue * Math.PI * 2)
            ctx.translate(-16, -16)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(16, 16, 14, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.moveTo(16, 4)
            ctx.lineTo(12, 12)
            ctx.lineTo(20, 12)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
            break

          case 'wave': {
            ctx.fillStyle = color
            for (let i = 0; i < 3; i++) {
              ctx.globalAlpha = (1 - Math.abs(animationValue - i * 0.5)) * 0.7
              ctx.beginPath()
              const waveRadius = 14 + Math.sin(animationValue * Math.PI * 2 + i) * 3
              ctx.arc(16, 16, Math.max(5, waveRadius), 0, 2 * Math.PI)
              ctx.fill()
            }
            ctx.globalAlpha = 1
            break
          }

          case 'gradient': {
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14)
            const hue = (animationValue * 360) % 360
            gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`)
            gradient.addColorStop(1, `hsl(${hue}, 70%, 30%)`)
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(16, 16, 14, 0, 2 * Math.PI)
            ctx.fill()
            break
          }

          case 'morph': {
            const morphTime = animationValue
            ctx.fillStyle = color
            ctx.save()
            ctx.translate(16, 16)
            const size = 14

            if (morphTime < 1) {
              const progress = morphTime
              const cornerRadius = progress < 0.5 ? (1 - progress * 2) * 7 : (progress - 0.5) * 2 * 7
              ctx.beginPath()
              ctx.moveTo(-size + cornerRadius, -size)
              ctx.lineTo(size - cornerRadius, -size)
              ctx.quadraticCurveTo(size, -size, size, -size + cornerRadius)
              ctx.lineTo(size, size - cornerRadius)
              ctx.quadraticCurveTo(size, size, size - cornerRadius, size)
              ctx.lineTo(-size + cornerRadius, size)
              ctx.quadraticCurveTo(-size, size, -size, size - cornerRadius)
              ctx.lineTo(-size, -size + cornerRadius)
              ctx.quadraticCurveTo(-size, -size, -size + cornerRadius, -size)
              ctx.closePath()
              ctx.fill()
            } else if (morphTime < 2) {
              ctx.beginPath()
              ctx.arc(0, 0, size, 0, 2 * Math.PI)
              ctx.fill()
            } else {
              ctx.beginPath()
              ctx.moveTo(0, -size)
              ctx.lineTo(size * 0.866, size * 0.7)
              ctx.lineTo(-size * 0.866, size * 0.7)
              ctx.closePath()
              ctx.fill()
            }

            ctx.restore()
            break
          }

          case 'particles': {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(16, 16, 14, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 + animationValue * Math.PI * 2
              const particleX = 16 + Math.cos(angle) * 22
              const particleY = 16 + Math.sin(angle) * 22
              ctx.globalAlpha = 0.8
              ctx.beginPath()
              ctx.arc(particleX, particleY, 4, 0, 2 * Math.PI)
              ctx.fill()
            }
            ctx.globalAlpha = 1
            break
          }

          case 'breathe': {
            ctx.fillStyle = color
            ctx.beginPath()
            const breatheRadius = 14 + Math.sin(animationValue * Math.PI * 2) * 3
            ctx.arc(16, 16, breatheRadius, 0, 2 * Math.PI)
            ctx.fill()
            break
          }

          case 'data-pulse': {
            const pulseValue = 0.5 + Math.sin(animationValue * Math.PI * 2) * 0.5

            const circles = [
              { r: 12, color: '#3B82F6', opacity: 0.2 },
              { r: 10, color: '#10B981', opacity: 0.3 },
              { r: 8, color: '#F59E0B', opacity: 0.4 },
            ]

            circles.forEach((circle, i) => {
              const scale = 1 + (pulseValue * 0.15 * (i + 1)) / 3
              ctx.strokeStyle = circle.color
              ctx.globalAlpha = circle.opacity * (0.7 + pulseValue * 0.3)
              ctx.lineWidth = 1.5
              ctx.beginPath()
              ctx.arc(16, 16, circle.r * scale, 0, 2 * Math.PI)
              ctx.stroke()
            })

            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.globalAlpha = 0.8
            ctx.beginPath()
            const waveOffset = (animationValue * 0.3) % 1
            const wavePoints = 8
            for (let i = 0; i <= wavePoints; i++) {
              const x = 4 + (i / wavePoints) * 24
              const y = 16 + Math.sin((i / wavePoints + waveOffset) * Math.PI * 2) * 4 * pulseValue
              if (i === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            }
            ctx.stroke()

            ctx.strokeStyle = '#3B82F6'
            ctx.lineWidth = 2
            ctx.globalAlpha = 1
            ctx.beginPath()
            ctx.arc(16, 16, 3, 0, 2 * Math.PI)
            ctx.stroke()

            ctx.globalAlpha = 1
            break
          }

          default:
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(16, 16, 14, 0, 2 * Math.PI)
            ctx.fill()
        }
      }

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Ошибка рисования фавикона:', error)
      const fallbackCanvas = document.createElement('canvas')
      fallbackCanvas.width = 32
      fallbackCanvas.height = 32
      const fallbackCtx = fallbackCanvas.getContext('2d')!
      fallbackCtx.fillStyle = '#3b82f6'
      fallbackCtx.beginPath()
      fallbackCtx.arc(16, 16, 14, 0, 2 * Math.PI)
      fallbackCtx.fill()
      return fallbackCanvas.toDataURL('image/png')
    }
  }

  useEffect(() => {
    const speedMap: Record<AnimationSpeed, number> = { slow: 4000, normal: 2000, fast: 1000 }
    const animationSpeed = speedMap[stateRef.current.faviconAnimationSpeed] || 2000

    let animationFrameId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isRunning = true
    let lastUpdateTime = Date.now()

    const updateFaviconAnimation = (): void => {
      const currentState = stateRef.current

      if (!isRunning || !currentState.isTimerActive) {
        return
      }

      const now = Date.now()
      const isVisible = document.visibilityState === 'visible'

      if (now - lastUpdateTime < 16 && isVisible) {
        animationFrameId = requestAnimationFrame(updateFaviconAnimation)
        return
      }

      lastUpdateTime = now

      let animationValue = 1

      if (
        currentState.faviconAnimationEnabled &&
        !currentState.isPaused &&
        currentState.isTimerActive
      ) {
        const style = currentState.faviconAnimationStyle || 'pulse'
        const time = now / animationSpeed

        switch (style) {
          case 'pulse':
            animationValue = 0.75 + Math.sin(time * Math.PI * 2) * 0.25
            break
          case 'blink':
            animationValue = Math.floor(time) % 2 === 0 ? 1 : 0.2
            break
          case 'rotate':
            animationValue = (time * 0.5) % 1
            break
          case 'wave':
            animationValue = (time * 2) % 1
            break
          case 'gradient':
            animationValue = (time * 0.3) % 1
            break
          case 'morph':
            animationValue = (time * 0.8) % 3
            break
          case 'particles':
            animationValue = (time * 0.8) % 1
            break
          case 'breathe':
            animationValue = 0.5 + Math.sin(time * Math.PI * 2) * 0.5
            break
          case 'data-pulse':
            animationValue = time * 1.5
            break
          default:
            animationValue = 1
        }
      }

      try {
        const faviconUrl = drawFavicon(
          currentState.isPaused || !currentState.isTimerActive,
          animationValue,
          currentState.faviconAnimationStyle,
          currentState.faviconAnimationColor
        )
        updateFavicon(faviconUrl)
      } catch (error) {
        console.error('Ошибка обновления фавикона:', error)
        isRunning = false
        return
      }

      if (!currentState.isTimerActive) {
        return
      }

      if (isVisible) {
        animationFrameId = requestAnimationFrame(updateFaviconAnimation)
      } else {
        timeoutId = setTimeout(updateFaviconAnimation, 100)
      }
    }

    const handleVisibilityChange = (): void => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const currentState = stateRef.current
      if (isRunning && currentState.isTimerActive) {
        lastUpdateTime = 0
        updateFaviconAnimation()
      }
    }

    if (stateRef.current.isTimerActive) {
      updateFaviconAnimation()
      document.addEventListener('visibilitychange', handleVisibilityChange)
    } else {
      try {
        const currentState = stateRef.current
        const faviconUrl = drawFavicon(
          true,
          1,
          currentState.faviconAnimationStyle,
          currentState.faviconAnimationColor
        )
        updateFavicon(faviconUrl)
      } catch (error) {
        console.error('Ошибка установки статичного фавикона:', error)
      }
    }

    return () => {
      isRunning = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    isTimerActive,
    isPaused,
    faviconAnimationEnabled,
    faviconAnimationStyle,
    faviconAnimationColor,
    faviconAnimationSpeed,
  ])
}
