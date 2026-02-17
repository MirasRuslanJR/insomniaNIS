import { db, auth, ACTION_TYPES } from './firebase-config.js';
import { doc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getUserActions, formatDate } from './utils.js';

let userData = null;
let userActions = [];

// load user data
async function loadUserData() {
    if (!auth.currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
            displayUserData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

//display user data
function displayUserData() {
    if (!userData) return;
    
    // profile
    document.getElementById('userName').textContent = userData.displayName || 'EcoWarrior';
    document.getElementById('userPhoto').src = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=10b981&color=fff&size=200`;
    document.getElementById('userDistrict').textContent = `📍 ${userData.district || 'Район'}`;
    
    const joinedDate = userData.joinedAt?.toDate ? userData.joinedAt.toDate() : new Date();
    document.getElementById('userJoined').textContent = `🗓️ С нами с ${joinedDate.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}`;
    
    //stats
    document.getElementById('userStreak').textContent = userData.streak || 0;
    document.getElementById('userPoints').textContent = (userData.ecoPoints || 0).toLocaleString();
    document.getElementById('userActions').textContent = userData.totalActions || 0;
    document.getElementById('userCO2').textContent = (userData.co2Saved || 0).toFixed(1);
    document.getElementById('userRank').textContent = '#' + (userData.districtRank || '-');
    
    // Trust Score with circle animation
    const trustScore = userData.trustScore || 50;
    document.getElementById('trustScore').textContent = trustScore;
    
    const circle = document.getElementById('trustCircle');
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (trustScore / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    // Progress bars
    const monthActions = userData.monthActions || 0;
    const monthCO2 = userData.monthCO2 || 0;
    
    document.getElementById('monthProgress').textContent = `${monthActions}/10`;
    document.getElementById('monthProgressBar').style.width = `${Math.min(100, (monthActions / 10) * 100)}%`;
    
    document.getElementById('co2Progress').textContent = `${monthCO2.toFixed(1)}/50`;
    document.getElementById('co2ProgressBar').style.width = `${Math.min(100, (monthCO2 / 50) * 100)}%`;
}

// Load user actions
async function loadUserActions() {
    if (!auth.currentUser) return;
    
    try {
        userActions = await getUserActions(auth.currentUser.uid, 10);
        displayUserActions();
    } catch (error) {
        console.error('Error loading user actions:', error);
    }
}

// Display user actions
function displayUserActions() {
    const container = document.getElementById('userActionsList');
    
    if (userActions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🌱</div>
                <h3 class="text-xl font-bold text-gray-700 mb-2">Еще нет действий</h3>
                <p class="text-gray-600 mb-6">Начните делать экологические действия</p>
                <a href="map.html" class="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    Добавить действие
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userActions.map(action => {
        const actionType = ACTION_TYPES[action.type] || ACTION_TYPES.other;
        const statusColor = {
            pending: 'yellow',
            verified: 'green',
            rejected: 'red'
        }[action.status] || 'gray';
        
        const statusText = {
            pending: 'На проверке',
            verified: 'Верифицировано',
            rejected: 'Отклонено'
        }[action.status] || 'Неизвестно';
        
        return `
            <div class="action-item">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="text-3xl">${actionType.icon}</div>
                        <div class="flex-1">
                            <h4 class="font-bold text-lg text-gray-800 mb-1">${action.title}</h4>
                            <p class="text-gray-600 text-sm mb-2">${action.description}</p>
                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                <span>📅 ${formatDate(action.createdAt)}</span>
                                <span>🌍 ${(action.co2Impact || 0).toFixed(1)} кг CO₂</span>
                                <span>⭐ ${action.ecoPoints || 0} pts</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 bg-${statusColor}-100 text-${statusColor}-700 rounded-full text-xs font-semibold">
                            ${statusText}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load leaderboard
async function loadLeaderboard() {
    if (!userData) return;
    
    try {
        const q = query(
            collection(db, 'users'),
            where('district', '==', userData.district),
            orderBy('ecoPoints', 'desc'),
            limit(5)
        );
        
        const snapshot = await getDocs(q);
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        displayLeaderboard(users);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Display leaderboard
function displayLeaderboard(users) {
    const container = document.getElementById('leaderboard');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Нет данных</p>';
        return;
    }
    
    container.innerHTML = users.map((user, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[index] || '👤';
        const isCurrentUser = user.id === auth.currentUser?.uid;
        
        return `
            <div class="flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${medal}</div>
                    <div>
                        <div class="font-bold text-gray-800">${user.displayName || 'User'}</div>
                        <div class="text-xs text-gray-500">${user.totalActions || 0} действий</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-green-600">${(user.ecoPoints || 0).toLocaleString()}</div>
                    <div class="text-xs text-gray-500">points</div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadUserData();
        loadUserActions();
        setTimeout(loadLeaderboard, 1000);
    } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                loadUserData();
                loadUserActions();
                setTimeout(loadLeaderboard, 1000);
                unsubscribe();
            } else {
                window.location.href = 'index.html';
            }
        });
    }
});