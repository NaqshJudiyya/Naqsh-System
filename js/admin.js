/**
 * admin.js — لوحة المدير: قائمة الاستمارات، إدارة المستخدمين، التحليل التكاملي
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Admin = {};

var E = Naqsh.Utils.esc; // اختصار

/* ================================================================
   قائمة الاستمارات
   ================================================================ */
Naqsh.Admin.renderForms = async function() {
    var APP = Naqsh.APP;
    var snap = await db.collection('forms').orderBy('createdAt', 'desc').get();
    APP.forms = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    var c = document.getElementById('adminContent');
    if (!APP.forms.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px">' +
            '<i class="fa-solid fa-folder-open" style="font-size:48px;color:#d6d3d1;display:block;margin-bottom:16px"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px">لا توجد استمارات</h2>' +
            '<p style="color:var(--muted);margin-bottom:24px">ابدأ بإنشاء استمارتك الأولى</p>' +
            '<button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')">' +
            '<i class="fa-solid fa-plus"></i>إنشاء استمارة</button></div>';
        return;
    }

    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<h1 style="font-size:22px;font-weight:800">الاستمارات <span style="color:var(--muted);font-size:14px;font-weight:400">(' + APP.forms.length + ')</span></h1>' +
        '<button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')"><i class="fa-solid fa-plus"></i>جديدة</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">';

    APP.forms.forEach(function(f) {
        var qc = (f.questions || []).filter(function(q) { return q.type !== 'section_header'; }).length;
        var link = location.origin + location.pathname + '?form=' + f.id;
        var evalBadge = (f.evaluationRanges && f.evaluationRanges.length) ? '<span class="badge badge-blue" style="margin-right:4px"><i class="fa-solid fa-star" style="margin-left:2px"></i>تقييم</span>' : '';
        var statusBadge = f.published ? '<span class="badge badge-green">منشورة</span>' : '<span class="badge badge-amber">مسودة</span>';

        h += '<div class="card" style="cursor:default">' +
            '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">' + statusBadge + evalBadge +
            '<div style="display:flex;gap:4px">' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin.editForm(\'' + f.id + '\')" title="تعديل"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin._confirmDelete(\'' + f.id + '\')" title="حذف" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>' +
            '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px">' + E(f.title) + '</h3>' +
            '<p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6">' + E(f.description || '') + '</p>' +
            '<div style="display:flex;gap:16px;font-size:12px;color:var(--muted)">' +
            '<span><i class="fa-solid fa-list-check" style="margin-left:4px"></i>' + qc + ' سؤال</span>' +
            '<span><i class="fa-solid fa-users" style="margin-left:4px"></i>' + (f.responseCount || 0) + ' رد</span></div>';

        if (f.published) {
            h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">' +
                '<input class="input" value="' + link + '" readonly style="font-size:11px;padding:6px 10px;flex:1" onclick="this.select()">' +
                '<button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(\'' + link + '\');Naqsh.Utils.showToast(\'تم النسخ\',\'success\')"><i class="fa-solid fa-copy"></i></button></div>';
        }
        h += '</div>';
    });
    c.innerHTML = h + '</div></div>';
};

Naqsh.Admin.editForm = function(id) {
    var f = Naqsh.APP.forms.find(function(x) { return x.id === id; });
    if (!f) return;
    Naqsh.Builder.editingFormId = id;
    Naqsh.Builder.form = {
        title: f.title, description: f.description || '', published: f.published,
        assignedCounselors: f.assignedCounselors || [],
        evaluationRanges: f.evaluationRanges || [],
        postSubmissionMessage: f.postSubmissionMessage || ''
    };
    Naqsh.Builder.questions = JSON.parse(JSON.stringify(f.questions || []));
    Naqsh.Router.switchTab('admin', 'builder');
};

Naqsh.Admin._confirmDelete = function(id) {
    Naqsh.Utils.showModal(
        '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px">حذف الاستمارة؟</h3>' +
        '<p style="color:var(--muted);margin-bottom:24px">سيتم حذف جميع الردود المرتبطة أيضاً.</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn btn-outline" onclick="Naqsh.Utils.closeModal()">إلغاء</button>' +
        '<button class="btn btn-danger" onclick="Naqsh.Admin._doDelete(\'' + id + '\')">حذف</button></div>'
    );
};

Naqsh.Admin._doDelete = async function(id) {
    Naqsh.Utils.closeModal();
    var batch = db.batch();
    var resSnap = await db.collection('responses').where('formId', '==', id).get();
    resSnap.docs.forEach(function(d) { batch.delete(d.ref); });
    batch.delete(db.collection('forms').doc(id));
    await batch.commit();
    Naqsh.Utils.showToast('تم الحذف', 'success');
    Naqsh.Admin.renderForms();
};

/* ================================================================
   إدارة المستخدمين
   ================================================================ */
Naqsh.Admin.renderUsers = async function() {
    var snap = await db.collection('users').orderBy('role').get();
    Naqsh.APP.users = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    var c = document.getElementById('adminContent');
    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:24px">المستخدمون <span style="color:var(--muted);font-size:14px;font-weight:400">(' + Naqsh.APP.users.length + ')</span></h1>' +
        '<div class="card" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="border-bottom:2px solid var(--border);text-align:right">' +
        '<th style="padding:12px;font-weight:600">المستخدم</th>' +
        '<th style="padding:12px;font-weight:600">البريد</th>' +
        '<th style="padding:12px;font-weight:600">الدور</th>' +
        '<th style="padding:12px;font-weight:600">الإجراء</th></tr></thead><tbody>';

    Naqsh.APP.users.forEach(function(u) {
        var rb = u.role === 'admin' ? 'badge-red' : u.role === 'counselor' ? 'badge-blue' : 'badge-green';
        var rl = u.role === 'admin' ? 'مدير' : u.role === 'counselor' ? 'مستشار' : 'مستخدم';
        var avatar = u.photoURL
            ? '<img src="' + u.photoURL + '" style="width:28px;height:28px;border-radius:6px;object-fit:cover">'
            : '<i class="fa-solid fa-user" style="color:#d6d3d1"></i>';

        h += '<tr style="border-bottom:1px solid var(--border)">' +
            '<td style="padding:12px"><div style="display:flex;align-items:center;gap:8px">' + avatar +
            '<span style="font-weight:600">' + E(u.name || '—') + '</span></div></td>' +
            '<td style="padding:12px;color:var(--muted);direction:ltr;text-align:right">' + E(u.email) + '</td>' +
            '<td style="padding:12px"><span class="badge ' + rb + '">' + rl + '</span></td>' +
            '<td style="padding:12px">' +
            (u.role !== 'admin'
                ? '<select class="input select" style="width:auto;padding:6px 30px 6px 10px;font-size:12px" onchange="Naqsh.Admin._changeRole(\'' + u.id + '\',this.value)"><option value="responder"' + (u.role === 'responder' ? ' selected' : '') + '>مستخدم</option><option value="counselor"' + (u.role === 'counselor' ? ' selected' : '') + '>مستشار</option></select>'
                : '—') +
            '</td></tr>';
    });
    c.innerHTML = h + '</tbody></table></div></div>';
};

Naqsh.Admin._changeRole = async function(uid, role) {
    var update = { role: role };
    if (role === 'responder') update.assignedForms = firebase.firestore.FieldValue.delete();
    await db.collection('users').doc(uid).update(update);
    Naqsh.Utils.showToast('تم تغيير الدور', 'success');
    Naqsh.Admin.renderUsers();
};

/* ================================================================
   التحليل التكاملي
   ================================================================ */
Naqsh.Admin.renderCrossAnalysis = async function() {
    var c = document.getElementById('adminContent');
    if (!Naqsh.APP.forms.length) {
        var s = await db.collection('forms').get();
        Naqsh.APP.forms = s.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    }
    var pub = Naqsh.APP.forms.filter(function(f) { return f.published; });

    if (pub.length < 2) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-chart-line" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">التحليل التكاملي</h2>' +
            '<p>يحتاج استمراريتين منشورتين على الأقل</p></div>';
        return;
    }

    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:24px">تحليل تكاملي بين الاستمارات</h1>' +
        '<div class="card"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:10px">اختر الاستمارات للمقارنة</label>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px" id="crossFormSel">';
    pub.forEach(function(f) {
        h += '<label class="radio-opt" onclick="this.classList.toggle(\'selected\')"><input type="checkbox" value="' + f.id + '" style="display:none" class="crossChk">' + E(f.title) + '</label>';
    });
    h += '</div><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="Naqsh.Admin._runCross()"><i class="fa-solid fa-chart-column"></i>تحليل</button></div><div id="crossOut"></div></div>';
    c.innerHTML = h;
};

Naqsh.Admin._runCross = async function() {
    var chks = document.querySelectorAll('.crossChk:checked');
    if (chks.length < 2) { Naqsh.Utils.showToast('اختر اثنتين على الأقل', 'warning'); return; }
    var fids = Array.from(chks).map(function(c) { return c.value; });
    var out = document.getElementById('crossOut');
    out.innerHTML = '<div style="text-align:center;padding:40px"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--accent)"></i></div>';

    var data = {};
    for (var i = 0; i < fids.length; i++) {
        var fid = fids[i];
        var fs = await db.collection('forms').doc(fid).get();
        var rs = await db.collection('responses').where('formId', '==', fid).get();
        data[fid] = { form: fs.data(), responses: rs.docs.map(function(d) { return d.data(); }) };
    }

    var labels = fids.map(function(f) { return data[f].form.title; });
    var avgPts = fids.map(function(f) {
        var r = data[f].responses;
        if (!r.length) return 0;
        return (r.reduce(function(s, x) { return s + (x.totalPoints || 0); }, 0) / r.length).toFixed(1);
    });
    var counts = fids.map(function(f) { return data[f].responses.length; });

    Naqsh.Utils.destroyCharts();
    out.innerHTML = '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">مقارنة المتوسطات</h3><canvas id="xC1" height="200"></canvas></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">عدد الردود</h3><canvas id="xC2" height="200"></canvas></div>';

    Naqsh.Charts.bar('xC1', labels, avgPts, { barThickness: 50 });
    Naqsh.Charts.doughnut('xC2', labels, counts);
};