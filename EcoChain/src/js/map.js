import { db, auth, ACTION_TYPES } from './firebase-config.js'; 
import { 
    collection, 
    query,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showNotification, formatDate } from './utils.js'; // import from other files

let map;
let markers = [];
let actions = [];
let currentLocation = null;
let currentActionId = null;

// photo convertation
function fileToBase64(file, maxSize = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
            if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Не удалось загрузить фото'));
        img.src = URL.createObjectURL(file);
    });
}

// map initialize
function initMap() {
    map = L.map('map').setView([43.2220, 76.8512], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                map.setView([coords.latitude, coords.longitude], 14);
                L.marker([coords.latitude, coords.longitude], {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>'
                    })
                }).addTo(map).bindPopup('Вы здесь');
            },
            () => console.log('Геолокация недоступна')
        );
    }
    loadActions();
}

// load actions
function loadActions() {
    onSnapshot(query(collection(db, 'ecoActions')), (snapshot) => {
        actions = [];
        snapshot.forEach(d => actions.push({ id: d.id, ...d.data() }));
        applyFiltersAndDisplay();
    }, (err) => {
        console.error('Ошибка загрузки:', err);
        showNotification('Ошибка загрузки действий', 'error');
    });
}

// filters for action types
function applyFiltersAndDisplay() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter   = document.getElementById('typeFilter').value;
    let filtered = actions;
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (typeFilter   !== 'all') filtered = filtered.filter(a => a.type   === typeFilter);
    displayActionsOnMap(filtered);
    displayActionsList(filtered);
}

// displaying actions on map
function displayActionsOnMap(list) {
    markers.forEach(m => m.remove());
    markers = [];
    list.forEach(action => {
        if (!action.location) return;
        const at    = ACTION_TYPES[action.type] || ACTION_TYPES.other;
        const color = { pending:'#eab308', verified:'#10b981', rejected:'#ef4444' }[action.status] || '#6b7280';
        const canComplete = action.userId === auth.currentUser?.uid && action.status === 'pending' && !action.photoAfter;
        const marker = L.marker([action.location.lat, action.location.lng], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background:${color};padding:8px;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:18px;">${at.icon}</div>`
            })
        }).addTo(map);
        const statusLabel = { pending:'⏳ Ожидает', verified:'✅ Верифицировано', rejected:'❌ Отклонено' }[action.status] || action.status;
        marker.bindPopup(`
            <div style="max-width:260px;">
                <h3 style="font-weight:700;font-size:15px;margin-bottom:6px;">${at.icon} ${action.title}</h3>
                <p style="font-size:13px;color:#666;margin-bottom:8px;">${action.description}</p>
                ${action.photoBefore ? `<img src="${action.photoBefore}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ''}
                <div style="font-size:12px;color:#666;">👤 ${action.userName || 'User'} • ${formatDate(action.createdAt)}</div>
                <div style="font-size:13px;font-weight:700;color:#10b981;margin:4px 0;">🌍 ${(action.co2Impact||0).toFixed(1)} кг CO₂</div>
                <div style="font-size:12px;">Статус: <b>${statusLabel}</b></div>
                ${canComplete ? `<button onclick="openCompleteModal('${action.id}')" style="margin-top:10px;width:100%;background:#10b981;color:white;padding:9px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">✅ Завершить действие</button>` : ''}
            </div>
        `);
        markers.push(marker);
    });
}

// actions list on sidebar
function displayActionsList(list) {
    const container = document.getElementById('actionsList');
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#999;">🔍 Нет действий</div>`;
        return;
    }
    container.innerHTML = list.slice(0, 30).map(action => {
        const at = ACTION_TYPES[action.type] || ACTION_TYPES.other;
        const color = { pending:'#eab308', verified:'#10b981', rejected:'#ef4444' }[action.status] || '#999';
        const desc  = (action.description || '').substring(0, 70);
        return `
            <div class="action-card" onclick="focusOnAction('${action.id}')">
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div style="font-size:22px;">${at.icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;margin-bottom:3px;">${action.title}</div>
                        <div style="font-size:12px;color:#666;margin-bottom:4px;">${desc}${desc.length>=70?'...':''}</div>
                        <div style="font-size:11px;color:#999;">👤 ${action.userName||'User'} • ${formatDate(action.createdAt)}</div>
                    </div>
                    <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;margin-top:4px;"></div>
                </div>
            </div>`;
    }).join('');
}

// focus on marker (action)
window.focusOnAction = function(id) {
    const a = actions.find(x => x.id === id);
    if (!a?.location) return;
    map.setView([a.location.lat, a.location.lng], 16);
    const m = markers.find(m => { const ll = m.getLatLng(); return ll.lat === a.location.lat && ll.lng === a.location.lng; });
    if (m) m.openPopup();
};

window.hideAddActionModal = window.hideAddModal = function() {
    document.getElementById('addActionModal').classList.remove('active');
    document.getElementById('addActionForm').reset();
    document.getElementById('photoBeforePreview').innerHTML = '';
    document.getElementById('locationInfo').textContent = '';
    currentLocation = null;
};
// get the actual location
document.getElementById('getLocationBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('getLocationBtn');
    btn.textContent = '⏳ Получаю...';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            currentLocation = { lat: coords.latitude, lng: coords.longitude };
            document.getElementById('locationInfo').innerHTML =
                `<span style="color:#10b981;">✓ ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}</span>`;
            btn.textContent = '📍 Локация получена ✓';
        },
        () => {
            showNotification('Не удалось получить геолокацию', 'error');
            btn.textContent = '📍 Получить текущую локацию';
            btn.disabled = false;
        }
    );
});
//uploading photo before
document.getElementById('photoBefore')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('photoBeforePreview').innerHTML =
            `<img src="${ev.target.result}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-top:8px;">`;
    };
    reader.readAsDataURL(file);
});
// add action
document.getElementById('addActionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return showNotification('Войдите в аккаунт', 'error');
    if (!currentLocation)  return showNotification('Получите геолокацию', 'error');
 

    const photoFile = document.getElementById('photoBefore').files[0];
    if (!photoFile) return showNotification('Добавьте фото ДО', 'error');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Сохраняем...';
    try {
        const photoBefore = await fileToBase64(photoFile);
        const title       = document.getElementById('actionTitle').value.trim();
        const description = document.getElementById('actionDescription').value.trim();
        const type        = document.getElementById('actionType').value;
        const quantity    = parseInt(document.getElementById('actionQuantity').value) || 1;
        const at          = ACTION_TYPES[type];

        await addDoc(collection(db, 'ecoActions'), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'User',
            userPhoto: auth.currentUser.photoURL || '',
            title, description, type, quantity,
            photoBefore,
            photoAfter: null,
            location: currentLocation,
            co2Impact: (at?.co2PerUnit || 0) * quantity,
            ecoPoints: at?.points || 20,
            status: 'pending',
            verifications: [],
            verificationCount: 0,
            createdAt: serverTimestamp(),
            completedAt: null
        });

        showNotification('✅ Создано! Нажмите на маркер → "Завершить действие"', 'success');
        hideAddModal();
    } catch (err) {
        console.error(err);
        showNotification('Ошибка: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Создать';
    }
});

// complete the action
window.openCompleteModal = function(id) {
    currentActionId = id;
    window._currentActionId = id;
    document.getElementById('completeActionModal').classList.add('active');
};

window.hideCompleteActionModal = window.hideCompleteModal = function() {
    document.getElementById('completeActionModal').classList.remove('active');
    document.getElementById('completeActionForm').reset();
    document.getElementById('photoAfterPreview').innerHTML = '';
    currentActionId = null;
    window._currentActionId = null;
};

document.getElementById('photoAfter')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('photoAfterPreview').innerHTML =
            `<img src="${ev.target.result}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-top:8px;">`;
    };
    reader.readAsDataURL(file);
});

document.getElementById('completeActionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentActionId) return showNotification('Ошибка: действие не выбрано', 'error');

    const photoFile = document.getElementById('photoAfter').files[0];
    if (!photoFile) return showNotification('Добавьте фото ПОСЛЕ', 'error');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Сохраняем...';

    try {
        const photoAfter = await fileToBase64(photoFile);
        const comment    = document.getElementById('completionComment').value.trim();

        await updateDoc(doc(db, 'ecoActions', currentActionId), {
            photoAfter,
            completionComment: comment,
            completedAt: serverTimestamp()
        });

        showNotification('✅ Действие завершено! Ожидайте верификации.', 'success');
        hideCompleteActionModal();
    } catch (err) {
        console.error(err);
        showNotification('Ошибка: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Завершить ✅';
    }
});

// applying filters
document.getElementById('applyFilters')?.addEventListener('click', applyFiltersAndDisplay);

// start map
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        initMap();
    } else {
        const unsub = auth.onAuthStateChanged(user => {
            if (user) { initMap(); unsub(); }
            else window.location.href = 'index.html';
        });
    }
});