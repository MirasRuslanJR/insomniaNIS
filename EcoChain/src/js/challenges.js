import { db, auth, ACTION_TYPES, DISTRICTS } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showNotification, formatDate, getTimeRemaining } from './utils.js';

function populateDistrictSelects() {
    const filterSelect = document.getElementById('districtFilter');
    const createSelect = document.getElementById('cDistrict');

    DISTRICTS.forEach(district => {
        if (filterSelect) {
            const opt = document.createElement('option');
            opt.value = district;
            opt.textContent = district;
            filterSelect.appendChild(opt);
        }
        if (createSelect) {
            const opt = document.createElement('option');
            opt.value = district;
            opt.textContent = district;
            createSelect.appendChild(opt);
        }
    });
    if (createSelect) {
        const opt = document.createElement('option');
        opt.value = 'Все';
        opt.textContent = '🌍 Все города';
        createSelect.appendChild(opt);
    }
}

let allChallenges = [];
let currentFilters = {
    district: 'all',
    status: 'all'
};

async function loadChallenges() {
    try {
        const q = query(collection(db, 'challenges'));
        const snapshot = await getDocs(q);
        
        allChallenges = [];
        snapshot.forEach(doc => {
            allChallenges.push({ id: doc.id, ...doc.data() });
        });
        
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Error loading challenges:', error);
        showNotification('Ошибка загрузки челленджей', 'error');
    }
}

function applyFiltersAndDisplay() {
    let filtered = allChallenges;
    
    if (currentFilters.district !== 'all') {
        filtered = filtered.filter(c => c.district === currentFilters.district);
    }
    
    if (currentFilters.status !== 'all') {
        filtered = filtered.filter(c => c.status === currentFilters.status);
    }
    
    displayChallenges(filtered);
}

function displayChallenges(challenges) {
    const container = document.getElementById('challengesGrid');
    
    if (challenges.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">🔍</div>
                <h3 class="text-2xl font-bold text-gray-700 mb-2">Нет челленджей</h3>
                <p class="text-gray-600">Попробуйте изменить фильтры</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = challenges.map(challenge => {
        const isActive = challenge.status === 'active';
        const progress = challenge.currentProgress || 0;
        const goal = challenge.goal || 100;
        const progressPercent = Math.min(100, (progress / goal) * 100);
        const timeLeft = getTimeRemaining(challenge.endDate);
        const participantCount = challenge.participants?.length || 0;
        
        return `
            <div class="challenge-card ${isActive ? 'challenge-active' : 'challenge-completed'}" 
                 onclick="showChallengeDetails('${challenge.id}')">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <div class="text-sm font-bold text-green-600 mb-2">${challenge.district}</div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">${challenge.title}</h3>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl">${isActive ? '🔥' : '✅'}</div>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <p class="text-gray-600 mb-6 line-clamp-2">${challenge.description}</p>
                    
                    <!-- Progress Bar -->
                    <div class="mb-6">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="font-semibold">Прогресс</span>
                            <span>${progress} / ${goal}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-green-600 h-3 rounded-full progress-bar-animated" 
                                 style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${participantCount}</div>
                            <div class="text-xs text-gray-600">Участников</div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600">${timeLeft}</div>
                            <div class="text-xs text-gray-600">Осталось</div>
                        </div>
                    </div>
                    
                    <!-- Reward -->
                    ${challenge.reward ? `
                        <div class="bg-yellow-50 px-4 py-3 rounded-lg text-center">
                            <div class="text-sm font-bold text-yellow-800">
                                🏆 Награда: ${challenge.reward}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

window.showChallengeDetails = async function(challengeId) {
    const challenge = allChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    const modal = document.getElementById('challengeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = challenge.title;
    
    const isParticipant = auth.currentUser && challenge.participants?.includes(auth.currentUser.uid);
    const progress = challenge.currentProgress || 0;
    const goal = challenge.goal || 100;
    const progressPercent = Math.min(100, (progress / goal) * 100);
    
    modalContent.innerHTML = `
        <div class="mb-6">
            <div class="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold mb-4">
                ${challenge.district}
            </div>
            <p class="text-lg text-gray-700 leading-relaxed">${challenge.description}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">Тип</div>
                <div class="font-bold">${ACTION_TYPES[challenge.actionType]?.label || 'Различные'}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">Цель</div>
                <div class="font-bold">${goal} ${challenge.unit || 'действий'}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">Начало</div>
                <div class="font-bold">${formatDate(challenge.startDate)}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl">
                <div class="text-sm text-gray-600 mb-1">Конец</div>
                <div class="font-bold">${formatDate(challenge.endDate)}</div>
            </div>
        </div>
        
        <div class="mb-6">
            <div class="flex justify-between text-sm mb-2">
                <span class="font-semibold">Общий прогресс</span>
                <span>${progress} / ${goal}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4">
                <div class="bg-green-600 h-4 rounded-full" style="width: ${progressPercent}%"></div>
            </div>
        </div>
        
        ${challenge.reward ? `
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-6">
                <div class="text-center">
                    <div class="text-4xl mb-2">🏆</div>
                    <div class="font-bold text-lg mb-1">Награда за победу</div>
                    <div class="text-gray-700">${challenge.reward}</div>
                </div>
            </div>
        ` : ''}
        
        ${isParticipant ? `
            <div class="bg-green-50 border-2 border-green-200 p-4 rounded-xl text-center text-green-700 font-semibold">
                ✅ Вы участвуете в этом челлендже
            </div>
        ` : ''}
    `;
    
    const joinBtn = document.getElementById('joinChallengeBtn');
    if (isParticipant || challenge.status !== 'active') {
        joinBtn.style.display = 'none';
    } else {
        joinBtn.style.display = 'flex';
        joinBtn.onclick = () => joinChallenge(challengeId);
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
window.hideModal = function() {
    const modal = document.getElementById('challengeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

async function joinChallenge(challengeId) {
    if (!auth.currentUser) {
        showNotification('Войдите, чтобы присоединиться', 'error');
        return;
    }
    
    try {
        const challengeRef = doc(db, 'challenges', challengeId);
        await updateDoc(challengeRef, {
            participants: arrayUnion(auth.currentUser.uid),
            participantCount: increment(1)
        });
        
        showNotification('Вы успешно присоединились! 🎉', 'success');
        hideModal();
        loadChallenges();
    } catch (error) {
        console.error('Error joining challenge:', error);
        showNotification('Ошибка при присоединении', 'error');
    }
}

document.getElementById('applyFilters')?.addEventListener('click', () => {
    currentFilters.district = document.getElementById('districtFilter').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    applyFiltersAndDisplay();
});

document.addEventListener('DOMContentLoaded', () => {
    populateDistrictSelects();

    if (auth.currentUser) {
        loadChallenges();
    } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                loadChallenges();
                unsubscribe();
            }
        });
    }
});

window.hideCreateModal = function() {
    document.getElementById('createChallengeModal').classList.add('hidden');
    document.getElementById('createChallengeModal').classList.remove('flex');
    document.getElementById('createChallengeForm').reset();
};

function showCreateModal() {
    document.getElementById('createChallengeModal').classList.remove('hidden');
    document.getElementById('createChallengeModal').classList.add('flex');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cStartDate').value = today;
}

document.getElementById('createChallengeBtn')?.addEventListener('click', showCreateModal);

document.getElementById('createChallengeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Создаём...';

    try {
        const startDate = new Date(document.getElementById('cStartDate').value);
        const endDate   = new Date(document.getElementById('cEndDate').value);

        if (endDate <= startDate) {
            showNotification('Дата окончания должна быть позже даты начала', 'error');
            btn.disabled = false;
            btn.textContent = 'Создать 🏆';
            return;
        }

        await addDoc(collection(db, 'challenges'), {
            title:           document.getElementById('cTitle').value.trim(),
            description:     document.getElementById('cDescription').value.trim(),
            district:        document.getElementById('cDistrict').value,
            actionType:      document.getElementById('cActionType').value,
            goal:            parseInt(document.getElementById('cGoal').value),
            unit:            document.getElementById('cUnit').value.trim() || 'действий',
            reward:          document.getElementById('cReward').value.trim(),
            startDate:       startDate.toISOString(),
            endDate:         endDate.toISOString(),
            status:          'active',
            currentProgress: 0,
            participants:    [],
            participantCount: 0,
            createdBy:       auth.currentUser.uid,
            createdAt:       serverTimestamp()
        });

        showNotification('✅ Челлендж создан!', 'success');
        hideCreateModal();
        loadChallenges();
    } catch (error) {
        console.error('Error creating challenge:', error);
        showNotification('Ошибка: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Создать 🏆';
    }
});
auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            document.getElementById('createChallengeBtn')?.classList.remove('hidden');
        }
    } catch (e) {
        console.log('Could not check admin role');
    }
});