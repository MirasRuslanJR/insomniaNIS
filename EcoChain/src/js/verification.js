import { db, auth, ACTION_TYPES } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    updateDoc,
    getDoc,
    arrayUnion,
    increment,
    serverTimestamp,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showNotification, formatDate, canUserVerify } from './utils.js';

let pendingActions = [];
let userStats = {
    verified: 0,
    trustScore: 50
};

// load pending actions
function loadPendingActions() {
    const container = document.getElementById('verificationQueue');

    container.innerHTML = `
        <div class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p class="mt-4 text-gray-600">Загрузка действий...</p>
        </div>
    `;
    const q = query(
        collection(db, 'ecoActions'),
        where('status', '==', 'pending')
    );

    onSnapshot(q, (snapshot) => {
        pendingActions = [];
        console.log('📦 Всего документов в snapshot:', snapshot.size);

        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('📄 Документ:', {
                id: doc.id,
                status: data.status,
                userId: data.userId,
                currentUser: auth.currentUser?.uid,
                hasPhotoAfter: !!data.photoAfter,
                isOwn: data.userId === auth.currentUser?.uid
            })
            if (data.userId !== auth.currentUser?.uid) {
                pendingActions.push(data);
            }
        });

        console.log('✅ После фильтра осталось:', pendingActions.length);
        displayPendingActions();
        updateStats();
    }, (error) => {
        console.error('Snapshot error:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-4xl mb-3">⚠️</div>
                <p class="text-red-600 font-semibold">Ошибка загрузки: ${error.message}</p>
            </div>
        `;
    });
}

// show pending actions
function displayPendingActions() {
    const container = document.getElementById('verificationQueue');
    
    if (pendingActions.length === 0) {
        container.innerHTML = `
            <div class="verification-card">
                <div class="p-12 text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">Отличная работа!</h3>
                    <p class="text-gray-600">Все действия проверены. Проверьте позже.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingActions.map(action => {
        const actionType = ACTION_TYPES[action.type] || ACTION_TYPES.other;
        const verificationCount = action.verificationCount || 0;
        const canVerify = canUserVerify(action, auth.currentUser?.uid);
        
        return `
            <div class="verification-card">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <img src="${action.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(action.userName)}&background=4A6741&color=fff`}" 
                                 alt="${action.userName}" 
                                 class="w-12 h-12 rounded-full">
                            <div>
                                <h3 class="font-bold text-xl">${actionType.icon} ${action.title}</h3>
                                <p class="text-sm text-gray-600">от ${action.userName} • ${formatDate(action.createdAt)}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-green-600">+${action.ecoPoints || 0}</div>
                            <div class="text-xs text-gray-500">EcoPoints</div>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <p class="text-gray-700 mb-6">${action.description}</p>
                    
                    <!-- Photo Comparison -->
                    <div class="photo-compare mb-6">
                        <div>
                            <div class="text-sm font-bold mb-2 text-red-600">📷 ДО</div>
                            ${action.photoBefore
                                ? `<img src="${action.photoBefore}" alt="Before" loading="lazy">`
                                : `<div class="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">Нет фото</div>`
                            }
                        </div>
                        <div>
                            <div class="text-sm font-bold mb-2 text-green-600">📷 ПОСЛЕ</div>
                            ${action.photoAfter
                                ? `<img src="${action.photoAfter}" alt="After" loading="lazy">`
                                : `<div class="w-full h-40 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 font-semibold">⏳ Ожидает завершения</div>`
                            }
                        </div>
                    </div>
                    
                    <!-- Details -->
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="bg-green-50 p-3 rounded-lg text-center">
                            <div class="text-2xl mb-1">${actionType.icon}</div>
                            <div class="text-xs text-gray-600">${actionType.label}</div>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg text-center">
                            <div class="text-lg font-bold text-blue-600">${(action.co2Impact || 0).toFixed(1)} кг</div>
                            <div class="text-xs text-gray-600">CO₂ saved</div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg text-center">
                            <div class="text-lg font-bold text-purple-600">${verificationCount}/3</div>
                            <div class="text-xs text-gray-600">Верификаций</div>
                        </div>
                    </div>
                    
                    ${action.location ? `
                        <div class="mb-6 text-sm text-gray-600">
                            📍 ${action.location.address || `${action.location.lat.toFixed(6)}, ${action.location.lng.toFixed(6)}`}
                        </div>
                    ` : ''}
                    
                    <!-- Action Buttons -->
                    ${!action.photoAfter ? `
                        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center text-yellow-700 font-semibold">
                            ⏳ Автор ещё не завершил действие (нет фото ПОСЛЕ)
                        </div>
                    ` : canVerify ? `
                        <div class="flex gap-4">
                            <button onclick="verifyAction('${action.id}', true)" 
                                    class="verify-btn verify-btn-approve">
                                ✅ Подтвердить
                            </button>
                            <button onclick="verifyAction('${action.id}', false)" 
                                    class="verify-btn verify-btn-reject">
                                ❌ Отклонить
                            </button>
                        </div>
                    ` : `
                        <div class="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
                            Вы уже проверили это действие
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// verify the action
window.verifyAction = async function(actionId, approve) {
    if (!auth.currentUser) {
        showNotification('Войдите, чтобы верифицировать', 'error');
        return;
    }
    
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    
    try {
        const actionRef = doc(db, 'ecoActions', actionId);
        
        // Add verification
        const verification = {
            userId: auth.currentUser.uid,
            vote: approve,
            timestamp: new Date().toISOString()
        };
        
        await updateDoc(actionRef, {
            verifications: arrayUnion(verification),
            verificationCount: increment(1)
        });
        
        // trust score
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
            trustScore: increment(2)
        });
        
        // check if 3 verifications
        const updatedAction = await getDoc(actionRef);
        const verifications = updatedAction.data().verifications || [];
        
        if (verifications.length >= 3) {
            const approvals = verifications.filter(v => v.vote === true).length;
            if (approvals >= 2) {
                await updateDoc(actionRef, {
                    status: 'verified'
                });
                
                const actionData = updatedAction.data();
                const actionUserRef = doc(db, 'users', actionData.userId);
                await updateDoc(actionUserRef, {
                    ecoPoints: increment(actionData.ecoPoints || 0),
                    co2Saved: increment(actionData.co2Impact || 0),
                    totalActions: increment(1)
                });
                
                showNotification('Действие верифицировано! 🎉', 'success');
            } else {
                await updateDoc(actionRef, {
                    status: 'rejected'
                });
                
                showNotification('Действие отклонено сообществом', 'info');
            }
        } else {
            showNotification(
                approve ? 'Подтверждение добавлено ✅' : 'Отклонение добавлено ❌', 
                'success'
            );
        }
        loadUserStats();
        
    } catch (error) {
        console.error('Error verifying action:', error);
        showNotification('Ошибка при верификации', 'error');
    }
};

// load users stats
async function loadUserStats() {
    if (!auth.currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            userStats.trustScore = data.trustScore || 50;
            
            document.getElementById('trustScore').textContent = userStats.trustScore;
        }
        const allActions = await getDocs(collection(db, 'ecoActions'));
        let verifiedCount = 0;
        
        allActions.forEach(doc => {
            const verifications = doc.data().verifications || [];
            if (verifications.some(v => v.userId === auth.currentUser.uid)) {
                verifiedCount++;
            }
        });
        userStats.verified = verifiedCount;
        document.getElementById('verifiedCount').textContent = verifiedCount;
        
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// update stats
function updateStats() {
    document.getElementById('pendingCount').textContent = pendingActions.length;
}

// refresh
document.getElementById('refreshBtn').addEventListener('click', () => {
    showNotification('Обновление...', 'info');
    loadPendingActions();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadPendingActions();
        loadUserStats();
    } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                loadPendingActions();
                loadUserStats();
                unsubscribe();
            } else {
                window.location.href = 'index.html';
            }
        });
    }
});