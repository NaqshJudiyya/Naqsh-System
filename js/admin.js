/**
 * admin.js — لوحة المدير: استمارات + إدارة المستخدمين + تحليل تكاملي
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Admin = {};
var E = Naqsh.Utils.esc;

/* ================================================================
   قائمة الاستمارات (بدون تغيير من النسخة السابقة)
   ================================================================ */
Naqsh.Admin.renderForms = async function() {
    var APP = Naqsh.APP;
    if (!APP.forms.length) {
        var s = await db.collection('forms').orderBy('createdAt', 'desc').get();
        APP.forms = s.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    }
    var c = document.getElementById('adminContent');
    if (!APP.forms.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px"><i class="fa-solid fa-folder-open" style="font-size:48px;color:#d6d3d1;display:block;margin-bottom:16px"></i><h2 style="font-size:20px;font-weight:700;margin-bottom:8px">لا توجد استمارات</h2><p style="color:var(--muted);margin-bottom:24px">ابدأ بإنشاء استمارتك الأولى</p><button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')"><i class="fa-solid fa-plus"></i>إنشاء استمارة</button></div>';
        return;
    }
    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<h1 style="font-size:22px;font-weight:800">الاستمارات <span style="color:var(--muted);font-size:14px;font-weight:400">(' + APP.forms.length + ')</span></h1>' +
        '<button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')"><i class="fa-solid fa-plus"></i>جديدة</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr);gap:16px">';

    APP.forms.forEach(function(f) {
        var qc = (f.questions || []).filter(function(q) { return q.type !== 'section_header'; }).length;
        var link = location.origin + location.pathname + '?form=' + f.id;
        var evalBadge = (f.evaluationRanges && f.evaluationRanges.length) ? '<span class="badge badge-blue" style="margin-right:4px"><i class="fa-solid fa-star" style="margin-left:2px"></i>تقييم</span>' : '';
        var statusBadge = f.published ? '<span class="badge badge-green">منشورة</span>' : '<span class="badge badge-amber">مسودة</span>';

        h += '<div class="card" style="cursor:default"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">' + statusBadge + evalBadge +
            '<div style="display:flex;gap:4px">' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin.editForm(\'' + f.id + '\')" title="تعديل"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin._confirmDelete(\'' + f.id + '\')" title="حذف" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button></div></div>' +
            '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px">' + E(f.title) + '</h3>' +
            '<p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6">' + E(f.description || '') + '</p>' +
            '<div style="display:flex;gap:16px;font-size:12px;color:var(--muted)"><span><i class="fa-solid fa-list-check" style="margin-left:4px"></i>' + qc + ' سؤال</span><span><i class="fa-solid fa-users" style="margin-left:4px"></i>' + (f.responseCount || 0) + ' رد</span></div>';

        if (f.published) {
            h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">' +
                '<input class="input" value="' + link + '" readonly style="font-size:11px;padding:6px 10px;flex:1" onclick="this.select()">' +
                '<button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(\'' + link + '\');Naqsh.Utils.showToast(\'تم النسخ\',\'success\')"><i class="fa-solid fa-copy"></i></button></div>';
        }
        h += '</div>';
    });
    c.innerHTML = h + '</div>';
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
        '<button class="btn btn-danger" onclick="Naqsh.Admin._doDelete(\'' + id + '\')">حذف نهائي</button></div>'
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
   إدارة المستخدمين — كامل مع إنشاء مستخدم + كلمة مرور مخفية + تعديل بيانات
   ================================================================ */
Naqsh.Admin.renderUsers = async function() {
    var c = document.getElementById('adminContent');

    var userSnap = await db.collection('users').get();
    var users = userSnap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var allResponses = await db.collection('responses').get();
    var respStats = {};
    allResponses.docs.forEach(function(d) {
        var r = d.data();
        var uid = r.respondentUid;
        if (uid) {
            if (!respStats[uid]) respStats[uid] = { count: 0, forms: {} };
            respStats[uid].count++;
            var fid = r.formId;
            if (!respStats[uid].forms[fid]) respStats[uid].forms[fid] = (respStats[uid].forms[fid] || 0) + 1;
        }
    });
    Naqsh.APP.users = users;

    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<h1 style="font-size:22px;font-weight:800">إدارة المستخدمين <span style="color:var(--muted);font-size:14px;font-weight:400">(' + users.length + ')</span></h1>' +
        '<button class="btn btn-primary" onclick="Naqsh.Admin._showAddUserSection()"> <i class="fa-solid fa-user-plus"></i>إضافة مستخدم</button></div>';

    if (!users.length) {
        h += '<div style="text-align:center;padding:40px;color:var(--muted)">لا يوجد مستخدمين بعد</div>';
    } else {
        h += '<div class="card" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
            '<thead><tr style="border-bottom:2px solid var(--border);text-align:right;background:var(--bg)">' +
            '<th style="padding:10px;font-weight:700">المستخدم</th>' +
            '<th style="padding:10px;font-weight:700">البريد</th>' +
            '<th style="padding:10px;font-weight:700">الدور</th>' +
            '<th style="padding:10px;font-weight:700">الاستمارات</th>' +
            '<th style="padding:10px;font-weight:700">كلمة المرور</th>' +
            '<th style="padding:10px;font-weight:700">الإجراءات</th></tr></thead><tbody>';

        users.forEach(function(u) {
            var rb = u.role === 'admin' ? 'badge-red' : u.role === 'counselor' ? 'badge-blue' : 'badge-green';
            var rl = u.role === 'admin' ? 'مدير' : u.role === 'counselor' ? 'مستشار' : 'مستخدم';
            var avatar = u.photoURL
                ? '<img src="' + u.photoURL + '" style="width:30px;height:30px;border-radius:8px;object-fit:cover">'
                : '<i class="fa-solid fa-user" style="color:#d6d3d1"></i>';

            // عدد الاستمارات
            var formInfo = '';
            if (u.role === 'responder') {
                var st = respStats[u.id];
                formInfo = st ? st.count + ' استمارة' : '0 استمارة';
            } else if (u.role === 'counselor') {
                formInfo = (u.assignedForms || []).length + ' مخصصة';
            } else {
                formInfo = '—';
            }

            var passId = 'pass_' + u.id;
            h += '<tr style="border-bottom:1px solid var(--border)">' +
                '<td style="padding:10px"><div style="display:flex;align-items:center;gap:8px">' + avatar +
                '<span style="font-weight:600">' + E(u.name || '—') + '</span></div></td>' +
                '<td style="padding:10px;color:var(--muted);direction:ltr;text-align:right">' + E(u.email || '—') + '</td>' +
                '<td style="padding:10px;text-align:center"><span class="badge ' + rb + '">' + rl + '</span></td>' +
                '<td style="padding:10px;text-align:center">' + formInfo + '</td>' +
                '<td style="padding:10px;text-align:center">' +
                (u.isAnonymous ? '<span style="font-size:11px;color:var(--muted)">زائر</span>' :
                    '<button class="btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="Naqsh.Admin._togglePass(\'' + u.id + '\',this)" title="إظهار/إخفاء كلمة المرور"><i class="fa-solid fa-eye"></i>إظهار</button>') +
                '</td>' +
                '<td style="padding:10px;display:flex;gap:4px;justify-content:center">' +
                '<select class="input select" style="width:auto;padding:4px 28px 4px 10px;font-size:12px" onchange="Naqsh.Admin._changeRole(\'' + u.id + '\',this.value)">' +
                    '<option value="responder"' + (u.role === 'responder' ? ' selected' : '') + '>مستخدم</option>' +
                    '<option value="counselor"' + (u.role === 'counselor' ? ' selected' : '') + '>مستشار</option>' +
                    '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>مدير</option></select>' +
                '</select>' +
                '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin._showEditModal(\'' + u.id + '\')" title="تعديل البيانات"><i class="fa-solid fa-pen-to-square"></i></button>' +
                (u.role !== 'admin' ? '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin._confirmDeleteUser(\'' + u.id + '\')" title="حذف" style="color:var(--danger)"><i class="fa-solid fa-user-minus"></i></button>' : '') +
                '</td></tr>';
        });
        h += '</tbody></table></div></div>';

    // قسم إضافة مستخدم
    h += '<div class="card" id="addUserSection" style="border:2px dashed var(--accent);background:#f0fdf9;margin-top:20px;display:none">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<h3 style="font-size:16px;font-weight:700;color:#064e3b"><i class="fa-solid fa-user-plus" style="margin-left:8px;color:var(--accent)"></i>إضافة مستخدم جديد</h3>' +
        '<button class="btn-ghost btn-sm" onclick="document.getElementById(\'addUserSection\').style.display=document.getElementById(\'addUserSection\').style.display===\'none\'"> </button></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
        '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">الاسم الكامل <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="newUserName" placeholder="الاسم الكامل"></div>' +
        '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">البريد الإلكتروني <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="newUserEmail" type="email" placeholder="example@mail.com" dir="ltr" style="text-align:right"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
        '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">كلمة المرور <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="newUserPass" type="password" placeholder="6 أحرف على الأقل" autocomplete="new-password"></div>' +
        '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">الدور</label>' +
        '<select class="input select" id="newUserRole"><option value="responder" selected>مستخدم عادي</option><option value="counselor">مستشار</option><option value="admin">مدير</option></select></div></div>' +
        '<button class="btn btn-primary btn-full" style="padding:14px;font-size:15px;margin-bottom:10px" onclick="Naqsh.Admin._createUser()"><i class="fa-solid fa-user-plus"></i>إنشاء الحساب</button></div></div></div>';

    c.innerHTML = h;
};

Naqsh.Admin._showAddUserSection = function() {
    var el = document.getElementById('addUserSection');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (el.style.display === 'block') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

Naqsh.Admin._createUser = async function() {
    var name = document.getElementById('newUserName').value.trim();
    var email = document.getElementById('newUserEmail').value.trim();
    var pass = document.getElementById('newUserPass').value;
    var role = document.getElementById('newUserRole').value;

    if (!name) { Naqsh.Utils.showToast('أدخل الاسم', 'warning'); document.getElementById('newUserName').focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Naqsh.Utils.showToast('بريد غير صحيح', 'warning'); document.getElementById('newUserEmail').focus(); return; }
    if (pass.length < 6) { Naqsh.Utils.showToast('كلمة المرور قصيرة جداً', 'warning'); document.getElementById('newUserPass').focus(); return; }

    var btn = document.querySelector('#addUserSection .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإنشاء...';

    try {
        var result = await auth.createUserWithEmailAndPassword(email, pass);
        var uid = result.user.uid;
        await db.collection('users').doc(uid).set({
            name: name, email: email, role: role,
            assignedForms: [], photoURL: '', isAnonymous: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        Naqsh.Utils.showToast('تم إنشاء الحساب بنجاح', 'success');
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPass'.value = '';
        document.getElementById('addUserSection').style.display = 'none';
        Naqsh.Admin.renderUsers();
    } catch (err) {
        console.error('Create user error:', err);
        var msg = 'فشل الإنشاء: ';
        if (err.code === 'auth/email-already-in-use') msg += 'البريد مستخدم من قبل';
        else if (err.code === 'auth/weak-password') msg += 'كلمة المرور ضعيفة';
        else msg += err.message;
        Naqsh.Utils.showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i>إنشاء الحساب';
    }
};

Naqsh.Admin._changeRole = async function(uid, role) {
    var update = { role: role };
    if (role === 'responder') update.assignedForms = firebase.firestore.FieldValue.delete();
    await db.collection('users').doc(uid).update(update);
    Naqsh.Utils.showToast('تم تغيير الدور', 'success');
    Naqsh.Admin.renderUsers();
};

Naqsh.Admin._togglePass = function(uid, btn) {
    var next = btn.nextElementSibling;
    if (next && next.style.display === 'none') {
        next.style.display = 'inline';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> إظهار';
    } else {
        next.style.display = 'none';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i> إخفاء';
    }
};

Naqsh.Admin._showEditModal = function(uid) {
    var u = Naqsh.APP.users.find(function(x) { return x.id === uid; });
    if (!u) return;
    Naqsh.Utils.showModal(
        '<h3 style="تعديل بيانات المستخدم</h3>' +
        '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">الاسم</label>' +
        '<input class="input" id="editUserName" value="' + E(u.name || '') + '"></div>' +
        '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">البريد الإلكتروني</label>' +
        '<input class="input" id="editUserEmail" type="email" value="' + E(u.email || '') + '" dir="ltr" style="text-align:right"></div>' +
        '<div style="margin-bottom:14px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">كلمة المرور الجديدة (اتركها فارغة إن لم تُعدلها)</label>' +
        '<input class="input" id="editUserPass" type="password" placeholder="اتركه فارغاً إن لم تُعدّله" autocomplete="off"></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn btn-outline" onclick="Naqsh.Utils.closeModal()">إلغاء</button>' +
        '<button class="btn btn-primary" onclick="Naqsh.Admin._saveEdit(\'' + uid + '\')" style="background:#064e3b"><i class="fa-solid fa-check"></i>حفظ التعديلات</button></div>'
    );
};

Naqsh.Admin._saveEdit = async function(uid) {
    var name = document.getElementById('editUserName').value.trim();
    var email = document.getElementById('editUserEmail').value.trim();
    var pass = document.getElementById('editUserPass').value;
    var update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (pass) {
        Naqsh.Utils.showToast('تم تحديث البيانات. لتغيير كلمة المرور، استخدم Firebase Console → Authentication → Users → اختر المستخدم → Edit password', 'warning');
    }
    try {
        if (Object.keys(update).length > 0) {
            await db.collection('users').doc(uid).update(update);
        }
        Naqsh.Utils.showToast('تم الحفظ', 'success');
        Naqsh.Utils.closeModal();
        Naqsh.Admin.renderUsers();
    } catch (err) {
        Naqsh.Utils.showToast('خطأ: ' + err.message, 'error');
    }
};

Naqsh.Admin._confirmDeleteUser = function(uid) {
    Naqsh.Utils.showModal(
        '<h3 style="حذف هذا المستخدم؟</h3>' +
        '<p style="color:var(--muted);margin-bottom:8px">سيُحذف من نظام التطبيق (لا يُحذف من Firebase Auth).</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn btn-outline" onclick="Naqsh.Utils.closeModal()">إلغاء</button>' +
        '<button class="btn btn-danger" onclick="Naqsh.Admin._doDeleteUser(\'' + uid + '\')">حذف نهائي</button></div>'
    );
};

Naqsh.Admin._doDeleteUser = async function(uid) {
    Naqsh.Utils.closeModal();
    await db.collection('users').doc(uid).delete();
    Naqsh.Utils.showToast('تم حذف المستخدم من النظام', 'success');
    Naqsh.Admin.renderUsers();
};

/* ================================================================
   التحليل التكاملي (بدون تغيير من النسخة السابقة)
   ================================================================ */
Naqsh.Admin.renderCrossAnalysis = async function() {
    var c = document.getElementById('adminContent');
    if (!Naqsh.APP.forms.length) {
        var s = await db.collection('forms').get();
        Naqsh.APP.forms = s.docs.map(function(d) { return Object.assign({ id: d.id }, d.data(); });
    }
    var pub = Naqsh.APP.forms.filter(function(f) { return f.published; });
    if (pub.length < 2) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)"><i class="fa-solid fa-chart-line" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i><h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">التحليل التكاملي</h2><p>يحتاج استمراريتين على الأقل</p></div>';
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
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">عدد الردود</h3><canvas id="xC2" height="200"></canvas></div></div>';

    Naqsh.Charts.bar('xC1', labels, avgPts, { barThickness: 50 });
    Naqsh.Charts.doughnut('xC2', labels, counts);
};

/* نهاية قائمة الاستمارات بدون تغيير من النسخة السابقة */
Naqsh.Admin.renderForms = async function() {
    var APP = Naqsh.APP;
    if (!APP.forms.length) {
        var s = await db.collection('forms').orderBy('createdAt', 'desc').get();
        APP.forms = s.docs.map(function(d) { return Object.assign({ id: d.id }, d.data(); });
    }
    var c = document.getElementById('adminContent');
    if (!APP.forms.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px"><i class="fa-solid fa-folder-open" style="font-size:48px;color:#d6d3d1;display:block;margin-bottom:16px"></i><h2 style="font-size:20px;font-weight:700;margin-bottom:8px">لا توجد استمارات</h2><p style="color:var(--muted);margin-bottom:24px">ابدأ بإنشاء استمارتك الأولى</p><button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')"><i class="fa-solid fa-plus"></i>إنشاء استمارة</button></div>';
        return;
    }

    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<h1 style="font-size:22px;font-weight:800">الاستمارات <span style="color:var(--muted);font-size:14px;font-weight:400">(' + APP.forms.length + ')</span></h1>' +
        '<button class="btn btn-primary" onclick="Naqsh.Builder.init();Naqsh.Router.switchTab(\'admin\',\'builder\')"><i class="fa-solid fa-plus"></i>جديدة</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr);gap:16px">';

    APP.forms.forEach(function(f) {
        var qc = (f.questions || []).filter(function(q) { return q.type !== 'section_header'; }).length;
        var link = location.origin + location.pathname + '?form=' + f.id;
        var evalBadge = (f.evaluationRanges && f.evaluationRanges.length) ? '<span class="badge badge-blue" style="margin-right:4px"><i class="fa-solid fa-star" style="margin-left:2px"></i>تقييم</span>' : '';
        var statusBadge = f.published ? '<span class="badge badge-green">منشورة</span>' : '<span class="badge badge-amber">مسودة</span>';

        h += '<div class="card" style="cursor:default"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">' + statusBadge + evalBadge +
            '<div style="display:flex;gap:4px">' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin.editForm(\'' + f.id + '\')" title="تعديل"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-ghost btn-sm" onclick="Naqsh.Admin._confirmDelete(\'' + f.id + '\')" title="حذف" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button></div></div>' +
            '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px">' + E(f.title) + '</h3>' +
            '<p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6">' + E(f.description || '') + '</p>' +
            '<div style="display:flex;gap:16px;font-size:12px;color:var(--muted)"><span><i class="fa-solid fa-list-check" style="margin-left:4px"></i>' + qc + ' سؤال</span><span><i class="fa-solid fa-users" style="margin-left:4px"></i>' + (f.responseCount || 0) + ' رد</span></div>';

        if (f.published) {
            h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">' +
                '<input class="input" value="' + link + '" readonly style="font-size:11px;padding:6px 10px;flex:1" onclick="this.select()">' +
                '<button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(\'' + link + '\');Naqsh.Utils.showToast(\'تم النسخ\',\'success\')"><i class="fa-solid fa-copy"></i></button></div>';
        }
        h += '</div></div>';
    });
    c.innerHTML = h + '</div>';
};

/* نهاية قائمة الاستمارات بدون تغيير */
Naqsh.Admin._confirmDelete = function(id) {
    Naqsh.Utils.showModal(
        '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px">حذف الاستمارة؟</h3>' +
        '<p style="color:var(--muted);margin-bottom:24px">سيتم حذف جميع الردود المرتبطة أيضاً.</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn btn-outline" onclick="Naqsh.Utils.closeModal()">إلغاء</button>' +
        '<button class="btn btn-danger" onclick="Naqsh.Admin._doDelete(\'' + id + '\')">حذف نهائي</button></div>'
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
