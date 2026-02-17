// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
const firebaseConfig = {
  apiKey: "AIzaSyATzHKHOx9NwzjzBHsHTU9w8tAjXkchzK4",
  authDomain: "insomnianishackathon.firebaseapp.com",
  projectId: "insomnianishackathon",
  storageBucket: "insomnianishackathon.firebasestorage.app",
  messagingSenderId: "621119641598",
  appId: "1:621119641598:web:dfef7ec231c468813112af",
  measurementId: "G-07P85GRQNE"
};
const app = initializeApp(firebaseConfig); // initialize app
export const auth = getAuth(app);// export services
export const db = getFirestore(app);

// action types
export const ACTION_TYPES = {
    cleanup: { label: 'Уборка мусора', icon: '🧹', co2PerUnit: 2, points: 30 },
    tree: { label: 'Посадка дерева', icon: '🌳', co2PerUnit: 20, points: 50 },
    recycle: { label: 'Переработка', icon: '♻️', co2PerUnit: 1.5, points: 20 },
    bike: { label: 'На велосипеде', icon: '🚲', co2PerUnit: 0.15, points: 10 },
    water: { label: 'Экономия воды', icon: '💧', co2PerUnit: 0.5, points: 15 },
    energy: { label: 'Экономия энергии', icon: '💡', co2PerUnit: 3, points: 25 },
    education: { label: 'Эко-просвещение', icon: '📚', co2PerUnit: 0, points: 40 },
    other: { label: 'Другое', icon: '🌱', co2PerUnit: 1, points: 20 }
};

// districts in kazakhstan
export const DISTRICTS = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Актобе',
    'Караганда',
    'Тараз',
    'Павлодар',
    'Өскемен',
    'Семей',
    'Атырау',
    'Қостанай',
    'Қызылорда',
    'Орал',
    'Петропавл',
    'Ақтау',
    'Темиртау',
    'Түркістан',
    'Көкшетау',
    'Талдықорған',
    'Екібастұз',
    'Рудный',
    'Жезқазған',
    'Балқаш',
    'Жаңаөзен',
    'Кентау',
    'Лисаковск',
    'Степногорск',
    'Байқоңыр',
    'Риддер',
    'Щучинск',
    'Аксай',
    'Аральск',
    'Ақсу',
    'Алға',
    'Аягөз',
    'Жаркент',
    'Зайсан',
    'Қапшағай',
    'Қаратау',
    'Қаскелен',
    'Конаев',
    'Леңгір',
    'Макинск',
    'Текелі',
    'Хромтау',
];

// status in colors
export const STATUS_COLORS = {
    pending: 'red',
    verified: 'green',
    rejected: 'gray'
};

console.log('🔥 Firebase initialized'); // status in console