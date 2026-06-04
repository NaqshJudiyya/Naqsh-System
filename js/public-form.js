/**
 * public-form.js — واجهة ملء الاستمارة العامة + الإرسال
 */

window.Naqsh = window.Naqsh || {};
Naqsh.PublicForm = {};
var E = Naqsh.Utils.esc;

Naqsh.PublicForm.load = async function() {
    var c = document.getElementById('publicContent');
    c.innerHTML = '<div style="text-align:center;padding:80px"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--accent)"></i></div>';
    try {
        var d = await db.collection('forms').doc(Naqsh.APP.publicFormId).get();
        if (!d.exists) { c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--muted)"><i class="fa-solid fa-circle-exclamation" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i><h2>الاستمارة غير موجودة</h2></div>'; return; }
        var f = d.data();
        if (!f.published) { c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--muted)"><i class="fa-solid fa-lock" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i><h2>غير متاحة حالياً</h2></div>'; return; }
        Naqsh.PublicForm._render(f);
    } catch (e) { c.innerHTML = '<div style="text-align:center;padding:80px;color:var(--danger)"><h2>خطأ: ' + E(e.message) + '</h2></div>'; }
};

Naqsh.PublicForm._render = function(form) {
    var c = document.getElementById('publicContent');
    var qs = form.questions || [];
    window._pubData = { formId: form.id, questions: qs };
    window._pubSel = {};
    window._pubChk = {};

    var h = '<div class="fade-in"><div style="position:fixed;top:0;left:0;right:0;height:4px;background:var(--border);z-index:1000">' +
        '<div id="pubProg" style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));width:0%;transition:width .4s;border-radius:0 2px 2px 0"></div></div>' +
        '<div class="card" style="margin-bottom:24px;border-right:4px solid var(--accent)">' +
        '<h1 style="font-size:22px;font-weight:900;margin-bottom:8px">' + E(form.title) + '</h1>' +
        '<p style="font-size:14px;color:var(--muted);line-height:1.8">' + E(form.description || '') + '</p>' +
        '<div style="margin-top:12px;font-size:11px;color:var(--muted)"><i class="fa-solid fa-lock" style="margin-left:4px"></i>خصوصية تامة</div></div>';

    qs.forEach(function(q, qi) {
        if (q.type === 'section_header') {
            h += '<div style="margin:28px 0 16px;padding:12px 16px;background:linear-gradient(90deg,var(--accent),transparent);border-radius:10px"><h2 style="font-size:17px;font-weight:800;color:#fff">' + E(q.text) + '</h2></div>';
            return;
        }
        var req = q.required ? '<span style="color:var(--danger);margin-right:4px">*</span>' : '';
        h += '<div class="card" id="pq' + qi + '"><label style="font-size:15px;font-weight:600;display:block;margin-bottom:14px">' + req + E(q.text) + '</label>';

        if (['short_text', 'email', 'number'].indexOf(q.type) >= 0) {
            h += '<input class="input" type="' + (q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text') + '" data-qi="' + qi + '" oninput="Naqsh.PublicForm._updateProg()">';
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
            h += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:11px;color:var(--muted);min-width:80px">' + E(q.scaleMinLabel) + '</span><div style="display:flex;gap:6px">';
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
        h += '</div>';
    });

    h += '<button class="btn btn-primary" style="width:100%;padding:16px;font-size:16px;margin-top:8px;justify-content:center" onclick="Naqsh.PublicForm._submit(\'' + form.id + '\')"><i class="fa-solid fa-paper-plane"></i>إرسال</button>' +
        '<p style="text-align:center;font-size:11px;color:var(--muted);margin-top:16px">نشكرك على وقتك</p></div>';
    c.innerHTML = h;
    Naqsh.PublicForm._updateProg();
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
        if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) { var el = document.querySelector('[data-qi="' + qi + '"]'); if (el && el.value && el.value.trim()) ok = true; }
        else if (q.type === 'dropdown') { var el = document.querySelector('select[data-qi="' + qi + '"]'); if (el && el.value) ok = true; }
        else if (q.type === 'choice') { if (window._pubSel[qi]) ok = true; }
        else if (q.type === 'checkbox') { if (window._pubChk[qi] && window._pubChk[qi].length) ok = true; }
        else if (q.type === 'scale') { if (window._pubSel[qi]) ok = true; }
        else if (q.type === 'matrix') { if (window._pubSel[qi] && Object.keys(window._pubSel[qi].value || {}).length) ok = true; }
        if (ok) a++;
    });
    var bar = document.getElementById('pubProg'); if (bar) bar.style.width = (t ? Math.round(a / t * 100) : 0) + '%';
};

Naqsh.PublicForm._submit = async function(formId) {
    if (!window._pubData) return;
    var qs = window._pubData.questions; var answers = []; var totalPoints = 0;
    for (var qi = 0; qi < qs.length; qi++) {
        var q = qs[qi]; if (q.type === 'section_header') { answers.push(null); continue; }
        if (q.required) {
            var ok = false;
            if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) { var el = document.querySelector('[data-qi="' + qi + '"]'); if (el && el.value && el.value.trim()) ok = true; }
            else if (q.type === 'dropdown') { var el = document.querySelector('select[data-qi="' + qi + '"]'); if (el && el.value) ok = true; }
            else if (q.type === 'choice') ok = !!window._pubSel[qi];
            else if (q.type === 'checkbox') ok = window._pubChk[qi] && window._pubChk[qi].length > 0;
            else if (q.type === 'scale') ok = !!window._pubSel[qi];
            else if (q.type === 'matrix') ok = window._pubSel[qi] && Object.keys(window._pubSel[qi].value || {}).length > 0;
            if (!ok) { var el = document.getElementById('pq' + qi); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.borderColor = 'var(--danger)'; setTimeout(function() { el.style.borderColor = ''; }, 2000); } Naqsh.Utils.showToast('أجب على جميع الأسئلة المطلوبة', 'warning'); return; }
        }
        var ans = { questionId: q.id, type: q.type, value: null, points: 0 };
        if (['short_text', 'email', 'number', 'paragraph', 'date', 'time'].indexOf(q.type) >= 0) { var el = document.querySelector('[data-qi="' + qi + '"]'); ans.value = el ? el.value : ''; }
        else if (q.type === 'dropdown') { var el = document.querySelector('select[data-qi="' + qi + '"]'); ans.value = el ? el.value : ''; var opt = el && el.selectedOptions[0]; ans.points = opt ? Number(opt.dataset.pts || 0) : 0; }
        else if (q.type === 'choice') { var s = window._pubSel[qi]; if (s) { ans.value = s.value; ans.points = s.points; } }
        else if (q.type === 'checkbox') { var ch = window._pubChk[qi] || []; ans.value = ch.map(function(c) { return c.value; }); ans.points = ch.reduce(function(s, c) { return s + c.points; }, 0); }
        else if (q.type === 'scale') { var s = window._pubSel[qi]; if (s) { ans.value = s.value; ans.points = s.points; } }
        else if (q.type === 'matrix') { var s = window._pubSel[qi]; if (s) { ans.value = s.value; ans.points = s.points; } }
        totalPoints += ans.points; answers.push(ans);
    }
    var respEmail = Naqsh.APP.user ? Naqsh.APP.user.email : '';
    qs.forEach(function(q, qi) { if (q.type === 'email' && answers[qi] && answers[qi].value) respEmail = answers[qi].value; });

    // حساب التقييم
    var fd = await db.collection('forms').doc(formId).get(); var form = fd.data();
    var evalResult = { label: '', message: '', color: '#0d7c66' };
    if (form.evaluationRanges && form.evaluationRanges.length) {
        for (var r = 0; r < form.evaluationRanges.length; r++) {
            var range = form.evaluationRanges[r];
            if (totalPoints >= range.min && totalPoints <= range.max) { evalResult = { label: range.label, message: range.message, color: range.color }; break; }
        }
    }
    if (!evalResult.label && form.postSubmissionMessage) evalResult.message = form.postSubmissionMessage;

    try {
        var ref = await db.collection('responses').add({
            formId: formId, respondentUid: Naqsh.APP.user ? Naqsh.APP.user.uid : null,
            respondentEmail: respEmail, respondentName: Naqsh.APP.userData ? Naqsh.APP.userData.name : '',
            answers: answers, totalPoints: totalPoints, evaluationResult: evalResult,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('forms').doc(formId).update({ responseCount: firebase.firestore.FieldValue.increment(1) });
        Naqsh.PublicForm._showResult(form.title, Naqsh.APP.userData ? Naqsh.APP.userData.name : '', new Date().toLocaleString('ar-EG'), totalPoints, evalResult, ref.id);
    } catch (e) { Naqsh.Utils.showToast('خط