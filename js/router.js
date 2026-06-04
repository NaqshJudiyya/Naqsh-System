/**
 * router.js — التنقل بين الواجهات والتبويبات
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Router = {

    /** خريطة: اسم الواجهة → معرف العنصر */
    viewMap: {
        auth: 'authView',
        admin: 'adminView',
        counselor: 'counselorView',
        responder: 'responderView',
        public: 'publicView'
    },

    /** خريطة: دور → معرف الشريط الجانبي */
    sidebarMap: {
        admin: 'adminSidebar',
        counselor: 'counselorSidebar',
        responder: 'responderSidebar'
    },

    /** خريطة: دور → معرف المحتوى */
    contentMap: {
        admin: 'adminContent',
        counselor: 'counselorContent',
        responder: 'responderContent'
    },

    /** خريطة: دور → بادئة عناصر المستخدم */
    prefixMap: {
        admin: 'admin',
        counselor: 'counselor',
        responder: 'responder'
    },

    /**
     * إظهار واجهة محددة وإخفاء الباقي
     */
    showView: function(viewName) {
    var ids = ['authView', 'adminView', 'counselorView', 'responderView', 'publicView'];
    for (var i = 0; i < ids.length; i++) {
        document.getElementById(ids[i]).style.display = 'none';
    }
    var target = document.getElementById(this.viewMap[viewName]);
    target.style.display = (viewName === 'auth') ? 'flex' : 'block';

    if (viewName === 'admin') {
        this._setUserInfo('admin');
        this.switchTab('admin', 'forms');
    } else if (viewName === 'counselor') {
        this._setUserInfo('counselor');
        this.switchTab('counselor', 'c-forms');
    } else if (viewName === 'responder') {
        this._setUserInfo('responder');
        this.switchTab('responder', 'r-history');
    } else if (viewName === 'public') {
        // لا تتطلب تسجيل دخول — public-form.js يتعامل مع الأمر
        Naqsh.PublicForm.load();
    }
},

    /**
     * تحديث اسم وصورة المستخدم في الشريط الجانبي
     */
    _setUserInfo: function(role) {
        var APP = Naqsh.APP;
        var prefix = this.prefixMap[role];
        var nameEl = document.getElementById(prefix + 'Name');
        var avatarEl = document.getElementById(prefix + 'Avatar');
        if (nameEl) {
            nameEl.textContent = APP.userData.name || APP.user.email;
        }
        if (avatarEl && APP.userData.photoURL) {
            avatarEl.innerHTML = '<img src="' + APP.userData.photoURL + '" alt="avatar">';
        }
    },

    /**
     * التبديل بين تبويبات نفس الواجهة
     */
    switchTab: function(role, tab) {
        var APP = Naqsh.APP;
        APP.currentTab[role] = tab;

        // تحديث الشريط الجانبي
        var sidebarId = this.sidebarMap[role];
        var navItems = document.querySelectorAll('#' + sidebarId + ' .nav-item');
        for (var i = 0; i < navItems.length; i++) {
            var item = navItems[i];
            if (item.dataset.tab) {
                item.classList.toggle('active', item.dataset.tab === tab);
            }
        }
        document.getElementById(sidebarId).classList.remove('open');

        // تدمير الرسوم السابقة
        Naqsh.Utils.destroyCharts();

        // استدعاء الدالة المناسبة
        var fnMap = {
            admin: {
                forms: Naqsh.Admin.renderForms,
                builder: Naqsh.Builder.render,
                users: Naqsh.Admin.renderUsers,
                analysis: Naqsh.Admin.renderCrossAnalysis
            },
            counselor: {
                'c-forms': Naqsh.Counselor.renderForms,
                'c-stats': Naqsh.Counselor.renderStats
            },
            responder: {
                'r-history': Naqsh.Responder.renderHistory,
                'r-stats': Naqsh.Responder.renderStats
            }
        };

        var roleFns = fnMap[role];
        if (roleFns && roleFns[tab]) {
            roleFns[tab]();
        }
    }
};

// ===== حدث زر القائمة للموبايل =====
document.addEventListener('DOMContentLoaded', function() {
    var toggleBtn = document.getElementById('mobileToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            // إغلاق جميع الأشرطة أولاً
            var sidebars = document.querySelectorAll('.sidebar');
            for (var i = 0; i < sidebars.length; i++) {
                if (sidebars[i].style.display !== 'none') {
                    sidebars[i].classList.toggle('open');
                    return;
                }
            }
        });
    }
});
