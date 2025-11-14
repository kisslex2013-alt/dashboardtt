// 🎯 JavaScript для варианта 4: Фокус на данные

document.addEventListener('DOMContentLoaded', () => {
    initCounters();
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

function initCharts() {
    // Bars
    const bars = document.querySelectorAll('.chart-bar-large');
    const maxValue = 8500;
    
    bars.forEach((bar, index) => {
        const barItem = bar.closest('.chart-bar-large-item');
        const value = parseInt(barItem.getAttribute('data-value'));
        const percentage = (value / maxValue) * 100;
        
        setTimeout(() => {
            bar.style.height = `${percentage}%`;
        }, index * 100);
    });
    
    // Time bars
    setTimeout(() => {
        document.querySelectorAll('.time-bar').forEach((bar, index) => {
            const percentages = [35, 25, 20, 20];
            setTimeout(() => {
                bar.style.width = `${percentages[index]}%`;
            }, index * 100);
        });
    }, 1000);
    
    // Rate bars
    setTimeout(() => {
        document.querySelectorAll('.rate-bar').forEach((bar, index) => {
            const percentages = [8, 45, 32, 12];
            const max = 45;
            const percentage = (percentages[index] / max) * 100;
            setTimeout(() => {
                bar.style.width = `${percentage}%`;
            }, index * 100);
        });
    }, 2000);
}

