/**
 * responder.js — لوحة المستخدم العادي: سجل الاستمارات + تحليل تكاملي
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Responder = {};
var E = Naqsh.Utils.esc;

Naqsh.Responder.renderHistory = async function() {
    var APP = Naqsh.APP;
    var c = document.getElementById('responderContent');
    var snap = await db.collection('responses').where('respondentUid', '==', APP.user.uid).orderBy('createdAt', 'desc').get();
    var responses = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    if (!responses.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-clock-rotate-left" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">لا توجد استمارات في سجلك</h2>' +
            '<p>عندما تملأ استمارة ستظهر هنا</p></div>';
        return;
    }

    var formIds = [];
    responses.forEach(function(r) { if (formIds.indexOf(r.formId) < 0) formIds.push(r.formId); });
    var formsMap = {};
    for (var i = 0; i < formIds.length; i++) {
        var d = await db.collection('forms').doc(formIds[i]).get();
        if (d.exists) formsMap[formIds[i]] = d.data();
    }

    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:8px">سجل استماراتي</h1>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:24px">كل تسجيل يُحسب كاستمارة مستقلة — يمكنك ملء نفس الاستمارة عدة مرات</p>';

    responses.forEach(function(r) {
        var f = formsMap[r.formId] || {};
        var dt = r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleString('ar-EG') : '—') : '—';
        var ev = r.evaluationResult || {};
        var safeTitle = E(f.title || 'استمارة محذوفة').replace(/'/g, "\\'");
        var safeName = E(APP.userData.name || APP.user.email || '').replace(/'/g, "\\'");
        var safeLabel = E(ev.label || '').replace(/'/g, "\\'");
        var safeMsg = E(ev.message || '').replace(/'/g, "\\'");

        h += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
            '<div style="flex:1;min-width:200px"><h3 style="font-size:15px;font-weight:700;margin-bottom:4px">' + E(f.title || 'استمارة محذوفة') + '</h3>' +
            '<p style="font-size:12px;color:var(--muted)"><i class="fa-regular fa-clock" style="margin-left:4px"></i>' + dt + '</p></div>' +
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="text-align:center"><div style="font-size:24px;font-weight:900;color:var(--accent)">' + (r.totalPoints || 0) + '</div><div style="font-size:10px;color:var(--muted)">نقطة</div></div>' +
            (ev.label ? '<span class="badge" style="background:' + (ev.color || '#ddd') + '22;color:' + (ev.color || '#666') + ';font-size:12px;padding:6px 14px">' + E(ev.label) + '</span>' : '') +
            '<button class="btn btn-outline btn-sm" onclick="Naqsh.ShareCard.generate(\'' + r.id + '\',\'' + safeTitle + '\',\'' + safeName + '\',\'' + dt + '\',' + (r.totalPoints || 0) + ',\'' + safeLabel + '\',\'' + safeMsg + '\',\'' + (ev.color || '#0d7c66') + '\')" title="بطاقة النتيجة"><i class="fa-solid fa-share-nodes"></i></button>' +
            '</div></div>';
    });
    c.innerHTML = h + '</div>';
};

Naqsh.Responder.renderStats = async function() {
    var APP = Naqsh.APP;
    var c = document.getElementById('responderContent');
    var snap = await db.collection('responses').where('respondentUid', '==', APP.user.uid).orderBy('createdAt', 'asc').get();
    var responses = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    if (responses.length < 2) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-chart-pie" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">تحليل نتائجك</h2>' +
            '<p>يحتاج استمارارتين على الأقل لعرض التحليل</p></div>';
        return;
    }

    var byForm = {};
    responses.forEach(function(r) { if (!byForm[r.formId]) byForm[r.formId] = []; byForm[r.formId].push(r); });
    var formIds = Object.keys(byForm);
    var formsMap = {};
    for (var i = 0; i < formIds.length; i++) {
        var d = await db.collection('forms').doc(formIds[i]).get();
        if (d.exists) formsMap[formIds[i]] = d.data();
    }

    Naqsh.Utils.destroyCharts();
    var avgAll = (responses.reduce(function(s, r) { return s + (r.totalPoints || 0); }, 0) / responses.length).toFixed(0);

    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:24px">تحليل نتائجي التكاملي</h1>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px">' +
        '<div class="stat-card"><div class="stat-num">' + responses.length + '</div><div class="stat-label">إجمالي التسجيلات</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + formIds.length + '</div><div class="stat-label">استمارات مختلفة</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + avgAll + '</div><div class="stat-label">متوسط النقاط</div></div></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">تطور نقاطك عبر الزمن</h3><canvas id="rsTimeline" height="200"></canvas></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">متوسط نقاطك لكل استمارة</h3><canvas id="rsPerForm" height="200"></canvas></div>';

    formIds.forEach(function(fid) {
        var f = formsMap[fid] || {};
        var rs = byForm[fid];
        var scores = rs.map(function(r) { return r.totalPoints || 0; });
        var avg = (scores.reduce(function(a, b) { return a + b; }, 0) / scores.length).toFixed(1);
        var change = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]) : 0;
        var changeIcon = change > 0 ? '<i class="fa-solid fa-arrow-up" style="color:var(--danger)"></i>' : change < 0 ? '<i class="fa-solid fa-arrow-down" style="color:var(--s0)"></i>' : '<i class="fa-solid fa-minus" style="color:var(--muted)"></i>';

        h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
            '<h4 style="font-size:15px;font-weight:700">' + E(f.title || 'استمارة') + '</h4>' +
            '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px;font-weight:700;color:var(--accent)">' + avg + ' متوسط</span>' + changeIcon +
            '<span style="font-size:12px;color:' + (change > 0 ? 'var(--danger)' : 'var(--s0)') + '">' + (change > 0 ? '+' : '') + change + ' تغير</span></div></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">';
        rs.forEach(function(r) {
            var dt = r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '') : '';
            h += '<div style="padding:8px 14px;background:var(--bg);border-radius:8px;font-size:12px"><div style="font-weight:700;color:var(--accent)">' + (r.totalPoints || 0) + ' نقطة</div><div style="color:var(--muted)">' + dt + '</div></div>';
        });
        h += '</div></div>';
    });
    c.innerHTML = h + '</div>';

    // رسم التايملاين
    var timeLabels = responses.map(function(r) { return r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '') : ''; });
    var timeData = responses.map(function(r) { return r.totalPoints || 0; });
    Naqsh.Charts.line('rsTimeline', timeLabels, timeData, { label: 'النقاط' });

    // رسم لكل استمارة
    var fLabels = formIds.map(function(fid) { return (formsMap[fid] || {}).title || 'استمارة'; });
    var fAvgs = formIds.map(function(fid) { var rs = byForm[fid]; return (rs.reduce(function(s, r) { return s + (r.totalPoints || 0); }, 0) / rs.length).toFixed(1); });
    Naqsh.Charts.bar('rsPerForm', fLabels, fAvgs, { barThickness: 50 });
};/**
 * responder.js — لوحة المستخدم العادي: سجل الاستمارات + تحليل تكاملي
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Responder = {};
var E = Naqsh.Utils.esc;

Naqsh.Responder.renderHistory = async function() {
    var APP = Naqsh.APP;
    var c = document.getElementById('responderContent');
    var snap = await db.collection('responses').where('respondentUid', '==', APP.user.uid).orderBy('createdAt', 'desc').get();
    var responses = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    if (!responses.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-clock-rotate-left" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">لا توجد استمارات في سجلك</h2>' +
            '<p>عندما تملأ استمارة ستظهر هنا</p></div>';
        return;
    }

    var formIds = [];
    responses.forEach(function(r) { if (formIds.indexOf(r.formId) < 0) formIds.push(r.formId); });
    var formsMap = {};
    for (var i = 0; i < formIds.length; i++) {
        var d = await db.collection('forms').doc(formIds[i]).get();
        if (d.exists) formsMap[formIds[i]] = d.data();
    }

    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:8px">سجل استماراتي</h1>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:24px">كل تسجيل يُحسب كاستمارة مستقلة — يمكنك ملء نفس الاستمارة عدة مرات</p>';

    responses.forEach(function(r) {
        var f = formsMap[r.formId] || {};
        var dt = r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleString('ar-EG') : '—') : '—';
        var ev = r.evaluationResult || {};
        var safeTitle = E(f.title || 'استمارة محذوفة').replace(/'/g, "\\'");
        var safeName = E(APP.userData.name || APP.user.email || '').replace(/'/g, "\\'");
        var safeLabel = E(ev.label || '').replace(/'/g, "\\'");
        var safeMsg = E(ev.message || '').replace(/'/g, "\\'");

        h += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
            '<div style="flex:1;min-width:200px"><h3 style="font-size:15px;font-weight:700;margin-bottom:4px">' + E(f.title || 'استمارة محذوفة') + '</h3>' +
            '<p style="font-size:12px;color:var(--muted)"><i class="fa-regular fa-clock" style="margin-left:4px"></i>' + dt + '</p></div>' +
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="text-align:center"><div style="font-size:24px;font-weight:900;color:var(--accent)">' + (r.totalPoints || 0) + '</div><div style="font-size:10px;color:var(--muted)">نقطة</div></div>' +
            (ev.label ? '<span class="badge" style="background:' + (ev.color || '#ddd') + '22;color:' + (ev.color || '#666') + ';font-size:12px;padding:6px 14px">' + E(ev.label) + '</span>' : '') +
            '<button class="btn btn-outline btn-sm" onclick="Naqsh.ShareCard.generate(\'' + r.id + '\',\'' + safeTitle + '\',\'' + safeName + '\',\'' + dt + '\',' + (r.totalPoints || 0) + ',\'' + safeLabel + '\',\'' + safeMsg + '\',\'' + (ev.color || '#0d7c66') + '\')" title="بطاقة النتيجة"><i class="fa-solid fa-share-nodes"></i></button>' +
            '</div></div>';
    });
    c.innerHTML = h + '</div>';
};

Naqsh.Responder.renderStats = async function() {
    var APP = Naqsh.APP;
    var c = document.getElementById('responderContent');
    var snap = await db.collection('responses').where('respondentUid', '==', APP.user.uid).orderBy('createdAt', 'asc').get();
    var responses = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    if (responses.length < 2) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-chart-pie" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">تحليل نتائجك</h2>' +
            '<p>يحتاج استمارارتين على الأقل لعرض التحليل</p></div>';
        return;
    }

    var byForm = {};
    responses.forEach(function(r) { if (!byForm[r.formId]) byForm[r.formId] = []; byForm[r.formId].push(r); });
    var formIds = Object.keys(byForm);
    var formsMap = {};
    for (var i = 0; i < formIds.length; i++) {
        var d = await db.collection('forms').doc(formIds[i]).get();
        if (d.exists) formsMap[formIds[i]] = d.data();
    }

    Naqsh.Utils.destroyCharts();
    var avgAll = (responses.reduce(function(s, r) { return s + (r.totalPoints || 0); }, 0) / responses.length).toFixed(0);

    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:24px">تحليل نتائجي التكاملي</h1>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px">' +
        '<div class="stat-card"><div class="stat-num">' + responses.length + '</div><div class="stat-label">إجمالي التسجيلات</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + formIds.length + '</div><div class="stat-label">استمارات مختلفة</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + avgAll + '</div><div class="stat-label">متوسط النقاط</div></div></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">تطور نقاطك عبر الزمن</h3><canvas id="rsTimeline" height="200"></canvas></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">متوسط نقاطك لكل استمارة</h3><canvas id="rsPerForm" height="200"></canvas></div>';

    formIds.forEach(function(fid) {
        var f = formsMap[fid] || {};
        var rs = byForm[fid];
        var scores = rs.map(function(r) { return r.totalPoints || 0; });
        var avg = (scores.reduce(function(a, b) { return a + b; }, 0) / scores.length).toFixed(1);
        var change = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]) : 0;
        var changeIcon = change > 0 ? '<i class="fa-solid fa-arrow-up" style="color:var(--danger)"></i>' : change < 0 ? '<i class="fa-solid fa-arrow-down" style="color:var(--s0)"></i>' : '<i class="fa-solid fa-minus" style="color:var(--muted)"></i>';

        h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
            '<h4 style="font-size:15px;font-weight:700">' + E(f.title || 'استمارة') + '</h4>' +
            '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px;font-weight:700;color:var(--accent)">' + avg + ' متوسط</span>' + changeIcon +
            '<span style="font-size:12px;color:' + (change > 0 ? 'var(--danger)' : 'var(--s0)') + '">' + (change > 0 ? '+' : '') + change + ' تغير</span></div></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">';
        rs.forEach(function(r) {
            var dt = r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '') : '';
            h += '<div style="padding:8px 14px;background:var(--bg);border-radius:8px;font-size:12px"><div style="font-weight:700;color:var(--accent)">' + (r.totalPoints || 0) + ' نقطة</div><div style="color:var(--muted)">' + dt + '</div></div>';
        });
        h += '</div></div>';
    });
    c.innerHTML = h + '</div>';

    // رسم التايملاين
    var timeLabels = responses.map(function(r) { return r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '') : ''; });
    var timeData = responses.map(function(r) { return r.totalPoints || 0; });
    Naqsh.Charts.line('rsTimeline', timeLabels, timeData, { label: 'النقاط' });

    // رسم لكل استمارة
    var fLabels = formIds.map(function(fid) { return (formsMap[fid] || {}).title || 'استمارة'; });
    var fAvgs = formIds.map(function(fid) { var rs = byForm[fid]; return (rs.reduce(function(s, r) { return s + (r.totalPoints || 0); }, 0) / rs.length).toFixed(1); });
    Naqsh.Charts.bar('rsPerForm', fLabels, fAvgs, { barThickness: 50 });
};