// 🎯 JavaScript для варианта 1: Минималистичный

document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    initTimer();
    initCharts();
});

function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-counter'));
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString('ru-RU');
        } else if (target % 1 !== 0) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepDuration);
}

function initTimer() {
    const timerDisplay = document.getElementById('hero-timer');
    const hoursDisplay = document.getElementById('hero-hours');
    const earnedDisplay = document.getElementById('hero-earned');
    if (!timerDisplay) return;
    
    let seconds = 0;
    let interval;
    const hourlyRate = 1405;
    
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    interval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
        if (hoursDisplay) {
            hoursDisplay.textContent = (seconds / 3600).toFixed(2);
        }
        if (earnedDisplay) {
            earnedDisplay.textContent = Math.floor((seconds / 3600) * hourlyRate).toLocaleString('ru-RU');
        }
    }, 1000);
    
    // Остановка через 15 секунд
    setTimeout(() => clearInterval(interval), 15000);
}

function initCharts() {
    const barItems = document.querySelectorAll('.chart-bar-item');
    
    barItems.forEach((item, index) => {
        const value = parseInt(item.getAttribute('data-value'));
        const percentage = (value / 8500) * 100;
        const bar = item.querySelector('.chart-bar');
        
        setTimeout(() => {
            bar.style.height = `${percentage}%`;
        }, index * 100);
    });
}

