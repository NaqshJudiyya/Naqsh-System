/**
 * auth.js — المصادقة: جوجل + بريد إلكتروني/كلمة مرور
 *          مع معالجة أخطاء شاملة
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Auth = {

    /**
     * تسجيل الدخول بحساب جوجل
     */
    signInWithGoogle: function() {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                Naqsh.Utils.showToast('Firebase لم يتم تحميله — تحقق من config.js', 'error');
                return;
            }
            var provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(function(err) {
                Naqsh.Auth._showError(err.message);
            });
        } catch (err) {
            console.error('signInWithGoogle error:', err);
            Naqsh.Auth._showError('حدث خطأ غير متوقع — تحقق من Console');
        }
    },

    /**
     * تسجيل الدخول بالبريد وكلمة المرور
     */
    signInWithEmail: function() {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                Naqsh.Utils.showToast('Firebase لم يتم تحميله — تحقق من config.js', 'error');
                return;
            }
            var email = document.getElementById('loginEmail').value.trim();
            var pass = document.getElementById('loginPass').value;
            if (!email || !pass) {
                Naqsh.Auth._showError('أدخل البريد وكلمة المرور');
                return;
            }
            auth.signInWithEmailAndPassword(email, pass).catch(function(err) {
                Naqsh.Auth._showError(err.message);
            });
        } catch (err) {
            console.error('signInWithEmail error:', err);
            Naqsh.Auth._showError('حدث خطأ غير متوقع — تحقق من Console');
        }
    },

    /**
     * تسجيل الخروج
     */
    signOut: function() {
        Naqsh.Utils.destroyCharts();
        if (typeof auth !== 'undefined') {
            auth.signOut();
        }
    },

    /**
     * عرض خطأ تسجيل الدخول
     */
    _showError: function(msg) {
        var el = document.getElementById('authError');
        if (!el) return;
        // ترجمة رسائل Firebase الشائعة للعربية
        var translations = {
            'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة',
            'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
            'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً',
            'auth/popup-closed-by-user': 'تم إلغاء نافذة تسجيل الدخول',
            'auth/cancelled-popup-request': 'تم إلغاء تسجيل الدخول',
            'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
            'auth/internal-error': 'خطأ داخلي — تأكد من تفعيل Email/Password في Firebase Console'
        };
        var arabicMsg = translations[msg] || msg;
        el.textContent = arabicMsg;
        el.style.display = 'block';
        clearTimeout(el._timer);
        el._timer = setTimeout(function() {
            el.style.display = 'none';
        }, 6000);
    },

    /**
     * مراقبة حالة المصادقة — النقطة المركزية
     */
    init: function() {
        var self = this;

        auth.onAuthStateChanged(async function(user) {
            var APP = Naqsh.APP;

            if (!user) {
                Naqsh.Router.showView('auth');
                return;
            }

            APP.user = user;
            console.log('✅ تسجيل دخول:', user.email, '| UID:', user.uid);

            // التحقق من وجود المستخدم في Firestore
            var userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                // أول مستخدم يصبح مدير، أو بريد المدير المعتمد
                var allUsers = await db.collection('users').get();
                var role = (user.email === ADMIN_EMAIL || allUsers.empty) ? 'admin' : 'responder';

                console.log('📝 إنشاء مستخدم جديد بدور:', role);

                var userData = {
                    name: user.displayName || '',
                    email: user.email,
                    role: role,
                    assignedForms: [],
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('users').doc(user.uid).set(userData);
                APP.userData = userData;
            } else {
                APP.userData = userDoc.data();
            }

            // تحديث الاسم والصورة إذا تغيرا
            if (user.displayName && user.displayName !== APP.userData.name) {
                await db.collection('users').doc(user.uid).update({ name: user.displayName });
                APP.userData.name = user.displayName;
            }
            if (user.photoURL && !APP.userData.photoURL) {
                await db.collection('users').doc(user.uid).update({ photoURL: user.photoURL });
                APP.userData.photoURL = user.photoURL;
            }

            // التأكد من دور المدير
            if (user.email === ADMIN_EMAIL && APP.userData.role !== 'admin') {
                console.log('🔧 ترقية حساب المدير');
                await db.collection('users').doc(user.uid).update({ role: 'admin' });
                APP.userData.role = 'admin';
            }

            console.log('🎯 الدور النهائي:', APP.userData.role);

            // هل يفتح استمارة عبر رابط؟
            var params = new URLSearchParams(window.location.search);
            var formId = params.get('form');
            if (formId && APP.userData.role === 'responder') {
                APP.publicFormId = formId;
                Naqsh.Router.showView('public');
                return;
            }

            // توجيه حسب الدور
            Naqsh.Router.showView(APP.userData.role);
        });
    }
};
