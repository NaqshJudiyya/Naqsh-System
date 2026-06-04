/**
 * config.js — إعدادات Firebase والحالة العامة
 * ==================================================
 * ⚠️ استبدل القيم أدناه ببيانات مشروعك من:
 *    Firebase Console → Project Settings → Your apps → Web
 *
 * لو لم تُعدّ Firebase بعد، التطبيق سيشتغل بدون أخطاء
 * لكن المصادقة وإنشاء البيانات لن تعمل حتى تُعدّه.
 */

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
  apiKey: "AIzaSyA5I_uukcIg99WKfsPZ3sIvDzaZmj_AYD4",
  authDomain: "naqsh-system-258.firebaseapp.com",
  projectId: "naqsh-system-258",
  storageBucket: "naqsh-system-258.firebasestorage.app",
  messagingSenderId: "1090657585429",
  appId: "1:1090657585429:web:144a5369a628057713011c",
  measurementId: "G-Y80MT5H593"
};

// ===== تهيئة Firebase بأمان — لا ينهار لو الإعدادات مؤقتة خاطئة =====
var auth = null;
var db = null;

if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('✅ Firebase جاهز');
    } catch (err) {
        console.warn('⚠️ Firebase غير مهيأ بعد: ' + err.message);
        console.warn('   التطبيق يعمل بدون Firebase لكن بدون مصادحة بيانات');
    }
} else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    // Firebase تم تهيئته بالفعل (مثلاً من امتداد آخر)
    auth = firebase.auth();
    db = firebase.firestore();
}

// ===== بريد المدير المعتمد =====
var ADMIN_EMAIL = 'NaqshJudiyya@gmail.com';

// ===== أنواع الأسئلة المتاحة =====
var QUESTION_TYPES = [
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
