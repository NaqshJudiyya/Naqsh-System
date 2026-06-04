/**
 * utils.js — مساعدات عامة: تحويل نص، توست، مودال
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Utils = {

    /**
     * تحويل النص لمنع XSS
     */
    esc: function(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    },

    /**
     * إظهار رسالة توست
     * @param {string} msg - نص الرسالة
     * @param {string} type - error | success | warning
     */
    showToast: function(msg, type) {
        type = type || 'error';
        var el = document.getElementById('toast');
        el.textContent = msg;
        el.className = 'toast ' + type + ' show';
        clearTimeout(el._timer);
        el._timer = setTimeout(function() {
            el.classList.remove('show');
        }, 4000);
    },

    /**
     * إظهار مودال
     */
    showModal: function(html) {
        document.getElementById('modalBox').innerHTML = html;
        document.getElementById('modal').classList.add('show');
    },

    /**
     * إغلاق المودال
     */
    closeModal: function() {
        document.getElementById('modal').classList.remove('show');
    },

    /**
     * تدمير جميع الرسوم البيانية السابقة
     */
    destroyCharts: function() {
        var charts = Naqsh.APP.chartInstances;
        for (var i = 0; i < charts.length; i++) {
            try { charts[i].destroy(); } catch(e) {}
        }
        Naqsh.APP.chartInstances = [];
    }
};