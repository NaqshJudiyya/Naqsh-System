/**
 * config.js — إعدادات Firebase والحالة العامة للتطبيق
 * ==================================================
 * ⚠️ استبدل القيم أدناه ببيانات مشروعك من Firebase Console
 *    Project Settings → Your apps → Web app → firebaseConfig
 */

// ===== إعدادات Firebase — استبدلها =====
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ===== تهيئة Firebase =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== بريد المدير المعتمد =====
const ADMIN_EMAIL = 'NaqshJudiyya@gmail.com';

// ===== أنواع الأسئلة المتاحة =====
const QUESTION_TYPES = [
    { id: 'short_text',     label: 'نص قصير',           icon: 'fa-font',                      hasOptions: false, hasPoints: false },
    { id: 'paragraph',       label: 'نص طويل',           icon: 'fa-align-right',               hasOptions: false, hasPoints: false },
    { id: 'email',           label: 'بريد إلكتروني',     icon: 'fa-envelope',                  hasOptions: false, hasPoints: false },
    { id: 'number',          label: 'رقم',                icon: 'fa-hashtag',                   hasOptions: false, hasPoints: false },
    { id: 'date',            label: 'تاريخ',               icon: 'fa-calendar',                  hasOptions: false, hasPoints: false },
    { id: 'time',            label: 'وقت',                 icon: 'fa-clock',                     hasOptions: false, hasPoints: false },
    { id: 'choice',          label: 'اختيار واحد',        icon: 'fa-circle-dot',                hasOptions: true,  hasPoints: true },
    { id: 'checkbox',        label: 'اختيارات متعددة',    icon: 'fa-square-check',              hasOptions: true,  hasPoints: true },
    { id: 'dropdown',        label: 'قائمة منسدلة',       icon: 'fa-caret-down',                hasOptions: true,  hasPoints: true },
    { id: 'scale',           label: 'مقياس خطي',          icon: 'fa-sliders',                   hasOptions: false, hasPoints: true },
    { id: 'matrix',          label: 'مصفوفة مقياس',       icon: 'fa-table-cells',               hasOptions: false, hasPoints: true },
    { id: 'section_header',  label: 'عنوان قسم',          icon: 'fa-heading',                    hasOptions: false, hasPoints: false }
];

// ===== الحالة العامة للتطبيق =====
window.Naqsh = window.Naqsh || {};
window.Naqsh.APP = {
    user: null,
    userData: null,
    currentTab: {
        admin: 'forms',
        counselor: 'c-forms',
        responder: 'r-history'
    },
    forms: [],
    users: [],
    builderForm: null,
    builderQuestions: [],
    editingFormId: null,
    selectedFormId: null,
    chartInstances: [],
    publicFormId: null
};