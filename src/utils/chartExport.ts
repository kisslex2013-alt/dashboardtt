/**
 * 📥 Утилиты для экспорта графиков
 *
 * Позволяет скачивать графики в форматах PNG и SVG
 *
 * Особенности:
 * - Экспорт в PNG с настраиваемым качеством
 * - Экспорт в SVG с сохранением векторной графики
 * - Автоматическое именование файлов
 * - Поддержка темной/светлой темы
 *
 * Phase 2: UI/UX Improvements - Task 2.5.2
 */

/**
 * Экспортирует SVG элемент в PNG изображение
 *
 * @param svgElement - SVG элемент для экспорта
 * @param fileName - Имя файла (без расширения)
 * @param scale - Масштаб изображения (2 = 2x quality)
 */
export async function exportChartAsPNG(
  svgElement: SVGSVGElement,
  fileName: string = 'chart',
  scale: number = 2
): Promise<void> {
  try {
    // Клонируем SVG для модификации
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

    // Получаем размеры
    const bbox = svgElement.getBoundingClientRect()
    const {width} = bbox
    const {height} = bbox

    // Устанавливаем размеры для клонированного SVG
    clonedSvg.setAttribute('width', String(width * scale))
    clonedSvg.setAttribute('height', String(height * scale))
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    // Сериализуем SVG в строку
    const svgString = new XMLSerializer().serializeToString(clonedSvg)

    // Создаем Blob из SVG
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Создаем Image для конвертации в PNG
    const image = new Image()
    image.width = width * scale
    image.height = height * scale

    await new Promise<void>((resolve, reject) => {
      image.onload = () => {
        // Создаем canvas
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Заливаем фон белым цветом (для прозрачности SVG)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Рисуем изображение
        ctx.drawImage(image, 0, 0, width * scale, height * scale)

        // Конвертируем canvas в PNG
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }

            // Скачиваем файл
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Очищаем URL
            URL.revokeObjectURL(url)
            URL.revokeObjectURL(svgUrl)

            resolve()
          },
          'image/png',
          1.0
        )
      }

      image.onerror = () => {
        reject(new Error('Failed to load image'))
        URL.revokeObjectURL(svgUrl)
      }

      image.src = svgUrl
    })
  } catch (error) {
    console.error('Error exporting chart as PNG:', error)
    throw error
  }
}

/**
 * Экспортирует SVG элемент в SVG файл
 *
 * @param svgElement - SVG элемент для экспорта
 * @param fileName - Имя файла (без расширения)
 */
export function exportChartAsSVG(svgElement: SVGSVGElement, fileName: string = 'chart'): void {
  try {
    // Клонируем SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

    // Добавляем XML namespace если его нет
    if (!clonedSvg.getAttribute('xmlns')) {
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    }

    // Сериализуем SVG
    const svgString = new XMLSerializer().serializeToString(clonedSvg)

    // Создаем Blob
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    // Скачиваем файл
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Очищаем URL
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting chart as SVG:', error)
    throw error
  }
}

/**
 * Генерирует имя файла на основе текущей даты и названия графика
 *
 * @param chartName - Название графика
 * @returns Отформатированное имя файла
 */
export function generateChartFileName(chartName: string): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
  const sanitizedName = chartName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  return `${sanitizedName}_${dateStr}_${timeStr}`
}

/**
 * Находит SVG элемент внутри контейнера графика
 *
 * @param containerElement - Контейнер с графиком
 * @returns SVG элемент или null
 */
export function findChartSVG(containerElement: HTMLElement): SVGSVGElement | null {
  // Recharts обычно создает SVG как прямой дочерний элемент ResponsiveContainer
  const svg = containerElement.querySelector('svg')
  return svg
}

/**
 * Экспортирует график по ссылке на контейнер
 *
 * @param containerRef - React ref на контейнер графика
 * @param chartName - Название графика
 * @param format - Формат экспорта ('png' | 'svg')
 * @param scale - Масштаб для PNG (по умолчанию 2)
 */
export async function exportChart(
  containerRef: React.RefObject<HTMLElement>,
  chartName: string,
  format: 'png' | 'svg' = 'png',
  scale: number = 2
): Promise<void> {
  if (!containerRef.current) {
    throw new Error('Container ref is not available')
  }

  const svg = findChartSVG(containerRef.current)
  if (!svg) {
    throw new Error('SVG element not found in container')
  }

  const fileName = generateChartFileName(chartName)

  if (format === 'png') {
    await exportChartAsPNG(svg, fileName, scale)
  } else {
    exportChartAsSVG(svg, fileName)
  }
}
