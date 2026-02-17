import { getGlobalStats } from './utils.js';
import { DISTRICTS } from './firebase-config.js';
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('authDistrict');
    if (select && DISTRICTS) {
        DISTRICTS.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            select.appendChild(opt);
        });
    }
});
AOS.init({
    duration: 800,
    once: true,
    offset: 100,
    easing: 'ease-out-cubic'
});
function animateCounter(id, target) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let current = 0;
    const increment = target / 60;
    const duration = 2000;
    const stepTime = duration / 60;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target).toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current).toLocaleString();
        }
    }, stepTime);
}
async function loadStats() {
    try {
        const stats = await getGlobalStats();
        if (stats) {
            animateCounter('totalActions', stats.totalActions || 5);
            animateCounter('totalUsers', stats.totalUsers || 5);
            animateCounter('totalCO2', stats.totalCO2Saved || 10);
            animateCounter('activeChallenges', 1);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        animateCounter('totalActions', 5);
        animateCounter('totalUsers', 5);
        animateCounter('totalCO2', 10);
        animateCounter('activeChallenges', 1);
    }
}
window.addEventListener('DOMContentLoaded', loadStats);
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-bg');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});