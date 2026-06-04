/**
 * auth.js — المصادقة: جوجل + بريد إلكتروني/كلمة مرور
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Auth = {

    /**
     * تسجيل الدخول بحساب جوجل
     */
    signInWithGoogle: function() {
        var provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(function(err) {
            Naqsh.Auth._showError(err.message);
        });
    },

    /**
     * تسجيل الدخول بالبريد وكلمة المرور
     */
    signInWithEmail: function() {
        var email = document.getElementById('loginEmail').value.trim();
        var pass = document.getElementById('loginPass').value;
        if (!email || !pass) {
            Naqsh.Auth._showError('أدخل البريد وكلمة المرور');
            return;
        }
        auth.signInWithEmailAndPassword(email, pass).catch(function(err) {
            Naqsh.Auth._showError(err.message);
        });
    },

    /**
     * تسجيل الخروج
     */
    signOut: function() {
        Naqsh.Utils.destroyCharts();
        auth.signOut();
    },

    /**
     * عرض خطأ تسجيل الدخول
     */
    _showError: function(msg) {
        var el = document.getElementById('authError');
        el.textContent = msg;
        el.style.display = 'block';
        clearTimeout(el._timer);
        el._timer = setTimeout(function() {
            el.style.display = 'none';
        }, 5000);
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

            // التحقق من وجود المستخدم في Firestore
            var userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                // أول مستخدم يصبح مدير، أو بريد المدير المعتمد
                var allUsers = await db.collection('users').get();
                var role = (user.email === ADMIN_EMAIL || allUsers.empty) ? 'admin' : 'responder';

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
                await db.collection('users').doc(user.uid).update({ role: 'admin' });
                APP.userData.role = 'admin';
            }

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