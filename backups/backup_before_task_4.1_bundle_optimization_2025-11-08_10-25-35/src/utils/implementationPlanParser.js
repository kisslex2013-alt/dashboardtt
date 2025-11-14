/**
 * 🎓 Парсер для IMPLEMENTATION_PLAN.md
 * 
 * Извлекает задачи из плана реализации и структурирует их по статусам:
 * - В плане (планируется)
 * - В разработке (выполняется)
 * - Выполнено (завершено)
 */

/**
 * Парсит IMPLEMENTATION_PLAN.md и возвращает структурированные задачи
 * @param {string} planContent - содержимое IMPLEMENTATION_PLAN.md
 * @returns {Object} объект с задачами по категориям и статусам
 */
export function parseImplementationPlan(planContent) {
  const result = {
    critical: { planning: [], inProgress: [], completed: [] },
    important: { planning: [], inProgress: [], completed: [] },
    desirable: { planning: [], inProgress: [], completed: [] }
  };
  
  const lines = planContent.split('\n');
  let currentSection = null; // 'critical', 'important', 'desirable'
  let currentTask = null;
  let inTodoSection = false; // Флаг для секции "## ✅ TO DO: Статус выполнения задач"
  const taskMap = new Map(); // Карта для хранения задач по номеру
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем секцию "TO DO: Статус выполнения задач" или "TO DO СПИСОК"
    if (line.includes('## ✅ TO DO:') || line.includes('## ✅ TO DO: Статус выполнения задач') || 
        line.includes('## 📝 TO DO СПИСОК') || line.includes('## 📝 TO DO')) {
      inTodoSection = true;
      continue;
    }
    
    // Определяем начало новой секции (не TO DO)
    if (line.startsWith('## ') && !line.includes('TO DO') && !line.includes('TO DO СПИСОК')) {
      inTodoSection = false;
    }
    
    // Определяем раздел (🔴 КРИТИЧНОСТЬ, 🟡 КРИТИЧНОСТЬ, 🟢 КРИТИЧНОСТЬ)
    if (line.includes('🔥 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') || line.includes('🔴 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') || 
        line.includes('### 🔥 КРИТИЧНОСТЬ: МАКСИМАЛЬНАЯ') || line.includes('### 🔴 КОД: Критические исправления')) {
      currentSection = 'critical';
      continue;
    }
    if (line.includes('🟡 КРИТИЧНОСТЬ: ВАЖНО') || line.includes('### 🟡 КРИТИЧНОСТЬ: ВАЖНО') ||
        line.includes('### 🟡 КРИТИЧНОСТЬ: ВАЖНО (сделать на этой неделе)')) {
      currentSection = 'important';
      continue;
    }
    if (line.includes('🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО') || line.includes('### 🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО') ||
        line.includes('### 🟢 КРИТИЧНОСТЬ: ЖЕЛАТЕЛЬНО (будущие версии)')) {
      currentSection = 'desirable';
      continue;
    }
    
    // Определяем раздел по заголовкам разделов
    if (line.startsWith('## 🔴 КОД:') || line.startsWith('## ⚡ ФУНКЦИОНАЛ:') || line.startsWith('## 🎨 ВИЗУАЛ:')) {
      // Сбрасываем текущую задачу при переходе к новому разделу
      if (currentTask) {
        saveTask(currentTask, currentSection, result);
        currentTask = null;
      }
      // Определяем приоритет по типу раздела
      if (line.includes('КОД') || line.includes('ФУНКЦИОНАЛ') || line.includes('ВИЗУАЛ')) {
        // Оставляем текущий раздел, если он уже определен
        if (!currentSection) {
          // Если раздел не определен, определяем по содержимому
          if (line.includes('🔥') || line.includes('🔴')) {
            currentSection = 'critical';
          } else if (line.includes('🟡')) {
            currentSection = 'important';
          } else if (line.includes('🟢')) {
            currentSection = 'desirable';
          }
        }
      }
      continue;
    }
    
    if (!currentSection) continue;
    
    // Определяем новую задачу (#### номер. Название)
    const taskMatch = line.match(/^####\s*(\d+)\.\s*(.+)$/);
    if (taskMatch) {
      if (currentTask) {
        // Сохраняем предыдущую задачу
        saveTask(currentTask, currentSection, result);
      }
      currentTask = {
        number: taskMatch[1],
        title: taskMatch[2].replace(/[*`]/g, '').trim(),
        description: '',
        status: 'planning', // по умолчанию
        priority: '',
        time: '',
        complexity: ''
      };
      continue;
    }
    
    if (!currentTask) continue;
    
    // Определяем статус
    if (line.startsWith('**Статус:**')) {
      const statusMatch = line.match(/\*\*Статус:\*\*\s*(.+)$/);
      if (statusMatch) {
        const status = statusMatch[1].trim().toLowerCase();
        if (status.includes('✅') || status.includes('выполнено') || status.includes('completed') || 
            status.includes('**выполнено**') || status.includes('выполнено')) {
          currentTask.status = 'completed';
        } else if (status.includes('⚠️') || status.includes('в разработке') || status.includes('inprogress') ||
                   status.includes('выполняется') || status.includes('критично') || status.includes('важно')) {
          currentTask.status = 'inProgress';
        } else {
          currentTask.status = 'planning';
        }
      }
      continue;
    }
    
    // Определяем статус из нового формата TO DO списка (для секции "## 📝 TO DO СПИСОК")
    if (inTodoSection) {
      // Новый формат: - ✅ **Название** - Описание или - ⚠️ **Название** - Описание или - 📋 **Название** - Описание
      const newFormatMatch = line.match(/^-\s*(✅|⚠️|📋)\s*\*\*(.+?)\*\*\s*-\s*(.+)$/);
      if (newFormatMatch) {
        const statusIcon = newFormatMatch[1];
        const taskTitle = newFormatMatch[2].trim();
        const taskDescription = newFormatMatch[3].trim();
        
        // Определяем статус по иконке
        let status = 'planning';
        if (statusIcon === '✅') {
          status = 'completed';
        } else if (statusIcon === '⚠️') {
          status = 'inProgress';
        } else if (statusIcon === '📋') {
          status = 'planning';
        }
        
        // Определяем раздел по контексту (предыдущие строки с заголовками разделов)
        let section = currentSection || 'important';
        if (line.includes('🔴') || taskTitle.includes('критичн')) {
          section = 'critical';
        } else if (line.includes('🟡') || taskTitle.includes('важн')) {
          section = 'important';
        } else if (line.includes('🟢') || taskTitle.includes('желательн')) {
          section = 'desirable';
        }
        
        // Создаем задачу
        const task = {
          number: String(taskMap.size + 1),
          title: taskTitle,
          description: taskDescription,
          status: status,
          priority: '',
          time: '',
          complexity: ''
        };
        
        taskMap.set(task.number, task);
        saveTask(task, section, result);
        continue;
      }
      
      // Старый формат: чекбоксы [x] или [ ]
      const completedMatch = line.match(/^-\s*\[(x|X)\]\s*(\d+)\.\s*(.+?)(?:\s*✅|$)/);
      const planningMatch = line.match(/^-\s*\[\s*\]\s*(\d+)\.\s*(.+?)$/);
      
      if (completedMatch) {
        // Задача выполнена
        const taskNumber = completedMatch[2];
        const taskTitle = completedMatch[3].trim().replace(/\s*✅\s*\*\*ВЫПОЛНЕНО\*\*.*$/, '').trim();
        const task = {
          number: taskNumber,
          title: taskTitle,
          description: '',
          status: 'completed',
          priority: '',
          time: '',
          complexity: ''
        };
        taskMap.set(taskNumber, task);
        saveTask(task, currentSection || 'important', result);
        continue;
      } else if (planningMatch) {
        // Задача в плане
        const taskNumber = planningMatch[1];
        const taskTitle = planningMatch[2].trim();
        const task = {
          number: taskNumber,
          title: taskTitle,
          description: '',
          status: 'planning',
          priority: '',
          time: '',
          complexity: ''
        };
        taskMap.set(taskNumber, task);
        saveTask(task, currentSection || 'important', result);
        continue;
      }
      
      // Формат без номера: - [x] Название или - [ ] Название
      const simpleCompletedMatch = line.match(/^-\s*\[(x|X)\]\s*(.+?)(?:\s*✅|$)/);
      const simplePlanningMatch = line.match(/^-\s*\[\s*\]\s*(.+?)$/);
      
      if (simpleCompletedMatch && !completedMatch) {
        // Задача выполнена (без номера)
        const taskTitle = simpleCompletedMatch[2].trim().replace(/\s*✅\s*\*\*ВЫПОЛНЕНО\*\*.*$/, '').trim();
        const task = {
          number: String(taskMap.size + 1),
          title: taskTitle,
          description: '',
          status: 'completed',
          priority: '',
          time: '',
          complexity: ''
        };
        taskMap.set(task.number, task);
        saveTask(task, currentSection || 'important', result);
        continue;
      } else if (simplePlanningMatch && !planningMatch) {
        // Задача в плане (без номера)
        const taskTitle = simplePlanningMatch[1].trim();
        const task = {
          number: String(taskMap.size + 1),
          title: taskTitle,
          description: '',
          status: 'planning',
          priority: '',
          time: '',
          complexity: ''
        };
        taskMap.set(task.number, task);
        saveTask(task, currentSection || 'important', result);
        continue;
      }
      
      // Определяем раздел по заголовкам в секции TO DO
      if (line.includes('### 🔴 КРИТИЧНО') || line.includes('## 🔴 КРИТИЧНО') || 
          line.includes('### 🔴 Критичные задачи') || line.includes('## 🔴 Критичные задачи')) {
        currentSection = 'critical';
        continue;
      }
      if (line.includes('### 🟡 ВАЖНО') || line.includes('## 🟡 ВАЖНО') ||
          line.includes('### 🟡 Важные задачи') || line.includes('## 🟡 Важные задачи')) {
        currentSection = 'important';
        continue;
      }
      if (line.includes('### 🟢 ЖЕЛАТЕЛЬНО') || line.includes('## 🟢 ЖЕЛАТЕЛЬНО') ||
          line.includes('### 💚 Желательные задачи') || line.includes('## 💚 Желательные задачи')) {
        currentSection = 'desirable';
        continue;
      }
      
      // Определяем раздел по подзаголовкам (#### КОД, #### ФУНКЦИОНАЛ, #### ВИЗУАЛ)
      // Эти подзаголовки не меняют раздел, они только уточняют категорию задач
      if (line.includes('#### КОД') || line.includes('#### ФУНКЦИОНАЛ') || line.includes('#### ВИЗУАЛ')) {
        // Оставляем текущий раздел, не меняем его
        continue;
      }
    }
    
    // Определяем приоритет
    if (line.startsWith('**Приоритет:**')) {
      const priorityMatch = line.match(/\*\*Приоритет:\*\*\s*(.+)$/);
      if (priorityMatch) {
        currentTask.priority = priorityMatch[1].trim();
      }
      continue;
    }
    
    // Определяем время
    if (line.startsWith('**Время:**')) {
      const timeMatch = line.match(/\*\*Время:\*\*\s*(.+)$/);
      if (timeMatch) {
        currentTask.time = timeMatch[1].trim();
      }
      continue;
    }
    
    // Определяем сложность
    if (line.startsWith('**Сложность:**')) {
      const complexityMatch = line.match(/\*\*Сложность:\*\*\s*(.+)$/);
      if (complexityMatch) {
        currentTask.complexity = complexityMatch[1].trim();
      }
      continue;
    }
    
    // Определяем описание
    if (line.startsWith('**Описание:**') || line.startsWith('**Проблема:**')) {
      const descMatch = line.match(/\*\*(?:Описание|Проблема):\*\*\s*(.+)$/);
      if (descMatch) {
        currentTask.description = descMatch[1].trim();
      }
      continue;
    }
    
    // Если строка начинается с "-", это может быть часть описания
    if (line.startsWith('- ') && currentTask.description && currentTask.description.length < 200) {
      currentTask.description += ' ' + line.substring(2).trim();
    }
  }
  
  // Сохраняем последнюю задачу
  if (currentTask) {
    saveTask(currentTask, currentSection, result);
  }
  
  // Объединяем задачи из taskMap с задачами из основной секции
  // Если задача уже есть в result, обновляем статус из taskMap
  taskMap.forEach((todoTask, taskNumber) => {
    // Ищем задачу в result по номеру
    let found = false;
    for (const sectionKey of ['critical', 'important', 'desirable']) {
      const section = result[sectionKey];
      for (const statusKey of ['planning', 'inProgress', 'completed']) {
        const index = section[statusKey].findIndex(t => t.number === taskNumber);
        if (index !== -1) {
          // Обновляем статус задачи
          if (todoTask.status !== section[statusKey][index].status) {
            // Удаляем из старого статуса
            section[statusKey].splice(index, 1);
            // Добавляем в новый статус
            saveTask(todoTask, sectionKey, result);
          }
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    // Если задача не найдена в result, добавляем её
    if (!found) {
      // Определяем раздел по номеру задачи (эвристика)
      let section = 'important';
      if (parseInt(taskNumber) <= 4 || parseInt(taskNumber) === 11 || parseInt(taskNumber) === 12) {
        section = 'critical';
      } else if (parseInt(taskNumber) >= 13) {
        section = 'desirable';
      }
      saveTask(todoTask, section, result);
    }
  });
  
  return result;
}

/**
 * Сохраняет задачу в соответствующий раздел
 */
function saveTask(task, section, result) {
  if (!section || !result[section]) return;
  
  if (task.status === 'completed') {
    result[section].completed.push(task);
  } else if (task.status === 'inProgress') {
    result[section].inProgress.push(task);
  } else {
    result[section].planning.push(task);
  }
}

/**
 * Загружает IMPLEMENTATION_PLAN.md и парсит его
 * @returns {Promise<Object>} промис с объектом задач
 */
export async function loadImplementationPlan() {
  try {
    const response = await fetch('/IMPLEMENTATION_PLAN.md');
    if (!response.ok) {
      throw new Error(`Failed to load implementation plan: ${response.status}`);
    }
    const content = await response.text();
    return parseImplementationPlan(content);
  } catch (error) {
    console.error('Error loading implementation plan:', error);
    return {
      critical: { planning: [], inProgress: [], completed: [] },
      important: { planning: [], inProgress: [], completed: [] },
      desirable: { planning: [], inProgress: [], completed: [] }
    };
  }
}

