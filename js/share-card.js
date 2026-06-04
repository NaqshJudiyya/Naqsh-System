/**
 * share-card.js — إنشاء بطاقة النتيجة وتحميلها كصورة
 */

window.Naqsh = window.Naqsh || {};
Naqsh.ShareCard = {};

Naqsh.ShareCard.generate = function(responseId, title, name, date, score, label, msg, color) {
    var wrapper = document.getElementById('shareCardWrapper');
    if (!wrapper) {
        Naqsh.Utils.showToast('خطأ في إنشاء البطاقة', 'error');
        return;
    }

    // إنشاء HTML للبطاقة
    var cardHtml = '<div class="share-card" id="shareCardInner">' +
        '<div style="font-size:22px;font-weight:900;margin-bottom:16px">' + title + '</div>' +
        '<div style="font-size:15px;margin-bottom:8px">الاسم: <strong>' + name + '</strong></div>' +
        '<div style="font-size:12px;color:#94a3b8;margin-bottom:24px">' + date + '</div>' +
        '<div style="font-size:48px;font-weight:900;color:#fff;margin-bottom:8px">' + score + ' <span style="font-size:18px">نقطة</span></div>' +
        (label ? '<div style="display:inline-block;padding:8px 20px;border-radius:20px;background:rgba(255,255,255,0.2);font-size:15px;font-weight:700;margin-bottom:12px">' + label + '</div>' : '') +
        (msg ? '<div style="font-size:14px;line-height:1.8;opacity:0.9;margin-top:12px;background:rgba(255,255,255,0.1);padding:12px;border-radius:10px">' + msg + '</div>' : '') +
        '<div style="margin-top:30px;font-size:10px;color:#64748b">نظام الاستمارات الذكي — نقش Judiyya</div>' +
        '</div>';

    wrapper.innerHTML = cardHtml;

    // استخدام html2canvas لتحويل البطاقة لصورة
    var target = document.getElementById('shareCardInner');
    
    // تأخير بسيط لضمان رسم العناصر
    setTimeout(function() {
        html2canvas(target, { 
            scale: 2, // جودة عالية
            useCORS: true, 
            backgroundColor: null 
        }).then(function(canvas) {
            var link = document.createElement('a');
            link.download = 'naqsh-result-' + responseId + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            Naqsh.Utils.showToast('تم حفظ البطاقة بنجاح', 'success');
            wrapper.innerHTML = ''; // تنظيف الذاكرة
        }).catch(function(err) {
            Naqsh.Utils.showToast('فشل إنشاء البطاقة', 'error');
            console.error('html2canvas error:', err);
            wrapper.innerHTML = '';
        });
    }, 300);
};
