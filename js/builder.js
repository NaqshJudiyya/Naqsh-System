/**
 * builder.js — بناء الاستمارة مع نظام التقييم المخفي
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Builder = {
    form: null,
    questions: [],
    editingFormId: null
};

var E = Naqsh.Utils.esc;
var QT = QUESTION_TYPES;

Naqsh.Builder.init = function() {
    Naqsh.Builder.editingFormId = null;
    Naqsh.Builder.form = {
        title: '', description: '', published: false,
        assignedCounselors: [], evaluationRanges: [],
        postSubmissionMessage: ''
    };
    Naqsh.Builder.questions = [];
};

Naqsh.Builder.render = function() {
    var B = Naqsh.Builder;
    var isEdit = !!B.editingFormId;
    var c = document.getElementById('adminContent');

    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<h1 style="font-size:22px;font-weight:800">' + (isEdit ? 'تعديل' : 'بناء') + ' استمارة</h1>' +
        '<button class="btn btn-outline" onclick="Naqsh.Router.switchTab(\'admin\',\'forms\')"><i class="fa-solid fa-arrow-right"></i>رجوع</button></div>';

    // ===== بيانات أساسية =====
    h += '<div class="card" style="margin-bottom:20px">' +
        '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">عنوان الاستمارة</label>' +
        '<input class="input" id="bfTitle" value="' + E(B.form.title) + '" placeholder="مثال: مؤشر الصحة النفسية"></div>' +
        '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">وصف مختصر</label>' +
        '<textarea class="input" id="bfDesc" rows="2" placeholder="اختياري">' + E(B.form.description) + '</textarea></div>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
        '<div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">الحالة</label>' +
        '<label class="toggle"><input type="checkbox" id="bfPub" ' + (B.form.published ? 'checked' : '') + ' onchange="Naqsh.Builder.form.published=this.checked;this.nextElementSibling.nextElementSibling.textContent=this.checked?\'منشورة\':\'مسودة\'"><span class="slider"></span></label>' +
        '<span style="font-size:11px;color:var(--muted);margin-right:6px">' + (B.form.published ? 'منشورة' : 'مسودة') + '</span></div>' +
        '<div style="flex:1"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">تعيين لمستشارين</label><div id="bfCouns"></div></div></div></div>';

    // ===== نظام التقييم المخفي =====
    h += '<div class="range-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<i class="fa-solid fa-eye-slash" style="color:var(--accent)"></i>' +
        '<h3 style="font-size:15px;font-weight:700;color:#064e3b">نظام التقييم <span style="font-size:11px;font-weight:400;color:var(--muted)">(مخفي عن المستخدمين)</span></h3></div>' +
        '<div id="rangesList"></div>' +
        '<button class="btn btn-outline btn-sm" onclick="Naqsh.Builder._addRange()" style="margin-bottom:14px"><i class="fa-solid fa-plus"></i>إضافة مستوى تقييم</button>' +
        '<div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px">رسالة افتراضية بعد الإرسال</label>' +
        '<textarea class="input" id="bfPostMsg" rows="2" placeholder="شكراً لك..." oninput="Naqsh.Builder.form.postSubmissionMessage=this.value">' + E(B.form.postSubmissionMessage) + '</textarea></div></div>';

    // ===== الأسئلة =====
    h += '<div id="qsList"></div>';

    // ===== زر إضافة سؤال =====
    h += '<div style="text-align:center;margin:24px 0"><div style="position:relative;display:inline-block">' +
        '<button class="btn btn-primary" onclick="Naqsh.Builder._toggleAddQ()" style="padding:12px 28px;font-size:15px"><i class="fa-solid fa-plus"></i>إضافة سؤال</button>' +
        '<div id="addQMenu" style="display:none;position:absolute;top:100%;right:0;margin-top:8px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:220px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:50">';
    QT.forEach(function(t) {
        h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:background .15s" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'" onclick="Naqsh.Builder._addQuestion(\'' + t.id + '\')"><i class="fa-solid ' + t.icon + '" style="width:18px;color:var(--accent);text-align:center"></i>' + t.label + '</div>';
    });
    h += '</div></div></div>';

    // ===== أزرار الحفظ =====
    h += '<div style="display:flex;gap:12px;justify-content:center;padding:20px 0;border-top:1px solid var(--border)">' +
        '<button class="btn btn-outline" onclick="Naqsh.Builder._save(false)"><i class="fa-solid fa-floppy-disk"></i>حفظ مسودة</button>' +
        '<button class="btn btn-primary" onclick="Naqsh.Builder._save(true)" style="padding:12px 32px"><i class="fa-solid fa-paper-plane"></i>حفظ ونشر</button></div></div>';

    c.innerHTML = h;
    B._renderQs();
    B._renderRanges();
    B._renderCounselorAssign();
};

Naqsh.Builder._toggleAddQ = function() {
    var m = document.getElementById('addQMenu');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
};
document.addEventListener('click', function(e) {
    var m = document.getElementById('addQMenu');
    if (m && !e.target.closest('#addQMenu') && !e.target.closest('[onclick*="_toggleAddQ"]')) m.style.display = 'none';
});

Naqsh.Builder._addQuestion = function(type) {
    var q = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: type, text: '', required: false, options: [], pointsPerOption: []
    };
    if (['choice', 'checkbox', 'dropdown'].indexOf(type) >= 0) {
        q.options = ['خيار 1', 'خيار 2', 'خيار 3'];
        q.pointsPerOption = [0, 1, 2];
    }
    if (type === 'scale') {
        q.scaleMin = 0; q.scaleMax = 4;
        q.scaleMinLabel = 'لا يوجد مطلقاً'; q.scaleMaxLabel = 'شديد جداً';
    }
    if (type === 'matrix') {
        q.rows = [{ id: 'r1', text: 'صف 1' }, { id: 'r2', text: 'صف 2' }];
        q.columns = [
            { id: 'c0', text: 'لا يوجد', points: 0 },
            { id: 'c1', text: 'قليل', points: 1 },
            { id: 'c2', text: 'متوسط', points: 2 },
            { id: 'c3', text: 'كبير', points: 3 },
            { id: 'c4', text: 'شديد جداً', points: 4 }
        ];
    }
    Naqsh.Builder.questions.push(q);
    Naqsh.Builder._renderQs();
    setTimeout(function() {
        var el = document.getElementById('qc_' + q.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    document.getElementById('addQMenu').style.display = 'none';
};

Naqsh.Builder._renderQs = function() {
    var B = Naqsh.Builder;
    var c = document.getElementById('qsList');
    if (!c) return;
    if (!B.questions.length) {
        c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)"><i class="fa-solid fa-layer-group" style="font-size:32px;display:block;margin-bottom:10px;color:#d6d3d1"></i>لم تُضف أسئلة بعد</div>';
        return;
    }
    var h = '';
    B.questions.forEach(function(q, i) {
        var ti = QT.find(function(t) { return t.id === q.type; });
        h += '<div class="q-card fade-in" id="qc_' + q.id + '">' +
            '<div class="q-actions">' +
            (i > 0 ? '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder._moveQ(' + i + ',-1)"><i class="fa-solid fa-arrow-up"></i></button>' : '') +
            (i < B.questions.length - 1 ? '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder._moveQ(' + i + ',1)"><i class="fa-solid fa-arrow-down"></i></button>' : '') +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder._removeQ(' + i + ')" style="color:var(--danger)"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
            '<span style="background:var(--bg);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:var(--muted)">' + (i + 1) + '</span>' +
            '<span class="badge badge-blue"><i class="fa-solid ' + ti.icon + '" style="margin-left:4px"></i>' + ti.label + '</span>' +
            '<label style="margin-right:auto;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">إجباري' +
            '<label class="toggle" style="transform:scale(.7)"><input type="checkbox" ' + (q.required ? 'checked' : '') + ' onchange="Naqsh.Builder.questions[' + i + '].required=this.checked"><span class="slider"></span></label></label></div>' +
            '<input class="input" value="' + E(q.text) + '" placeholder="' + (q.type === 'section_header' ? 'عنوان القسم' : 'نص السؤال') + '" oninput="Naqsh.Builder.questions[' + i + '].text=this.value" style="margin-bottom:12px">' +
            B._renderQConfig(q, i) + '</div>';
    });
    c.innerHTML = h;
};

Naqsh.Builder._renderQConfig = function(q, i) {
    if (['choice', 'checkbox', 'dropdown'].indexOf(q.type) >= 0) {
        var h = '<div style="margin-top:8px"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:8px">الخيارات والنقاط</label>';
        q.options.forEach(function(o, oi) {
            h += '<div class="option-row"><span style="font-size:12px;color:var(--muted);min-width:20px">' + (oi + 1) + '.</span>' +
                '<input class="input" value="' + E(o) + '" style="flex:1" oninput="Naqsh.Builder.questions[' + i + '].options[' + oi + ']=this.value">' +
                '<span style="font-size:11px;color:var(--muted)">نقاط:</span>' +
                '<input class="points-input" type="number" value="' + (q.pointsPerOption[oi] || 0) + '" oninput="Naqsh.Builder.questions[' + i + '].pointsPerOption[' + oi + ']=Number(this.value)">' +
                '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder.questions[' + i + '].options.splice(' + oi + ',1);Naqsh.Builder.questions[' + i + '].pointsPerOption.splice(' + oi + ',1);Naqsh.Builder._renderQs()"><i class="fa-solid fa-xmark"></i></button></div>';
        });
        h += '<button class="btn btn-outline btn-sm" style="margin-top:6px" onclick="Naqsh.Builder.questions[' + i + '].options.push(\'خيار جديد\');Naqsh.Builder.questions[' + i + '].pointsPerOption.push(0);Naqsh.Builder._renderQs()"><i class="fa-solid fa-plus"></i>خيار</button></div>';
        return h;
    }
    if (q.type === 'scale') {
        return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">' +
            '<div><label style="font-size:11px;color:var(--muted)">من</label><input class="input" type="number" value="' + q.scaleMin + '" oninput="Naqsh.Builder.questions[' + i + '].scaleMin=Number(this.value)"></div>' +
            '<div><label style="font-size:11px;color:var(--muted)">إلى</label><input class="input" type="number" value="' + q.scaleMax + '" oninput="Naqsh.Builder.questions[' + i + '].scaleMax=Number(this.value)"></div>' +
            '<div><label style="font-size:11px;color:var(--muted)">نص "من"</label><input class="input" value="' + E(q.scaleMinLabel) + '" oninput="Naqsh.Builder.questions[' + i + '].scaleMinLabel=this.value"></div>' +
            '<div><label style="font-size:11px;color:var(--muted)">نص "إلى"</label><input class="input" value="' + E(q.scaleMaxLabel) + '" oninput="Naqsh.Builder.questions[' + i + '].scaleMaxLabel=this.value"></div></div>';
    }
    if (q.type === 'matrix') {
        var h = '<div style="margin-top:8px"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:8px">صفوف المصفوفة</label>';
        q.rows.forEach(function(r, ri) {
            h += '<div class="option-row"><input class="input" value="' + E(r.text) + '" style="flex:1" oninput="Naqsh.Builder.questions[' + i + '].rows[' + ri + '].text=this.value">' +
                '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder.questions[' + i + '].rows.splice(' + ri + ',1);Naqsh.Builder._renderQs()"><i class="fa-solid fa-xmark"></i></button></div>';
        });
        h += '<button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Naqsh.Builder.questions[' + i + '].rows.push({id:\'r_\'+Date.now(),text:\'صف جديد\'});Naqsh.Builder._renderQs()"><i class="fa-solid fa-plus"></i>صف</button>';
        h += '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:8px">الأعمدة والنقاط</label>';
        q.columns.forEach(function(col, ci) {
            h += '<div class="option-row"><input class="input" value="' + E(col.text) + '" style="flex:1" oninput="Naqsh.Builder.questions[' + i + '].columns[' + ci + '].text=this.value">' +
                '<span style="font-size:11px;color:var(--muted)">نقاط:</span>' +
                '<input class="points-input" type="number" value="' + col.points + '" oninput="Naqsh.Builder.questions[' + i + '].columns[' + ci + '].points=Number(this.value)">' +
                '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder.questions[' + i + '].columns.splice(' + ci + ',1);Naqsh.Builder._renderQs()"><i class="fa-solid fa-xmark"></i></button></div>';
        });
        h += '<button class="btn btn-outline btn-sm" onclick="Naqsh.Builder.questions[' + i + '].columns.push({id:\'c_\'+Date.now(),text:\'عمود جديد\',points:0});Naqsh.Builder._renderQs()"><i class="fa-solid fa-plus"></i>عمود</button></div>';
        return h;
    }
    return '';
};

Naqsh.Builder._moveQ = function(idx, dir) {
    var qs = Naqsh.Builder.questions;
    var n = idx + dir;
    if (n < 0 || n >= qs.length) return;
    var tmp = qs[idx]; qs[idx] = qs[n]; qs[n] = tmp;
    Naqsh.Builder._renderQs();
};
Naqsh.Builder._removeQ = function(idx) {
    Naqsh.Builder.questions.splice(idx, 1);
    Naqsh.Builder._renderQs();
};

/* --- نظام التقييم --- */
Naqsh.Builder._addRange = function() {
    Naqsh.Builder.form.evaluationRanges.push({ min: 0, max: 100, label: 'مستوى جديد', message: 'رسالة التوصية', color: '#0d7c66' });
    Naqsh.Builder._renderRanges();
};
Naqsh.Builder._renderRanges = function() {
    var c = document.getElementById('rangesList');
    if (!c) return;
    var ranges = Naqsh.Builder.form.evaluationRanges;
    if (!ranges.length) {
        c.innerHTML = '<p style="font-size:12px;color:var(--muted);margin-bottom:8px">لم تُضف مستويات. أضف مستوى لكل مدى نقاط.</p>';
        return;
    }
    var h = '';
    ranges.forEach(function(r, i) {
        h += '<div style="display:grid;grid-template-columns:60px 60px 1fr 80px 30px;gap:8px;align-items:center;margin-bottom:8px">' +
            '<input class="points-input" type="number" value="' + r.min + '" placeholder="من" oninput="Naqsh.Builder.form.evaluationRanges[' + i + '].min=Number(this.value)">' +
            '<input class="points-input" type="number" value="' + r.max + '" placeholder="إلى" oninput="Naqsh.Builder.form.evaluationRanges[' + i + '].max=Number(this.value)">' +
            '<input class="input" value="' + E(r.label) + '" placeholder="التسمية" style="padding:6px 10px;font-size:12px" oninput="Naqsh.Builder.form.evaluationRanges[' + i + '].label=this.value">' +
            '<input type="color" value="' + r.color + '" style="width:36px;height:36px;border:1px solid var(--border);border-radius:8px;cursor:pointer;padding:2px" oninput="Naqsh.Builder.form.evaluationRanges[' + i + '].color=this.value">' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Builder.form.evaluationRanges.splice(' + i + ',1);Naqsh.Builder._renderRanges()" style="color:var(--danger)"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<div style="margin-bottom:12px;margin-right:136px"><textarea class="input" rows="1" placeholder="رسالة التوصية" style="font-size:12px;padding:6px 10px" oninput="Naqsh.Builder.form.evaluationRanges[' + i + '].message=this.value">' + E(r.message) + '</textarea></div>';
    });
    c.innerHTML = h;
};

Naqsh.Builder._renderCounselorAssign = async function() {
    var c = document.getElementById('bfCouns');
    if (!c) return;
    var snap = await db.collection('users').where('role', '==', 'counselor').get();
    var cs = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var asgn = Naqsh.Builder.form.assignedCounselors || [];
    if (!cs.length) { c.innerHTML = '<span style="font-size:11px;color:var(--muted)">لا يوجد مستشارين</span>'; return; }
    c.innerHTML = cs.map(function(x) {
        return '<label class="radio-opt ' + (asgn.indexOf(x.id) >= 0 ? 'selected' : '') + '" style="font-size:11px;margin-left:4px" onclick="this.classList.toggle(\'selected\');Naqsh.Builder._toggleCounselor(\'' + x.id + '\')">' + E(x.name || x.email) + '</label>';
    }).join('');
};
Naqsh.Builder._toggleCounselor = function(uid) {
    var a = Naqsh.Builder.form.assignedCounselors || [];
    var idx = a.indexOf(uid);
    if (idx >= 0) a.splice(idx, 1); else a.push(uid);
    Naqsh.Builder.form.assignedCounselors = a;
};

Naqsh.Builder._save = async function(publish) {
    var B = Naqsh.Builder;
    var title = document.getElementById('bfTitle').value.trim();
    var desc = document.getElementById('bfDesc').value.trim();
    if (!title) { Naqsh.Utils.showToast('أدخل عنوان الاستمارة', 'warning'); return; }
    if (!B.questions.length) { Naqsh.Utils.showToast('أضف سؤالاً واحداً على الأقل', 'warning'); return; }
    B.form.title = title;
    B.form.description = desc;
    if (publish) B.form.published = true;
    B.form.questions = B.questions;
    B.form.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    if (!B.form.createdAt) B.form.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    try {
        if (B.editingFormId) {
            await db.collection('forms').doc(B.editingFormId).update(B.form);
        } else {
            B.form.responseCount = 0;
            await db.collection('forms').add(B.form);
        }
        Naqsh.Utils.showToast(publish ? 'تم النشر' : 'تم الحفظ', 'success');
        B.editingFormId = null;
        Naqsh.Router.switchTab('admin', 'forms');
    } catch (e) {
        Naqsh.Utils.showToast('خطأ: ' + e.message);
    }
};