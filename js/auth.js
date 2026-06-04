/**
 * auth.js — المصادقة + التوجيه الذكي
 * التغيير الأساسي: زوار الاستمارات لا يُجبرون على تسجيل الدخول
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Auth = {

    signInWithGoogle: function() {
        try {
            if (!Naqsh.Auth._firebaseReady()) return;
            var provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(function(err) {
                Naqsh.Auth._showError(err.message);
            });
        } catch (err) {
            Naqsh.Auth._showError('حدث خطأ — تحقق من Console (F12)');
        }
    },

    signInWithEmail: function() {
        try {
            if (!Naqsh.Auth._firebaseReady()) return;
            var email = document.getElementById('loginEmail').value.trim();
            var pass = document.getElementById('loginPass').value;
            if (!email || !pass) { Naqsh.Auth._showError('أدخل البريد وكلمة المرور'); return; }
            auth.signInWithEmailAndPassword(email, pass).catch(function(err) {
                Naqsh.Auth._showError(err.message);
            });
        } catch (err) {
            Naqsh.Auth._showError('حدث خطأ — تحقق من Console (F12)');
        }
    },

    signOut: function() {
        Naqsh.Utils.destroyCharts();
        if (typeof auth !== 'undefined') auth.signOut();
        // مسح هوية الزائر عند الخروج
        localStorage.removeItem('naqsh_visitor');
    },

    /**
     * تسجيل دخول تلقائي كزائر (anonymous) — بدون شاشة تسجيل
     * يُستخدم حين يفتح شخص رابط استمارة وليس مسجلاً
     */
    autoSignInAsVisitor: function(name, email) {
        return auth.signInAnonymously().then(function(result) {
            var uid = result.user.uid;
            // حفظ الهوية في localStorage
            localStorage.setItem('naqsh_visitor', JSON.stringify({
                uid: uid,
                name: name,
                email: email,
                ts: Date.now()
            }));
            // حفظ/تحديث مستند المستخدم في Firestore
            return db.collection('users').doc(uid).set({
                name: name,
                email: email,
                role: 'responder',
                assignedForms: [],
                photoURL: '',
                isAnonymous: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    },

    /**
     * هل Firebase جاهز للعمل؟
     */
    _firebaseReady: function() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            Naqsh.Utils.showToast('Firebase لم يتم تحميله — تحقق من js/config.js', 'error');
            return false;
        }
        return true;
    },

    _showError: function(msg) {
        var el = document.getElementById('authError');
        if (!el) return;
        var map = {
            'auth/user-not-found': 'لا يوجد حساب بهذا البريد',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/invalid-email': 'صيغة البريد غير صحيحة',
            'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
            'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً',
            'auth/popup-closed-by-user': 'تم إلغاء نافذة تسجيل الدخول',
            'auth/cancelled-popup-request': 'تم إلغاء تسجيل الدخول',
            'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
            'auth/internal-error': 'خطأ داخلي — فعّل Email/Password من Firebase Console'
        };
        el.textContent = map[msg] || msg;
        el.style.display = 'block';
        clearTimeout(el._timer);
        el._timer = setTimeout(function() { el.style.display = 'none'; }, 6000);
    },

    /**
     * مراقبة حالة المصادقة
     */
    init: function() {
        auth.onAuthStateChanged(async function(user) {
            var APP = Naqsh.APP;

            // ===== حالة: المستخدم ليس مسجلاً =====
            if (!user) {
                // هل يحاول فتح استمارة؟ لا تمنعه — واجهة الملء ستتعامل مع الأمر
                var params = new URLSearchParams(window.location.search);
                var formId = params.get('form');
                if (formId) {
                    APP.publicFormId = formId;
                    Naqsh.Router.showView('public');
                    return;
                }
                // ليس عنده رابط استمارة وليس مسجلاً → شاشة تسجيل الدخول
                Naqsh.Router.showView('auth');
                return;
            }

            APP.user = user;

            // ===== المستخدم مسجل (حقيقي أو anonymous) =====
            var userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                // مستخدم جديد غير anonymous → أنشئ حسابه
                var allUsers = await db.collection('users').get();
                var role = (user.email === ADMIN_EMAIL || allUsers.empty) ? 'admin' : 'responder';

                await db.collection('users').doc(user.uid).set({
                    name: user.displayName || user.isAnonymous ? 'زائر' : '',
                    email: user.email || '',
                    role: role,
                    assignedForms: [],
                    photoURL: user.photoURL || '',
                    isAnonymous: !!user.isAnonymous,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                APP.userData = { name: user.displayName || 'زائر', email: user.email || '', role: role, assignedForms: [], photoURL: user.photoURL || '', isAnonymous: !!user.isAnonymous };
            } else {
                APP.userData = userDoc.data();
            }

            // تحديث الاسم والصورة
            if (user.displayName && user.displayName !== APP.userData.name) {
                await db.collection('users').doc(user.uid).update({ name: user.displayName });
                APP.userData.name = user.displayName;
            }
            if (user.photoURL && !APP.userData.photoURL) {
                await db.collection('users').doc(user.uid).update({ photoURL: user.photoURL });
                APP.userData.photoURL = user.photoURL;
            }

            // ترقية حساب المدير تلقائياً
            if (user.email === ADMIN_EMAIL && APP.userData.role !== 'admin') {
                await db.collection('users').doc(user.uid).update({ role: 'admin' });
                APP.userData.role = 'admin';
            }

            // ===== التوجيه حسب الحالة =====
            var params = new URLSearchParams(window.location.search);
            var formId = params.get('form');

            if (formId && APP.userData.role === 'responder') {
                // مسجل كمستجيب + عنده رابط استمارة → املأها
                APP.publicFormId = formId;
                Naqsh.Router.showView('public');
            } else if (formId && APP.userData.role !== 'responder') {
                // مدير أو مستشار فتح رابط استمارة → اعرضها في وضع المعاينة (أو املأها)
                APP.publicFormId = formId;
                Naqsh.Router.showView('public');
            } else {
                // لا يوجد رابط استمارة → اذهب لداشبورد حسب الدور
                Naqsh.Router.showView(APP.userData.role);
            }
        });
    }
};
