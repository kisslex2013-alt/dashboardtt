// Универсальный функционал для всех концептов модального окна "Настройка дат выплат"

// Данные выплат
let payments = [
    {
        id: 1,
        name: 'Основная зарплата',
        day: 25,
        periodStart: 1,
        periodEnd: 15,
        color: '#10B981',
        type: 'monthly',
        icon: 'money'
    },
    {
        id: 2,
        name: 'Аванс',
        day: 10,
        periodStart: 16,
        periodEnd: 31,
        color: '#3B82F6',
        type: 'monthly',
        icon: 'wallet'
    },
    {
        id: 3,
        name: 'Фриланс проект',
        day: 5,
        customDate: '05.12',
        periodStart: 1,
        periodEnd: 30,
        color: '#8B5CF6',
        type: 'once',
        icon: 'document'
    }
];

let editingId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Начать редактирование
function startEdit(id) {
    editingId = id;
    if (typeof renderPayments === 'function') {
        renderPayments();
    } else if (typeof renderCards === 'function') {
        renderCards();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTable === 'function') {
        renderTable();
    }
}

// Отменить редактирование
function cancelEdit() {
    editingId = null;
    if (typeof renderPayments === 'function') {
        renderPayments();
    } else if (typeof renderCards === 'function') {
        renderCards();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTable === 'function') {
        renderTable();
    }
}

// Сохранить изменения
function saveEdit(id) {
    const payment = payments.find(p => p.id === id);
    if (payment) {
        const nameInput = document.getElementById('edit-name');
        const dayInput = document.getElementById('edit-day');
        const colorInput = document.getElementById('edit-color');
        const periodStartInput = document.getElementById('edit-period-start');
        const periodEndInput = document.getElementById('edit-period-end');
        const customDateInput = document.getElementById('edit-custom-date');
        const typeSelect = document.getElementById('edit-type');
        
        if (nameInput) payment.name = nameInput.value;
        if (dayInput) payment.day = parseInt(dayInput.value) || 1;
        if (colorInput) payment.color = colorInput.value;
        if (periodStartInput) payment.periodStart = parseInt(periodStartInput.value) || 1;
        if (periodEndInput) payment.periodEnd = parseInt(periodEndInput.value) || 31;
        if (customDateInput) payment.customDate = customDateInput.value;
        if (typeSelect) payment.type = typeSelect.value;
    }
    editingId = null;
    
    if (typeof renderPayments === 'function') {
        renderPayments();
    } else if (typeof renderCards === 'function') {
        renderCards();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTable === 'function') {
        renderTable();
    }
    
    showNotification('Изменения сохранены', 'success');
}

// Удалить выплату
function deletePayment(id) {
    if (confirm('Удалить эту выплату?')) {
        payments = payments.filter(p => p.id !== id);
        
        if (typeof renderPayments === 'function') {
            renderPayments();
        } else if (typeof renderCards === 'function') {
            renderCards();
        } else if (typeof renderTimeline === 'function') {
            renderTimeline();
        } else if (typeof renderCalendar === 'function') {
            renderCalendar();
        } else if (typeof renderTable === 'function') {
            renderTable();
        }
        
        showNotification('Выплата удалена', 'success');
    }
}

// Добавить новую выплату
function addPayment() {
    const newId = Math.max(...payments.map(p => p.id), 0) + 1;
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    payments.push({
        id: newId,
        name: 'Новая выплата',
        day: 1,
        periodStart: 1,
        periodEnd: 15,
        color: randomColor,
        type: 'monthly',
        icon: 'money'
    });
    
    editingId = newId;
    
    if (typeof renderPayments === 'function') {
        renderPayments();
    } else if (typeof renderCards === 'function') {
        renderCards();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTable === 'function') {
        renderTable();
    }
}

// Закрыть модальное окно
function closeModal() {
    if (editingId !== null) {
        if (confirm('Закрыть окно? Несохраненные изменения будут потеряны.')) {
            window.close();
        }
    } else {
        window.close();
    }
}

// Сохранить все
function saveAll() {
    console.log('Сохранено:', payments);
    localStorage.setItem('paymentDates', JSON.stringify(payments));
    showNotification('Все изменения сохранены', 'success');
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-[9999] transition-all ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        'bg-blue-600'
    }`;
    notification.style.opacity = '0';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// Навигация по месяцам (для календаря и timeline)
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthDisplay();
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    }
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateMonthDisplay();
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    }
}

function updateMonthDisplay() {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const monthDisplay = document.getElementById('month-display');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

// Получить количество дней в месяце
function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

// Получить первый день недели месяца (0 = воскресенье, 1 = понедельник, ...)
function getFirstDayOfMonth(month, year) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Преобразуем в формат где 0 = понедельник
}

// Проверить есть ли выплата в этот день
function hasPaymentOnDay(day) {
    return payments.some(p => {
        if (p.type === 'monthly') {
            return p.day === day;
        } else if (p.type === 'once' && p.customDate) {
            const [d, m] = p.customDate.split('.');
            return parseInt(d) === day && parseInt(m) === (currentMonth + 1);
        }
        return false;
    });
}

// Получить выплаты для конкретного дня
function getPaymentsForDay(day) {
    return payments.filter(p => {
        if (p.type === 'monthly') {
            return p.day === day;
        } else if (p.type === 'once' && p.customDate) {
            const [d, m] = p.customDate.split('.');
            return parseInt(d) === day && parseInt(m) === (currentMonth + 1);
        }
        return false;
    });
}

// Сортировка выплат по дате
function getSortedPayments() {
    return [...payments].sort((a, b) => {
        const dayA = a.type === 'once' && a.customDate ? parseInt(a.customDate.split('.')[0]) : a.day;
        const dayB = b.type === 'once' && b.customDate ? parseInt(b.customDate.split('.')[0]) : b.day;
        return dayA - dayB;
    });
}

// Форматирование даты
function formatDate(day) {
    return day < 10 ? `0${day}` : `${day}`;
}

// Загрузка сохраненных данных
function loadSavedData() {
    const saved = localStorage.getItem('paymentDates');
    if (saved) {
        try {
            payments = JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updateMonthDisplay();
    
    // Вызываем соответствующую функцию рендеринга
    if (typeof renderPayments === 'function') {
        renderPayments();
    } else if (typeof renderCards === 'function') {
        renderCards();
    } else if (typeof renderTimeline === 'function') {
        renderTimeline();
    } else if (typeof renderCalendar === 'function') {
        renderCalendar();
    } else if (typeof renderTable === 'function') {
        renderTable();
    }
});

// Экспорт функций для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        payments,
        startEdit,
        cancelEdit,
        saveEdit,
        deletePayment,
        addPayment,
        closeModal,
        saveAll,
        showNotification,
        previousMonth,
        nextMonth,
        getDaysInMonth,
        getFirstDayOfMonth,
        hasPaymentOnDay,
        getPaymentsForDay,
        getSortedPayments
    };
}
