const fs = require('fs');
const path = require('path');

// Категории работ
const categories = [
  'remix',
  'marketing',
  'development',
  'design',
  'management',
  'consulting',
  'teaching',
  'other'
];

// Ставки по категориям (из useSettingsStore)
const categoryRates = {
  remix: 500,
  marketing: 600,
  development: 1500,
  design: 1200,
  management: 1300,
  consulting: 1400,
  teaching: 800,
  other: 1000
};

// Генерация случайного числа в диапазоне
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Генерация случайного числа с плавающей точкой
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Форматирование времени
function formatTime(hours, minutes) {
  const h = Math.floor(hours).toString().padStart(2, '0');
  const m = Math.floor(minutes).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Преобразование времени в минуты
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Преобразование минут в время
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return formatTime(h, m);
}

// Генерация записей для одного дня
function generateDayEntries(date, dayEarned) {
  const entries = [];
  const numEntries = randomInt(1, 5);
  
  // Общее рабочее время не более 8 часов (480 минут)
  const maxWorkMinutes = 480;
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  const maxBreakMinutes = 180;
  
  // Генерируем категории и ставки для каждой записи заранее
  const entryCategories = [];
  const entryRates = [];
  let totalRate = 0;
  
  for (let i = 0; i < numEntries; i++) {
    const categoryId = categories[randomInt(0, categories.length - 1)];
    const rate = categoryRates[categoryId];
    entryCategories.push(categoryId);
    entryRates.push(rate);
    totalRate += rate;
  }
  
  // Распределяем заработок пропорционально ставкам
  const entryEarned = [];
  let distributedEarned = 0;
  
  for (let i = 0; i < numEntries; i++) {
    if (i === numEntries - 1) {
      // Последняя запись получает остаток
      entryEarned.push(dayEarned - distributedEarned);
    } else {
      const proportion = entryRates[i] / totalRate;
      const earned = Math.round(dayEarned * proportion);
      entryEarned.push(earned);
      distributedEarned += earned;
    }
  }
  
  let currentTime = randomInt(8, 10) * 60; // Начало работы между 08:00 и 10:00
  
  for (let i = 0; i < numEntries; i++) {
    const categoryId = entryCategories[i];
    const rate = entryRates[i];
    const targetEarned = entryEarned[i];
    
    // Рассчитываем длительность записи на основе заработка и ставки
    let durationHours = targetEarned / rate;
    let durationMinutes = Math.round(durationHours * 60);
    
    // Ограничиваем длительность, чтобы не превысить 8 часов
    const remainingMinutes = maxWorkMinutes - totalWorkMinutes;
    durationMinutes = Math.max(30, Math.min(durationMinutes, remainingMinutes));
    
    // Если длительность слишком мала, увеличиваем её до минимума
    if (durationMinutes < 30) {
      durationMinutes = Math.min(30, remainingMinutes);
    }
    
    const startTime = currentTime;
    const endTime = startTime + durationMinutes;
    
    // Корректируем заработок на основе фактической длительности
    const actualEarned = Math.round((durationMinutes / 60) * rate);
    
    const start = minutesToTime(startTime);
    const end = minutesToTime(endTime);
    
    // Генерируем ID на основе timestamp
    const dateObj = new Date(date);
    const timestamp = dateObj.getTime() + i * 1000;
    
    const entry = {
      id: timestamp.toString(),
      date: date,
      start: start,
      end: end,
      categoryId: categoryId,
      rate: rate,
      earned: actualEarned
    };
    
    // Добавляем перерыв после записи (кроме последней)
    if (i < numEntries - 1) {
      const breakMinutes = randomInt(15, 60);
      const remainingBreakBudget = maxBreakMinutes - totalBreakMinutes;
      
      if (remainingBreakBudget > 0) {
        const actualBreak = Math.min(breakMinutes, remainingBreakBudget);
        totalBreakMinutes += actualBreak;
        
        // Случайно выбираем формат перерыва
        if (Math.random() > 0.5) {
          entry.breakMinutes = actualBreak;
        } else {
          const breakHours = Math.floor(actualBreak / 60);
          const breakMins = actualBreak % 60;
          entry.breakAfter = formatTime(breakHours, breakMins);
        }
        
        currentTime = endTime + actualBreak;
      } else {
        currentTime = endTime;
      }
    }
    
    totalWorkMinutes += durationMinutes;
    entries.push(entry);
  }
  
  // Финальная корректировка заработка, чтобы сумма была близка к целевому
  const totalEarned = entries.reduce((sum, e) => sum + e.earned, 0);
  const difference = dayEarned - totalEarned;
  
  if (Math.abs(difference) > 50 && entries.length > 0) {
    // Распределяем разницу на последнюю запись
    const lastEntry = entries[entries.length - 1];
    lastEntry.earned = Math.max(100, lastEntry.earned + difference);
  }
  
  return entries;
}

// Проверка, является ли день выходным (суббота или воскресенье)
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = воскресенье, 6 = суббота
}

// Генерация записей для диапазона дат
function generateEntriesForRange(startDate, endDate) {
  const entries = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const isWeekendDay = isWeekend(currentDate);
    
    // График 5/2, но с 30% вероятностью работы в выходные
    const shouldWork = !isWeekendDay || Math.random() < 0.3;
    
    if (shouldWork) {
      // Заработок в день от 1500 до 8000
      const dayEarned = randomInt(1500, 8000);
      const dayEntries = generateDayEntries(dateStr, dayEarned);
      entries.push(...dayEntries);
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return entries;
}

// Генерация данных
console.log('Добавление данных с июля по декабрь 2025...');

// Читаем существующие данные
const outputPath = path.join(__dirname, '..', 'public', 'test-data-sample.json');
let existingData = { entries: [] };

if (fs.existsSync(outputPath)) {
  try {
    const fileContent = fs.readFileSync(outputPath, 'utf8');
    existingData = JSON.parse(fileContent);
    console.log(`Найдено ${existingData.entries.length} существующих записей`);
  } catch (error) {
    console.error('Ошибка чтения существующего файла:', error.message);
  }
}

// Генерируем новые записи с июля по декабрь
const newEntries = generateEntriesForRange(
  new Date('2025-07-01'),
  new Date('2025-12-31')
);

console.log(`Сгенерировано ${newEntries.length} новых записей`);

// Объединяем существующие и новые записи
const allEntries = [...existingData.entries, ...newEntries];

// Сохранение в файл
const output = {
  entries: allEntries
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Всего записей в файле: ${allEntries.length}`);
console.log(`Данные сохранены в ${outputPath}`);

// Статистика
const dates = new Set(allEntries.map(e => e.date));
const categoriesCount = {};
allEntries.forEach(e => {
  categoriesCount[e.categoryId] = (categoriesCount[e.categoryId] || 0) + 1;
});

console.log('\nСтатистика:');
console.log(`- Уникальных дней: ${dates.size}`);
console.log(`- Среднее количество записей в день: ${(allEntries.length / dates.size).toFixed(2)}`);
console.log(`- Распределение по категориям:`, categoriesCount);

