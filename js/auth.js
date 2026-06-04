/**
 * auth.js — المصادقة + التوجيه الذكي
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
        localStorage.removeItem('naqsh_visitor');
    },

    autoSignInAsVisitor: function(name, email) {
        return auth.signInAnonymously().then(function(result) {
            var uid = result.user.uid;
            localStorage.setItem('naqsh_visitor', JSON.stringify({
                uid: uid,
                name: name,
                email: email,
                ts: Date.now()
            }));
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

    _firebaseReady: function() {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth || !firebase.apps.length) {
                Naqsh.Utils.showToast('Firebase غير مهيأ — لن تعمل المصادقة', 'warning');
                return false;
            }
            return true;
        } catch(e) {
            return false;
        }
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

    init: function() {
        auth.onAuthStateChanged(async function(user) {
            var APP = Naqsh.APP;

            if (!user) {
                var params = new URLSearchParams(window.location.search);
                var formId = params.get('form');
                if (formId) {
                    APP.publicFormId = formId;
                    Naqsh.Router.showView('public');
                    return;
                }
                Naqsh.Router.showView('auth');
                return;
            }

            APP.user = user;

            var userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                var allUsers = await db.collection('users').get();
                var role = (user.email === ADMIN_EMAIL || allUsers.empty) ? 'admin' : 'responder';

                await db.collection('users').doc(user.uid).set({
                    name: (user.displayName || (user.isAnonymous ? 'زائر' : '')),
                    email: user.email || '',
                    role: role,
                    assignedForms: [],
                    photoURL: user.photoURL || '',
                    isAnonymous: !!user.isAnonymous,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                APP.userData = { name: (user.displayName || (user.isAnonymous ? 'زائر' : '')), email: user.email || '', role: role, assignedForms: [], photoURL: user.photoURL || '', isAnonymous: !!user.isAnonymous };
            } else {
                APP.userData = userDoc.data();
            }

            if (user.displayName && user.displayName !== APP.userData.name) {
                await db.collection('users').doc(user.uid).update({ name: user.displayName });
                APP.userData.name = user.displayName;
            }
            if (user.photoURL && !APP.userData.photoURL) {
                await db.collection('users').doc(user.uid).update({ photoURL: user.photoURL });
                APP.userData.photoURL = user.photoURL;
            }

            if (user.email === ADMIN_EMAIL && APP.userData.role !== 'admin') {
                await db.collection('users').doc(user.uid).update({ role: 'admin' });
                APP.userData.role = 'admin';
            }

            var params = new URLSearchParams(window.location.search);
            var formId = params.get('form');

            if (formId && APP.userData.role === 'responder') {
                APP.publicFormId = formId;
                Naqsh.Router.showView('public');
            } else if (formId && APP.userData.role !== 'responder') {
                APP.publicFormId = formId;
                Naqsh.Router.showView('public');
            } else {
                Naqsh.Router.showView(APP.userData.role);
            }
        });
    }
};
