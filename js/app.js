/**
 * app.js — نقطة البدء
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== تحقق من تحميل السكريبتات الأساسية =====
    if (typeof Naqsh === 'undefined') {
        document.getElementById('authForms').innerHTML =
            '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;text-align:right">' +
            '<p style="color:#dc2626;font-weight:700;margin-bottom:8px"><i class="fa-solid fa-triangle-exclamation" style="margin-left:6px"></i>ملفات JavaScript لم تُحمّل</p>' +
            '<p style="color:#78716c;font-size:13px;line-height:1.8">تأكد أن مجلد <code style="background:#f5f5f4;padding:2px 6px;border-radius:4px;font-size:12px">js/</code> يحتوي على كل الملفات وأنك تفتح الصفحة عبر سيرفر (لا تفتحها كملف مباشر).</p></div>';
        return;
    }

    // ===== تحقق من Firebase =====
    if (!auth || !db) {
        // Firebase غير مهيأ — أظهر رسالة بدلاً من شاشة تسجيل الدخول الفارغة
        var authEl = document.querySelector('.auth-box');
        if (authEl) {
            authEl.innerHTML =
                '<div style="width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,#d97706,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px;color:#fff;box-shadow:0 8px 30px rgba(217,119,6,.3)"><i class="fa-solid fa-gear fa-spin"></i></div>' +
                '<h1 style="font-size:24px;font-weight:900;color:#92400e;margin-bottom:8px">في وضع التطوير</h1>' +
                '<p style="color:#78716c;font-size:14px;margin-bottom:24px;line-height:1.8">Firebase غير مهيأ بعد. الواجهة تعمل للمعاينة لكن المصادقة وحفظ البيانات متوقفة.</p>' +
                '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;text-align:right;margin-bottom:20px">' +
                '<p style="color:#92400e;font-size:13px;font-weight:600;margin-bottom:6px">للتفعيل الكامل:</p>' +
                '<ol style="color:#78716c;font-size:12px;line-height:2;padding-right:20px">' +
                '<li>أنشئ مشروع Firebase من <a href="https://console.firebase.google.com" target="_blank" style="color:var(--accent);text-decoration:underline">console.firebase.google.com</a></li>' +
                '<li>فعّل Authentication (Google + Email/Password)</li>' +
                '<li>فعّل Cloud Firestore</li>' +
                '<li>أنشئ المستخدم <code style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-size:11px">NaqshJudiyya@gmail.com</code></li>' +
                '<li>انسخ <code style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-size:11px">firebaseConfig</code> إلى <code style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-size:11px">js/config.js</code></li>' +
                '</ol></div>' +
                '<button class="btn btn-primary btn-full" onclick="location.reload()" style="background:#d97706"><i class="fa-solid fa-rotate-right"></i>إعادة المحاولة بعد الإعداد</button>';
        }

        // حاول تحميل استمارة لو في الرابط واحدة
        var params = new URLSearchParams(window.location.search);
        var formId = params.get('form');
        if (formId) {
            Naqsh.APP.publicFormId = formId;
            document.getElementById('publicView').style.display = 'block';
            document.getElementById('publicContent').innerHTML =
                '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
                '<i class="fa-solid fa-gear fa-spin" style="font-size:36px;display:block;margin-bottom:16px;color:#d97706"></i>' +
                '<h2 style="font-size:18px;font-weight:700;color:#92400e;margin-bottom:8px">وضع التطوير</h2>' +
                '<p>لا يمكن تحميل الاستمارة بدون Firebase. أعد تحميل الصفحة بعد الإعداد.</p></div>';
        }
        return;
    }

    // ===== كل شيء جاهز — شغّل المصادقة =====
    try {
        Naqsh.Auth.init();
    } catch (err) {
        console.error('خطأ في تهيئة المصادقة:', err);
    }
});
