/**
 * app.js — نقطة البدء: يتحقق من تحميل السكريبتات ويشغّل المصادقة
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== تحقق من تحميل جميع المكتبات =====
    if (typeof firebase === 'undefined') {
        document.getElementById('authForms').innerHTML =
            '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;text-align:right">' +
            '<p style="color:#dc2626;font-weight:700;margin-bottom:8px"><i class="fa-solid fa-triangle-exclamation" style="margin-left:6px"></i>لم يتم تحميل Firebase</p>' +
            '<p style="color:#78716c;font-size:13px;line-height:1.8">تأكد من اتصالك بالإنترنت وأن ملف <code style="background:#f5f5f4;padding:2px 6px;border-radius:4px;font-size:12px">js/config.js</code> يحتوي على بيانات مشروعك الصحيحة من Firebase Console.</p></div>';
        return;
    }

    if (typeof Naqsh === 'undefined' || typeof Naqsh.Auth === 'undefined') {
        document.getElementById('authForms').innerHTML =
            '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;text-align:right">' +
            '<p style="color:#dc2626;font-weight:700;margin-bottom:8px"><i class="fa-solid fa-triangle-exclamation" style="margin-left:6px"></i>خطأ في تحميل الملفات</p>' +
            '<p style="color:#78716c;font-size:13px;line-height:1.8">تأكد أن جميع ملفات <code style="background:#f5f5f4;padding:2px 6px;border-radius:4px;font-size:12px">js/*.js</code> موجودة في مكانها الصحيح ولم يحدث خطأ أثناء التحميل. افتح Console (F12) لتفاصيل الخطأ.</p></div>';
        return;
    }

    // ===== كل شيء جاهز — شغّل المصادقة =====
    try {
        Naqsh.Auth.init();
    } catch (err) {
        console.error('خطأ في تهيئة المصادقة:', err);
        document.getElementById('authForms').innerHTML +=
            '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-top:16px;text-align:right">' +
            '<p style="color:#92400e;font-size:13px"><i class="fa-solid fa-gear" style="margin-left:6px"></i>تأكد من صحة بيانات Firebase في <code style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:11px">js/config.js</code></p></div>';
    }
});
