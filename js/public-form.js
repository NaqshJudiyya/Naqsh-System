/**
 * public-form.js — واجهة الملء + بواب تسجيل/تسجيل دخول + إرسال يعمل
 */

window.Naqsh = window.Naqsh || {};
Naqsh.PublicForm = {};
var E = Naqsh.Utils.esc;

Naqsh.PublicForm.load = async function() {
    var c = document.getElementById('publicContent');
    c.innerHTML = '<div style="text-align:center;padding:80px"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--accent)"></i></div>';
    try {
        var d = await db.collection('forms').doc(Naqsh.APP.publicFormId).get();
        if (!d.exists) {
            c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--muted)"><i class="fa-solid fa-circle-exclamation" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i><h2>الاستمارة غير موجودة</h2></div>';
            return;
        }
        // ⬇️ التعديل هنا: دمج الـ ID مع البيانات
        var form = Object.assign({ id: d.id }, d.data());
        
        if (!form.published) {
            c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--muted)"><i class="fa-solid fa-lock" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i><h2>غير متاحة حالياً</h2></div>';
            return;
        }
        var user = Naqsh.APP.user;
        if (user && !user.isAnonymous) {
            Naqsh.PublicForm._renderForm(form);
        } else {
            Naqsh.PublicForm._showAuthGate(form);
        }
    } catch (err) {
        c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--danger)"><i class="fa-solid fa-triangle-exclamation" style="font-size:48px;display:block;margin-bottom:16px"></i><h2>خطأ</h2><p style="font-size:13px;margin-top:8px;color:var(--muted)">' + E(err.message) + '</p></div>';
    }
};

Naqsh.PublicForm._showAuthGate = function(form) {
    var c = document.getElementById('publicContent');
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('naqsh_visitor')); } catch(e) {}
    if (saved && (Date.now() - saved.ts > 30 * 24 * 60 * 60 * 1000)) saved = null;

    var h = '<div class="fade-in">' +
        '<div class="card" style="max-width:460px;margin:40px auto;border-right:4px solid var(--accent)">' +
        '<div style="text-align:center;margin-bottom:24px">' +
        '<div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px;color:#fff;box-shadow:0 4px 16px rgba(13,124,102,.3)"><i class="fa-solid fa-clipboard-list"></i></div>' +
        '<h1 style="font-size:20px;font-weight:900;margin-bottom:4px">' + E(form.title) + '</h1>' +
        '<p style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:0">' + E(form.description || '') + '</p></div>' +
        '<div style="background:var(--bg);border-radius:12px;padding:20px;margin-bottom:20px">' +
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px">' +
        '<i class="fa-solid fa-user-shield" style="color:var(--accent)"></i>تسجيل الدخول أو إنشاء حساب جديد</h3>' +
        '<p style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.7">بياناتك محفوظة بخصوصية تامة ولن تُستخدم إلا لعرض سجلك الشخصي.</p>' +
        '<div style="margin-bottom:10px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">الاسم الكامل <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="gateName" type="text" placeholder="مثال: أحمد محمد" value="' + E(saved ? saved.name : '') + '"></div>' +
        '<div style="margin-bottom:10px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">البريد الإلكتروني <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="gateEmail" type="email" placeholder="example@mail.com" value="' + E(saved ? saved.email : '') + '" dir="ltr" style="text-align:right"></div>' +
        '<div style="margin-bottom:16px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:5px">كلمة المرور <span style="color:var(--danger)">*</span></label>' +
        '<input class="input" id="gatePass" type="password" placeholder="6 أحرف على الأقل" autocomplete="new-password"></div>' +
        '<div id="gateError" style="display:none;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#dc2626"></div>' +
        '<button class="btn btn-primary btn-full" style="padding:14px;font-size:15px;margin-bottom:10px" id="gateBtn" onclick="Naqsh.PublicForm._handleAuth()">' +
        '<i class="fa-solid fa-arrow-left"></i>متابعة وملء الاستمارة</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;justify-content:center;font-size:11px;color:var(--muted)"><i class="fa-solid fa-lock" style="font-size:10px"></i>بياناتك محمية ولا تُشارك مع أي طرف</div>' +
        '</div></div>';
    c.innerHTML = h;
};

Naqsh.PublicForm._handleAuth = async function() {
    var name = document.getElementById('gateName').value.trim();
    var email = document.getElementById('gateEmail').value.trim();
    var pass = document.getElementById('gatePass').value;
    var errEl = document.getElementById('gateError');
    errEl.style.display = 'none';

    if (!name) { errEl.textContent = 'أدخل اسمك'; errEl.style.display = 'block'; document.getElementById('gateName').focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'أدخل بريد إلكتروني صحيح'; errEl.style.display = 'block'; document.getElementById('gateEmail').focus(); return; }
    if (pass.length < 6) { errEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; document.getElementById('gatePass').focus(); return; }

    var btn = document.getElementById('gateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التحقق...';

    try {
        try {
            var result = await auth.signInWithEmailAndPassword(email, pass);
            var uid = result.user.uid;
            var doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                await db.collection('users').doc(uid).update({ name: name });
            } else {
                await db.collection('users').doc(uid).set({
                    name: name, email: email, role: 'responder',
                    assignedForms: [], photoURL: '', isAnonymous: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            Naqsh.APP.user = result.user;
            Naqsh.APP.userData = Object.assign({}, doc.exists ? doc.data() : {}, { name: name, email: email, role: 'responder', isAnonymous: false });
            localStorage.setItem('naqsh_visitor', JSON.stringify({ uid: uid, name: name, email: email, ts: Date.now() }));
            Naqsh.PublicForm._renderForm((await db.collection('forms').doc(Naqsh.APP.publicFormId).get()).data());
        } catch (signInErr) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
                try {
                    var result = await auth.createUserWithEmailAndPassword(email, pass);
                    var uid = result.user.uid;
                    await db.collection('users').doc(uid).set({
                        name: name, email: email, role: 'responder',
                        assignedForms: [], photoURL: '', isAnonymous: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    Naqsh.APP.user = result.user;
                    Naqsh.APP.userData = { name: name, email: email, role: 'responder', isAnonymous: false };
                    localStorage.setItem('naqsh_visitor', JSON.stringify({ uid: uid, name: name, email: email, ts: Date.now() }));
                    Naqsh.PublicForm._renderForm((await db.collection('forms').doc(Naqsh.APP.publicFormId).get()).data());
                } catch (createErr) {
                    errEl.textContent = 'فشل الإنشاء: ' + (createErr.message || 'تأكد من تفعيل Email/Password في Firebase Console');
                    errEl.style.display = 'block';
                }
            } else {
                errEl.textContent = 'خطأ: ' + signInErr.message;
                errEl.style.display = 'block';
            }
        }
    } catch (err) {
        errEl.textContent = 'حدث خطأ غير متوقع';
        errEl.style.display = 'block';
        console.error('Auth gate error:', err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>متابعة وملء الاستمارة';
    }
};

Naqsh.PublicForm._renderForm = function(form) {
    var c = document.getElementById('publicContent');
    var qs = form.questions || [];
    window._pubData = { formId: form.id, questions: qs };
    window._pubSel = {};
    window._pubChk = {};

    var userGreeting = '';
    if (Naqsh.APP.user && !Naqsh.APP.user.isAnonymous) {
        userGreeting = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 16px;background:var(--accent-light,#d1fae5);border-radius:10px">' +
            (Naqsh.APP.userData.photoURL ? '<img src="' + Naqsh.APP.userData.photoURL + '" style="width:32px;height:32px;border-radius:8px;object-fit:cover">' :
            '<i class="fa-solid fa-user-check" style="color:var(--accent);font-size:16px"></i>') +
            '<span style="font-size:13px;font-weight:600;color:#064e3b">مرحباً، ' + E(Naqsh.APP.userData.name || '') + '</span></div>';
    } else if (Naqsh.APP.user && Naqsh.APP.user.isAnonymous) {
        userGreeting = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 16px;background:var(--bg);border-radius:10px">' +
            '<i class="fa-solid fa-user" style="color:var(--muted);font-size:16px"></i>' +
            '<span style="font-size:13px;font-weight:600">' + E(Naqsh.APP.userData.name || '') + '</span></div>';
    }

    var h = '<div class="fade-in">' +
        '<div style="position:fixed;top:0;left:0;right:0;height:4px;background:var(--border);z-index:1000">' +
        '<div id="pubProg" style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));width:0%;transition:width .4s;border-radius:0 2px 2px 0"></div></div>' +
        '<div class="card" style="margin-bottom:24px;border-right:4px solid var(--accent)">' +
        '<h1 style="font-size:22px;font-weight:900;margin-bottom:8px">' + E(form.title) + '</h1>' +
        '<p style="font-size:14px;color:var(--muted);line-height:1.8">' + E(form.description || '') + '</p></div>' +
        userGreeting;

    qs.forEach(function(q, qi) {
        if (q.type === 'section_header') {
            h += '<div style="margin:28px 0 16px;padding:12px 16px;background:linear-gradient(90deg,var(--accent),transparent);border-radius:10px"><h2 style="font-size:17px;font-weight:800;color:#fff">' + E(q.text) + '</h2></div>';
            return;
        }
        var req = q.required ? '<span style="color:var(--danger);margin-right:4px">*</span>' : '';
        h += '<div class="card" id="pq' + qi + '"><label style="font-size:15px;font-weight:600;display:block;margin-bottom:14px">' + req + E(q.text) + '</label>';

        if (['short_text', 'email', 'number'].indexOf(q.type) >= 0) {
            var itype = q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text';
            var autoVal = '';
            if (q.type === 'email' && Naqsh.APP.userData && Naqsh.APP.userData.email) autoVal = ' value="' + E(Naqsh.APP.userData.email) + '" readonly';
            h += '<input class="input" type="' + itype + '" data-qi="' + qi + '" oninput="Naqsh.PublicForm._updateProg()"' + autoVal + '>';
        } else if (q.type === 'paragraph') {
            h += '<textarea class="input" rows="3" data-qi="' + qi + '" oninput="Naqsh.PublicForm._updateProg()"></textarea>';
        } else if (q.type === 'date') {
            h += '<input class="input" type="date" data-qi="' + qi + '" onchange="Naqsh.PublicForm._updateProg()">';
        } else if (q.type === 'time') {
            h += '<input class="input" type="time" data-qi="' + qi + '" onchange="Naqsh.PublicForm._updateProg()">';
        } else if (q.type === 'choice') {
            h += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
            (q.options || []).forEach(function(o, oi) {
                h += '<label class="radio-opt" onclick="Naqsh.PublicForm._selRadio(this,' + qi + ',\'' + E(o).replace(/'/g, "\\'") + '\',' + (q.pointsPerOption[oi] || 0) + ')">' + E(o) + '</label>';
            });
            h += '</div>';
        } else if (q.type === 'dropdown') {
            h += '<select class="input select" data-qi="' + qi + '" onchange="Naqsh.PublicForm._updateProg()"><option value="">-- اختر --</option>';
            (q.options || []).forEach(function(o, oi) {
                h += '<option value="' + E(o) + '" data-pts="' + (q.pointsPerOption[oi] || 0) + '">' + E(o) + '</option>';
            });
            h += '</select>';
        } else if (q.type === 'checkbox') {
            h += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
            (q.options || []).forEach(function(o, oi) {
                h += '<label class="chk-opt" onclick="Naqsh.PublicForm._toggleChk(this,' + qi + ',\'' + E(o).replace(/'/g, "\\'") + '\',' + (q.pointsPerOption[oi] || 0) + ')"><i class="fa-solid fa-square" style="font-size:12px" data-ci></i>' + E(o) + '</label>';
            });
            h += '</div>';
        } else if (q.type === 'scale') {
            h += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
                '<span style="font-size:11px;color:var(--muted);min-width:80px">' + E(q.scaleMinLabel) + '</span><div style="display:flex;gap:6px">';
            for (var v = q.scaleMin; v <= q.scaleMax; v++) {
                h += '<button class="scale-btn" onclick="Naqsh.PublicForm._selScale(this,' + qi + ',' + v + ')">' + v + '</button>';
            }
            h += '</div><span style="font-size:11px;color:var(--muted);min-width:80px;text-align:left">' + E(q.scaleMaxLabel) + '</span></div>';
        } else if (q.type === 'matrix') {
            h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:8px;text-align:right;min-width:180px"></th>';
            (q.columns || []).forEach(function(col) {
                h += '<th style="padding:8px;text-align:center;min-width:56px;font-size:11px;font-weight:600;color:var(--muted)">' + E(col.text) + '</th>';
            });
            h += '</tr></thead><tbody>';
            (q.rows || []).forEach(function(row) {
                h += '<tr style="border-top:1px solid var(--border)"><td style="padding:10px;font-weight:500;line-height:1.6">' + E(row.text) + '</td>';
                (q.columns || []).forEach(function(col) {
                    h += '<td style="padding:6px;text-align:center"><div class="matrix-cell" data-row="' + row.id + '" data-col="' + col.id + '" onclick="Naqsh.PublicForm._selMatrix(this,' + qi + ',\'' + row.id + '\',\'' + col.id + '\')"></div></td>';
                });
                h += '</tr>';
            });
            h += '</tbody></table></div>';
        }
        h += '</div>'; // إغلاق كرت السؤال
    });

    // زر الإرسال خارج حلقة الأسئلة!
    h += '<button class="btn btn-primary" id="submitBtn" type="button" style="width:100%;padding:16px;font-size:16px;margin-top:8px;justify-content:center">' +
        '<i class="fa-solid fa-paper-plane"></i>إرسال الإجابات</button>' +
        '<p style="text-align:center;font-size:11px;color:var(--muted);margin-top:16px">نشكرك على وقتك</p></div>';

    c.innerHTML = h;
    Naqsh.PublicForm._updateProg();

    document.getElementById('submitBtn').addEventListener('click', function() {
        Naqsh.PublicForm._submit(form.id);
    });
};

Naqsh.PublicForm._selRadio = function(el, qi, val, pts) {
    window._pubSel[qi] = { value: val, points: pts };
    el.parentElement.querySelectorAll('.radio-opt').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    Naqsh.PublicForm._updateProg();
};
Naqsh.PublicForm._toggleChk = function(el, qi, val, pts) {
    if (!window._pubChk[qi]) window._pubChk[qi] = [];
    var idx = window._pubChk[qi].findIndex(function(c) { return c.value === val; });
    var ic = el.querySelector('[data-ci]');
    if (idx >= 0) { window._pubChk[qi].splice(idx, 1); el.classList.remove('selected'); if (ic) ic.className = 'fa-solid fa-square'; }
    else { window._pubChk[qi].push({ value: val, points: pts }); el.classList.add('selected'); if (ic) ic.className = 'fa-solid fa-square-check'; }
    Naqsh.PublicForm._updateProg();
};
Naqsh.PublicForm._selScale = function(el, qi, val) {
    el.parentElement.querySelectorAll('.scale-btn').forEach(function(b) { b.className = 'scale-btn'; });
    el.classList.add('sel-' + val);
    window._pubSel[qi] = { value: val, points: val };
    Naqsh.PublicForm._updateProg();
};
Naqsh.PublicForm._selMatrix = function(el, qi, rowId, colId) {
    if (!window._pubSel[qi]) window._pubSel[qi] = { value: {}, points: 0 };
    el.closest('tr').querySelectorAll('.matrix-cell').forEach(function(c) { c.classList.remove('sel'); });
    el.classList.add('sel');
    window._pubSel[qi].value[rowId] = colId;
    var q = window._pubData.questions[qi]; var pts = 0;
    (q.rows || []).forEach(function(r) {
        var cid = window._pubSel[qi].value[r.id];
        if (cid) { var col = q.columns.find(function(c) { return c.id === cid; }); if (col) pts += col.points; }
    });
    window._pubSel[qi].points = pts;
    Naqsh.PublicForm._updateProg();
};

Naqsh.PublicForm._updateProg = function() {
    if (!window._pubData) return;
    var qs = window._pubData.questions; var a = 0, t = 0;
    qs.forEach(function(q, qi) {
        if (q.type === 'section_header') return; t++; var ok = false;
        if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) {
            var el = document.querySelector('[data-qi="' + qi + '"]');
            if (el && el.value && el.value.trim()) ok = true;
        } else if (q.type === 'dropdown') {
            var el = document.querySelector('select[data-qi="' + qi + '"]');
            if (el && el.value) ok = true;
        } else if (q.type === 'choice') {
            if (window._pubSel[qi]) ok = true;
        } else if (q.type === 'checkbox') {
            if (window._pubChk[qi] && window._pubChk[qi].length) ok = true;
        } else if (q.type === 'scale') {
            if (window._pubSel[qi]) ok = true;
        } else if (q.type === 'matrix') {
            if (window._pubSel[qi] && Object.keys(window._pubSel[qi].value || {}).length) ok = true;
        }
        if (ok) a++;
    });
    var bar = document.getElementById('pubProg');
    if (bar) bar.style.width = (t ? Math.round(a / t * 100) : 0) + '%';
};

Naqsh.PublicForm._submit = function(formId) {
    var btn = document.getElementById('submitBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال...'; }

    setTimeout(async function() {
        try {
            if (!window._pubData) { if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>إرسال الإجابات'; } return; }

            var qs = window._pubData.questions;
            var answers = [];
            var totalPoints = 0;

            for (var qi = 0; qi < qs.length; qi++) {
                var q = qs[qi];
                if (q.type === 'section_header') { answers.push(null); continue; }
                if (q.required) {
                    var ok = false;
                    if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) {
                        var el = document.querySelector('[data-qi="' + qi + '"]');
                        if (el && el.value && el.value.trim()) ok = true;
                    } else if (q.type === 'dropdown') {
                        var el = document.querySelector('select[data-qi="' + qi + '"]');
                        if (el && el.value) ok = true;
                    } else if (q.type === 'choice') {
                        if (window._pubSel[qi]) ok = true;
                    } else if (q.type === 'checkbox') {
                        if (window._pubChk[qi] && window._pubChk[qi].length) ok = true;
                    } else if (q.type === 'scale') {
                        if (window._pubSel[qi]) ok = true;
                    } else if (q.type === 'matrix') {
                        if (window._pubSel[qi] && Object.keys(window._pubSel[qi].value || {}).length) ok = true;
                    }
                    if (!ok) {
                        var el = document.getElementById('pq' + qi);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.borderColor = 'var(--danger)';
                            setTimeout(function() { el.style.borderColor = ''; }, 2000);
                        }
                        Naqsh.Utils.showToast('أجب على جميع الأسئلة المطلوبة', 'warning');
                        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>إعادة المحاولة'; }
                        return;
                    }
                }

                var ans = { questionId: q.id, type: q.type, value: null, points: 0 };
                if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) {
                    var el = document.querySelector('[data-qi="' + qi + '"]');
                    ans.value = el ? el.value : '';
                } else if (q.type === 'dropdown') {
                    var el = document.querySelector('select[data-qi="' + qi + '"]');
                    ans.value = el ? el.value : '';
                    var opt = el && el.selectedOptions[0];
                    ans.points = opt ? Number(opt.dataset.pts || 0) : 0;
                } else if (q.type === 'choice') {
                    var s = window._pubSel[qi];
                    if (s) { ans.value = s.value; ans.points = s.points; }
                } else if (q.type === 'checkbox') {
                    var ch = window._pubChk[qi] || [];
                    ans.value = ch.map(function(c) { return c.value; });
                    ans.points = ch.reduce(function(s, c) { return s + c.points; }, 0);
                } else if (q.type === 'scale') {
                    var s = window._pubSel[qi];
                    if (s) { ans.value = s.value; ans.points = s.points; }
                } else if (q.type === 'matrix') {
                    var s = window._pubSel[qi];
                    if (s) { ans.value = s.value; ans.points = s.points; }
                }
                totalPoints += ans.points;
                answers.push(ans);
            }

            var respEmail = Naqsh.APP.userData ? Naqsh.APP.userData.email : '';
            var respName = Naqsh.APP.userData ? Naqsh.APP.userData.name : '';
            qs.forEach(function(q, qi) {
                if (q.type === 'email' && answers[qi] && answers[qi].value) respEmail = answers[qi].value;
            });

            var fd = await db.collection('forms').doc(formId).get();
            var form = fd.data();
            var evalResult = { label: '', message: '', color: '#0d7c66' };
            if (form.evaluationRanges && form.evaluationRanges.length) {
                for (var r = 0; r < form.evaluationRanges.length; r++) {
                    var range = form.evaluationRanges[r];
                    if (totalPoints >= range.min && totalPoints <= range.max) {
                        evalResult = { label: range.label, message: range.message, color: range.color };
                        break;
                    }
                }
            }
            if (!evalResult.label && form.postSubmissionMessage) evalResult.message = form.postSubmissionMessage;

            var ref = await db.collection('responses').add({
                formId: formId,
                respondentUid: Naqsh.APP.user ? Naqsh.APP.user.uid : null,
                respondentEmail: respEmail,
                respondentName: respName,
                answers: answers,
                totalPoints: totalPoints,
                evaluationResult: evalResult,
                isAnonymous: Naqsh.APP.user ? !!Naqsh.APP.user.isAnonymous : true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await db.collection('forms').doc(formId).update({ responseCount: firebase.firestore.FieldValue.increment(1) });

            Naqsh.PublicForm._showResult(form.title, respName, new Date().toLocaleString('ar-EG'), totalPoints, evalResult, ref.id);

        } catch (err) {
            console.error('Submit error:', err);
            Naqsh.Utils.showToast('خطأ في الإرسال: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>إعادة المحاولة'; }
        }
    }, 50);
};

Naqsh.PublicForm._showResult = function(formTitle, userName, date, score, evalResult, responseId) {
    var c = document.getElementById('publicContent');
    var hasEval = evalResult && evalResult.label;
    var safeTitle = E(formTitle).replace(/'/g, "\\'");
    var safeName = E(userName).replace(/'/g, "\\'");
    var safeLabel = E(evalResult.label || '').replace(/'/g, "\\'");
    var safeMsg = E(evalResult.message || '').replace(/'/g, "\\'");
    var safeColor = evalResult.color || '#0d7c66';

    var h = '<div class="fade-in" style="text-align:center;padding:60px 16px">' +
        '<div style="width:80px;height:80px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;color:#059669"><i class="fa-solid fa-check"></i></div>' +
        '<h1 style="font-size:24px;font-weight:900;margin-bottom:8px;color:#065f46">تم إرسال إجاباتك بنجاح</h1>';

    if (hasEval) {
        h += '<div style="margin:20px auto;max-width:400px;padding:20px;border-radius:14px;background:' + safeColor + '11;border:2px solid ' + safeColor + '44">' +
            '<div style="font-size:14px;font-weight:700;color:' + safeColor + ';margin-bottom:8px">' + safeLabel + '</div>' +
            '<p style="font-size:13px;color:var(--fg);line-height:1.8">' + safeMsg + '</p></div>';
    } else {
        h += '<p style="color:var(--muted);font-size:14px;margin-bottom:8px">مجموع النقاط: <strong style="color:var(--accent)">' + score + '</strong></p>';
    }

    h += '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="Naqsh.ShareCard.generate(\'' + responseId + '\',\'' + safeTitle + '\',\'' + safeName + '\',\'' + date + '\',' + score + ',\'' + safeLabel + '\',\'' + safeMsg + '\',\'' + safeColor + '\')"><i class="fa-solid fa-image"></i>حفظ/مشاركة البطاقة</button>' +
        '<button class="btn btn-outline" onclick="window.location.reload()"><i class="fa-solid fa-rotate-right"></i>ملء مرة أخرى</button></div></div>' +
        '<div id="shareCardTarget"></div>';
    c.innerHTML = h;
};
