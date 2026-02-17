import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentMode = 'signin';
let currentUser = null;

// auth state observer
// checking if user is logged in by console
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        console.log('✅ User logged in:', user.email);
        updateUIForLoggedInUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await createUserDocument(user);
        }
    } else {
        console.log('❌ User logged out');
        updateUIForLoggedOutUser();
    }
});

// user documnet on Firebase
async function createUserDocument(user, additionalData = {}) {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
        displayName: additionalData.displayName || user.displayName || 'EcoWarrior',
        email: user.email,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4A6741&color=fff`,
        district: additionalData.district || 'Алмалинский',
        ecoPoints: 0,
        trustScore: 50,
        streak: 0,
        totalActions: 0,
        co2Saved: 0,
        badges: [],
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp()
    };
    
    try {
        await setDoc(userRef, userData, { merge: true });
        console.log('✅ User document created');
    } catch (error) {
        console.error('❌ Error creating user document:', error);
    }
}

// open modal auth screen
window.showAuthModal = (mode = 'signin') => {
    currentMode = mode;
    const modal = document.getElementById('authModal');
    const signupFields = document.getElementById('signupFields');
    const buttonText = document.getElementById('authButtonText');
    const toggleText = document.getElementById('authToggle');
    
    if (mode === 'signup') {
        signupFields.classList.remove('hidden');
        buttonText.textContent = 'Зарегистрироваться';
        toggleText.textContent = 'Уже есть аккаунт? Войти';
    } else {
        signupFields.classList.add('hidden');
        buttonText.textContent = 'Войти';
        toggleText.textContent = 'Нет аккаунта? Зарегистрируйся';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// hide the modal
window.hideAuthModal = () => {
    const modal = document.getElementById('authModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('authError').classList.add('hidden');
};

// change the modal auth mode
window.toggleAuthMode = () => {
    currentMode = currentMode === 'signin' ? 'signup' : 'signin';
    showAuthModal(currentMode);
};
// sign in with google
window.signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await createUserDocument(result.user);
        hideAuthModal();
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('❌ Google sign-in error:', error);
        showAuthError('Ошибка входа через Google: ' + error.message);
    }
};
// Handle auth form submission
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    if (!authForm) return;
    
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        
        try {
            if (currentMode === 'signup') {
                const name = document.getElementById('authName').value;
                const district = document.getElementById('authDistrict').value;
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                    displayName: name
                });
                await createUserDocument(userCredential.user, { displayName: name, district });
                
                console.log('✅ User registered:', email);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('✅ User signed in:', email);
            }
            
            hideAuthModal();
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('❌ Auth error:', error);
            let errorMessage = 'Ошибка аутентификации';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email уже используется';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Неверный формат email';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Пароль должен быть не менее 6 символов';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Неверный email или пароль';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showAuthError(errorMessage);
        }
    });
});

// auth error
function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// ui update for logged users
function updateUIForLoggedInUser(user) {
    // upd nav
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => {
        if (btn.textContent.includes('Войти') || btn.textContent.includes('Начать')) {
            btn.onclick = () => window.location.href = 'dashboard.html';
            btn.textContent = user.displayName || 'Профиль';
        }
    });
}

// ui update for logged out users
function updateUIForLoggedOutUser() {
    // reset the ui
}

// Sign out
window.signOutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Sign out error:', error);
    }
};

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
    return currentUser !== null;
}

// Require authentication
export function requireAuth() {
    if (!currentUser) {
        window.location.href = 'index.html';
    }
}

export { currentUser };