/**
 * 🎓 Парсер для plans.md
 */

interface Task {
  number: string
  title: string
  description: string
  status: 'planning' | 'inProgress' | 'completed'
  priority: string
  time: string
  complexity: string
}

interface TaskList {
  planning: Task[]
  inProgress: Task[]
  completed: Task[]
}

export interface ImplementationPlanResult {
  critical: TaskList
  important: TaskList
  desirable: TaskList
}

type SectionKey = 'critical' | 'important' | 'desirable'

function saveTask(task: Task, section: SectionKey | null, result: ImplementationPlanResult): void {
  if (!section || !result[section]) return

  if (task.status === 'completed') {
    result[section].completed.push(task)
  } else if (task.status === 'inProgress') {
    result[section].inProgress.push(task)
  } else {
    result[section].planning.push(task)
  }
}

export function parseImplementationPlan(planContent: string): ImplementationPlanResult {
  const result: ImplementationPlanResult = {
    critical: { planning: [], inProgress: [], completed: [] },
    important: { planning: [], inProgress: [], completed: [] },
    desirable: { planning: [], inProgress: [], completed: [] },
  }

  const lines = planContent.split('\n')
  let currentSection: SectionKey | null = null
  let currentTask: Task | null = null
  let inTodoSection = false
  const taskMap = new Map<string, Task>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (
      line.includes('## ✅ TO DO:') ||
      line.includes('## ✅ TO DO: Статус выполнения задач') ||
      line.includes('## 📝 TO DO СПИСОК') ||
      line.includes('## 📝 TO DO')
    ) {
      inTodoSection = true
      continue
    }

    if (line.startsWith('## ') && !line.includes('TO DO') && !line.includes('TO DO СПИСОК')) {
      inTodoSection = false
    }

    if (
      line.includes('🔥 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') ||
      line.includes('🔴 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') ||
      line.includes('### 🔥 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') ||
      line.includes('### 🔴 КОД: Критические исправления')
    ) {
      currentSection = 'critical'
      continue
    }
    if (
      line.includes('🟡 КРИТИЧНОСТЬ: ВАЖНО') ||
      line.includes('### 🟡 КРИТИЧНОСТЬ: ВАЖНО') ||
      line.includes('### 🟡 КРИТИЧНОСТЬ: ВАЖНО (сделать на этой неделе)')
    ) {
      currentSection = 'important'
      continue
    }
    if (
      line.includes('🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО') ||
      line.includes('### 🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО') ||
      line.includes('### 🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО (будущие версии)')
    ) {
      currentSection = 'desirable'
      continue
    }

    if (
      line.startsWith('## 🔴 КОД:') ||
      line.startsWith('## ⚡ ФУНКЦИОНАЛ:') ||
      line.startsWith('## 🎨 ВИЗУАЛ:')
    ) {
      if (currentTask) {
        saveTask(currentTask, currentSection, result)
        currentTask = null
      }
      if (line.includes('КОД') || line.includes('ФУНКЦИОНАЛ') || line.includes('ВИЗУАЛ')) {
        if (!currentSection) {
          if (line.includes('🔥') || line.includes('🔴')) {
            currentSection = 'critical'
          } else if (line.includes('🟡')) {
            currentSection = 'important'
          } else if (line.includes('🟢')) {
            currentSection = 'desirable'
          }
        }
      }
      continue
    }

    if (!currentSection) continue

    const taskMatch = line.match(/^####\s*(\d+)\.\s*(.+)$/)
    if (taskMatch) {
      if (currentTask) {
        saveTask(currentTask, currentSection, result)
      }
      currentTask = {
        number: taskMatch[1],
        title: taskMatch[2].replace(/[*`]/g, '').trim(),
        description: '',
        status: 'planning',
        priority: '',
        time: '',
        complexity: '',
      }
      continue
    }

    if (!currentTask) continue

    if (line.startsWith('**Статус:**')) {
      const statusMatch = line.match(/\*\*Статус:\*\*\s*(.+)$/)
      if (statusMatch) {
        const status = statusMatch[1].trim().toLowerCase()
        if (
          status.includes('✅') ||
          status.includes('выполнено') ||
          status.includes('completed')
        ) {
          currentTask.status = 'completed'
        } else if (
          status.includes('⚠️') ||
          status.includes('в разработке') ||
          status.includes('inprogress') ||
          status.includes('выполняется') ||
          status.includes('критично') ||
          status.includes('важно')
        ) {
          currentTask.status = 'inProgress'
        } else {
          currentTask.status = 'planning'
        }
      }
      continue
    }

    if (inTodoSection) {
      const newFormatMatch = line.match(/^-\s*(✅|⚠️|📋)\s*\*\*(.+?)\*\*\s*-\s*(.+)$/)
      if (newFormatMatch) {
        const statusIcon = newFormatMatch[1]
        const taskTitle = newFormatMatch[2].trim()
        const taskDescription = newFormatMatch[3].trim()

        let status: Task['status'] = 'planning'
        if (statusIcon === '✅') {
          status = 'completed'
        } else if (statusIcon === '⚠️') {
          status = 'inProgress'
        }

        let section: SectionKey = currentSection || 'important'
        if (line.includes('🔴') || taskTitle.includes('критичн')) {
          section = 'critical'
        } else if (line.includes('🟡') || taskTitle.includes('важн')) {
          section = 'important'
        } else if (line.includes('🟢') || taskTitle.includes('желательн')) {
          section = 'desirable'
        }

        const task: Task = {
          number: String(taskMap.size + 1),
          title: taskTitle,
          description: taskDescription,
          status,
          priority: '',
          time: '',
          complexity: '',
        }

        taskMap.set(task.number, task)
        saveTask(task, section, result)
        continue
      }

      const completedMatch = line.match(/^-\s*\[(x|X)\]\s*(\d+)\.\s*(.+?)(?:\s*✅|$)/)
      const planningMatch = line.match(/^-\s*\[\s*\]\s*(\d+)\.\s*(.+?)$/)

      if (completedMatch) {
        const taskNumber = completedMatch[2]
        const taskTitle = completedMatch[3].trim().replace(/\s*✅\s*\*\*ВЫПОЛНЕНО\*\*.*$/, '').trim()
        const task: Task = {
          number: taskNumber,
          title: taskTitle,
          description: '',
          status: 'completed',
          priority: '',
          time: '',
          complexity: '',
        }
        taskMap.set(taskNumber, task)
        saveTask(task, currentSection || 'important', result)
        continue
      } else if (planningMatch) {
        const taskNumber = planningMatch[1]
        const taskTitle = planningMatch[2].trim()
        const task: Task = {
          number: taskNumber,
          title: taskTitle,
          description: '',
          status: 'planning',
          priority: '',
          time: '',
          complexity: '',
        }
        taskMap.set(taskNumber, task)
        saveTask(task, currentSection || 'important', result)
        continue
      }

      if (
        line.includes('### 🔴 КРИТИЧНО') ||
        line.includes('## 🔴 КРИТИЧНО') ||
        line.includes('### 🔴 Критичные задачи') ||
        line.includes('## 🔴 Критичные задачи')
      ) {
        currentSection = 'critical'
        continue
      }
      if (
        line.includes('### 🟡 ВАЖНО') ||
        line.includes('## 🟡 ВАЖНО') ||
        line.includes('### 🟡 Важные задачи') ||
        line.includes('## 🟡 Важные задачи')
      ) {
        currentSection = 'important'
        continue
      }
      if (
        line.includes('### 🟢 ЖЕЛАТЕЛЬНО') ||
        line.includes('## 🟢 ЖЕЛАТЕЛЬНО') ||
        line.includes('### 💚 Желательные задачи') ||
        line.includes('## 💚 Желательные задачи')
      ) {
        currentSection = 'desirable'
        continue
      }
    }

    if (line.startsWith('**Приоритет:**')) {
      const priorityMatch = line.match(/\*\*Приоритет:\*\*\s*(.+)$/)
      if (priorityMatch) {
        currentTask.priority = priorityMatch[1].trim()
      }
      continue
    }

    if (line.startsWith('**Время:**')) {
      const timeMatch = line.match(/\*\*Время:\*\*\s*(.+)$/)
      if (timeMatch) {
        currentTask.time = timeMatch[1].trim()
      }
      continue
    }

    if (line.startsWith('**Сложность:**')) {
      const complexityMatch = line.match(/\*\*Сложность:\*\*\s*(.+)$/)
      if (complexityMatch) {
        currentTask.complexity = complexityMatch[1].trim()
      }
      continue
    }

    if (line.startsWith('**Описание:**') || line.startsWith('**Проблема:**')) {
      const descMatch = line.match(/\*\*(?:Описание|Проблема):\*\*\s*(.+)$/)
      if (descMatch) {
        currentTask.description = descMatch[1].trim()
      }
      continue
    }

    if (line.startsWith('- ') && currentTask) {
      const text = line.substring(2).trim()
      if (currentTask.description) {
        currentTask.description += `; ${text}`
      } else {
        currentTask.description = text
      }
    }
  }

  if (currentTask) {
    saveTask(currentTask, currentSection, result)
  }

  return result
}

export async function loadImplementationPlan(): Promise<ImplementationPlanResult> {
  try {
    const response = await fetch('/plans.md')
    if (!response.ok) {
      throw new Error(`Failed to load implementation plan: ${response.status}`)
    }
    const content = await response.text()
    return parseImplementationPlan(content)
  } catch (error) {
    console.error('Error loading implementation plan:', error)
    return {
      critical: { planning: [], inProgress: [], completed: [] },
      important: { planning: [], inProgress: [], completed: [] },
      desirable: { planning: [], inProgress: [], completed: [] },
    }
  }
}
