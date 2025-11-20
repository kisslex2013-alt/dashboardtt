const data = require('../public/test-data-sample.json');

const dates = [...new Set(data.entries.map(e => e.date))];

const dayStats = dates.map(date => {
  const dayEntries = data.entries.filter(e => e.date === date);
  const totalWorkMinutes = dayEntries.reduce((sum, e) => {
    const [sh, sm] = e.start.split(':').map(Number);
    const [eh, em] = e.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin < startMin) endMin += 24 * 60;
    return sum + (endMin - startMin);
  }, 0);
  const totalEarned = dayEntries.reduce((sum, e) => sum + e.earned, 0);
  return {
    date,
    entries: dayEntries.length,
    workHours: totalWorkMinutes / 60,
    earned: totalEarned
  };
});

const maxWorkHours = Math.max(...dayStats.map(d => d.workHours));
const minEarned = Math.min(...dayStats.map(d => d.earned));
const maxEarned = Math.max(...dayStats.map(d => d.earned));
const minEntries = Math.min(...dayStats.map(d => d.entries));
const maxEntries = Math.max(...dayStats.map(d => d.entries));

console.log('Проверка данных:');
console.log('Заработок в день:', minEarned, '-', maxEarned, 'RUB');
console.log('Записей в день:', minEntries, '-', maxEntries);
console.log('Максимальное рабочее время:', maxWorkHours.toFixed(2), 'часов');

const over8Hours = dayStats.filter(d => d.workHours > 8);
if (over8Hours.length > 0) {
  console.log('\nДней с рабочим временем > 8 часов:', over8Hours.length);
  console.log('Примеры:', over8Hours.slice(0, 3).map(d => `${d.date} (${d.workHours.toFixed(2)}ч)`));
} else {
  console.log('\nВсе дни соответствуют требованию (<= 8 часов)');
}

