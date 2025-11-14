/**
 * 🎓 Парсер для changelog.md
 * 
 * Извлекает данные из changelog.md и структурирует их по категориям:
 * - Новые возможности
 * - Улучшения интерфейса
 * - Исправления ошибок
 * - Технические улучшения
 */

/**
 * Парсит changelog.md и возвращает структурированные данные
 * @param {string} changelogContent - содержимое changelog.md
 * @returns {Array} массив версий с категоризированными изменениями
 */
export function parseChangelog(changelogContent) {
  const versions = [];
  const lines = changelogContent.split('\n');
  
  let currentVersion = null;
  let currentCategory = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем новую версию
    const versionMatch = line.match(/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      if (currentVersion) {
        versions.push(currentVersion);
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        title: '',
        categories: {
          'Новые возможности': [],
          'Улучшения интерфейса': [],
          'Исправления ошибок': [],
          'Технические улучшения': []
        },
        technicalInfo: {}
      };
      currentCategory = null;
      continue;
    }
    
    if (!currentVersion) continue;
    
    // Определяем тип релиза (РЕЛИЗ, ИСПРАВЛЕНИЕ и т.д.)
    if (line.startsWith('### ')) {
      const titleMatch = line.match(/^###\s*(.+)$/);
      if (titleMatch) {
        currentVersion.title = titleMatch[1].replace(/[*`]/g, '').trim();
      }
      continue;
    }
    
    // Определяем категорию
    if (line.startsWith('#### ')) {
      const categoryMatch = line.match(/^####\s*(.+)$/);
      if (categoryMatch) {
        const categoryName = categoryMatch[1].replace(/[*`]/g, '').trim().toLowerCase();
        // Маппинг категорий (case-insensitive)
        if (categoryName.includes('новые возможности') || categoryName.includes('новые возможности')) {
          currentCategory = 'Новые возможности';
        } else if (categoryName.includes('улучшения интерфейса') || categoryName.includes('улучшения интерфейса')) {
          currentCategory = 'Улучшения интерфейса';
        } else if (categoryName.includes('исправления ошибок') || categoryName.includes('исправления ошибок') || categoryName.includes('критические исправления')) {
          currentCategory = 'Исправления ошибок';
        } else if (categoryName.includes('технические улучшения') || categoryName.includes('технические улучшения')) {
          currentCategory = 'Технические улучшения';
        } else {
          currentCategory = null;
        }
      }
      continue;
    }
    
    // Определяем элемент списка
    if (line.startsWith('- ') && currentCategory && currentVersion.categories[currentCategory]) {
      const item = line.substring(2).trim();
      // Пропускаем пустые строки и техническую информацию
      if (item && !item.startsWith('**Версия**:') && !item.startsWith('**Файлы**:') && 
          !item.startsWith('**Деплой**:') && !item.startsWith('**Статус**:')) {
        // Извлекаем эмодзи из начала строки (если есть)
        // Поддерживаем эмодзи из различных диапазонов Unicode (включая символы вроде 📅, 🎯, 📊, 🗓️, ⚙️, 🎨, 📱, 🔄)
        // Используем более широкий паттерн для захвата всех эмодзи
        const emojiMatch = item.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}]+)/u);
        const emoji = emojiMatch ? emojiMatch[0].trim() : null;
        
        // Убираем эмодзи из начала (если есть пробел после эмодзи, убираем его тоже)
        let textWithoutEmoji = item;
        if (emoji) {
          // Убираем эмодзи и возможный пробел после него
          textWithoutEmoji = item.substring(emoji.length).trim();
        }
        
        // Убираем "**" из названий (формат **Название** - текст)
        const cleanedText = textWithoutEmoji.replace(/\*\*([^*]+)\*\*\s*-\s*/g, '$1 - ');
        
        // Сохраняем с эмодзи и очищенным текстом
        currentVersion.categories[currentCategory].push({
          emoji: emoji || null,
          text: cleanedText
        });
      }
      continue;
    }
    
    // Определяем техническую информацию
    if (line.startsWith('- **Версия**:') || line.startsWith('- **Файлы**:') || line.startsWith('- **Деплой**:') || line.startsWith('- **Статус**:')) {
      const match = line.match(/- \*\*([^*]+)\*\*:\s*(.+)$/);
      if (match) {
        currentVersion.technicalInfo[match[1].trim()] = match[2].trim();
      }
      continue;
    }
  }
  
  // Добавляем последнюю версию
  if (currentVersion) {
    versions.push(currentVersion);
  }
  
  return versions;
}

/**
 * Загружает changelog.md и парсит его
 * @returns {Promise<Array>} промис с массивом версий
 */
export async function loadChangelog() {
  try {
    const response = await fetch('/changelog/changelog.md');
    if (!response.ok) {
      throw new Error(`Failed to load changelog: ${response.status}`);
    }
    const content = await response.text();
    return parseChangelog(content);
  } catch (error) {
    console.error('Error loading changelog:', error);
    return [];
  }
}

