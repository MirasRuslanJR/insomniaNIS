import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit,
    updateDoc,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// get user data
export async function getUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting user data:', error);
        return null;
    }
}

// global stats
export async function getGlobalStats() {
    try {
        const statsDoc = await getDoc(doc(db, 'stats', 'global'));
        if (statsDoc.exists()) {
            return statsDoc.data();
        }
        return {
            totalActions: 0,
            totalUsers: 0,
            totalCO2Saved: 0
        };
    } catch (error) {
        console.error('❌ Error getting global stats:', error);
        return null;
    }
}

// district stats
export async function getDistrictStats(district) {
    try {
        const statsDoc = await getDoc(doc(db, 'stats', 'byDistrict', district));
        if (statsDoc.exists()) {
            return statsDoc.data();
        }
        return {
            actions: 0,
            users: 0,
            co2Saved: 0
        };
    } catch (error) {
        console.error('❌ Error getting district stats:', error);
        return null;
    }
}

// recent actions
export async function getRecentActions(limitCount = 10) {
    try {
        const q = query(
            collection(db, 'ecoActions'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const actions = [];
        snapshot.forEach(doc => {
            actions.push({ id: doc.id, ...doc.data() });
        });
        
        return actions;
    } catch (error) {
        console.error('❌ Error getting recent actions:', error);
        return [];
    }
}

// user actions
export async function getUserActions(userId, limitCount = 20) {
    try {
        const q = query(
            collection(db, 'ecoActions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const actions = [];
        snapshot.forEach(doc => {
            actions.push({ id: doc.id, ...doc.data() });
        });
        
        return actions;
    } catch (error) {
        console.error('❌ Error getting user actions:', error);
        return [];
    }
}

// get pending verifications
export async function getPendingVerifications(limitCount = 20) {
    try {
        const q = query(
            collection(db, 'ecoActions'),
            where('status', '==', 'pending'),
            where('photoAfter', '!=', null),
            orderBy('photoAfter'),
            orderBy('completedAt', 'desc'),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const actions = [];
        snapshot.forEach(doc => {
            actions.push({ id: doc.id, ...doc.data() });
        });
        
        return actions;
    } catch (error) {
        console.error('❌ Error getting pending verifications:', error);
        return [];
    }
}

// active challenges
export async function getActiveChallenges(district = null) {
    try {
        let q;
        if (district) {
            q = query(
                collection(db, 'challenges'),
                where('status', '==', 'active'),
                where('district', '==', district),
                orderBy('endDate', 'asc')
            );
        } else {
            q = query(
                collection(db, 'challenges'),
                where('status', '==', 'active'),
                orderBy('endDate', 'asc')
            );
        }
        
        const snapshot = await getDocs(q);
        const challenges = [];
        snapshot.forEach(doc => {
            challenges.push({ id: doc.id, ...doc.data() });
        });
        
        return challenges;
    } catch (error) {
        console.error('❌ Error getting active challenges:', error);
        return [];
    }
}

// update user stats after verification
export async function updateUserStats(userId, ecoPoints, co2Saved) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ecoPoints: increment(ecoPoints),
            co2Saved: increment(co2Saved),
            totalActions: increment(1),
            lastActive: serverTimestamp()
        });
        console.log('✅ User stats updated');
    } catch (error) {
        console.error('❌ Error updating user stats:', error);
    }
}

// date format
export function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short' 
    });
}

// number format
export function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// calc remaining time
export function getTimeRemaining(endDate) {
    if (!endDate) return 'Завершен';
    
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Завершен';
    
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (days > 0) return `${days} дней`;
    return `${hours} часов`;
}

// notificate
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white font-semibold`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// loading
export function showLoading(element, show = true) {
    if (show) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
        `;
    }
}

// copy
export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Скопировано!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// delays function execution until after a specified wait time: debounce functions
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// check if user can verify an action
export function canUserVerify(action, userId) {
    if (!action.verifications) return true;
    return !action.verifications.some(v => v.userId === userId);
}

// progress percentage
export function calculateProgress(current, goal) {
    if (!goal || goal === 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
}