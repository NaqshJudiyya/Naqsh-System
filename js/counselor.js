/**
 * counselor.js — لوحة المستشار: استماراتي + إحصائيات + مقارنة المستخدمين
 */

window.Naqsh = window.Naqsh || {};
Naqsh.Counselor = {};
var E = Naqsh.Utils.esc;

Naqsh.Counselor.renderForms = async function() {
    var c = document.getElementById('counselorContent');
    var asgn = Naqsh.APP.userData.assignedForms || [];
    if (!asgn.length) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:80px;color:var(--muted)">' +
            '<i class="fa-solid fa-folder-open" style="font-size:48px;display:block;margin-bottom:16px;color:#d6d3d1"></i>' +
            '<h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--fg)">لا توجد استمارات مخصصة لك</h2></div>';
        return;
    }
    var snap = await db.collection('forms').where(firebase.firestore.FieldPath.documentId(), 'in', asgn).get();
    var forms = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var h = '<div class="fade-in"><h1 style="font-size:22px;font-weight:800;margin-bottom:24px">استماراتي <span style="color:var(--muted);font-size:14px;font-weight:400">(' + forms.length + ')</span></h1>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">';
    forms.forEach(function(f) {
        h += '<div class="card" style="cursor:pointer;transition:transform .2s" onclick="Naqsh.APP.selectedFormId=\'' + f.id + '\';Naqsh.Router.switchTab(\'counselor\',\'c-stats\')" onmouseenter="this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.transform=\'none\'">' +
            '<span class="badge badge-green" style="margin-bottom:12px;display:inline-block">منشورة</span>' +
            '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px">' + E(f.title) + '</h3>' +
            '<p style="font-size:12px;color:var(--muted)">' + E(f.description || '') + '</p>' +
            '<div style="margin-top:12px;font-size:12px;color:var(--muted)"><i class="fa-solid fa-users" style="margin-left:4px"></i>' + (f.responseCount || 0) + ' رد</div></div>';
    });
    c.innerHTML = h + '</div></div>';
};

Naqsh.Counselor.renderStats = async function() {
    var APP = Naqsh.APP;
    var c = document.getElementById('counselorContent');
    if (!APP.selectedFormId) {
        c.innerHTML = '<div class="fade-in" style="text-align:center;padding:60px;color:var(--muted)">' +
            '<i class="fa-solid fa-hand-pointer" style="font-size:36px;display:block;margin-bottom:12px;color:#d6d3d1"></i>اختر استمارة من "استماراتي"</div>';
        return;
    }
    var fd = await db.collection('forms').doc(APP.selectedFormId).get();
    var form = fd.data();
    var rs = await db.collection('responses').where('formId', '==', APP.selectedFormId).orderBy('createdAt', 'desc').get();
    var responses = rs.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var scoredQs = (form.questions || []).filter(function(q) { return q.type !== 'section_header' && ['scale', 'choice', 'checkbox', 'matrix', 'dropdown'].indexOf(q.type) >= 0; });
    var totalPts = responses.reduce(function(s, r) { return s + (r.totalPoints || 0); }, 0);
    var avgPts = responses.length ? (totalPts / responses.length).toFixed(1) : 0;

    var h = '<div class="fade-in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<div><h1 style="font-size:22px;font-weight:800">' + E(form.title) + '</h1><p style="font-size:13px;color:var(--muted)">' + responses.length + ' رد</p></div>' +
        '<button class="btn btn-outline" onclick="Naqsh.Router.switchTab(\'counselor\',\'c-forms\')"><i class="fa-solid fa-arrow-right"></i>رجوع</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px">' +
        '<div class="stat-card"><div class="stat-num">' + responses.length + '</div><div class="stat-label">إجمالي الردود</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + avgPts + '</div><div class="stat-label">متوسط النقاط</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + totalPts + '</div><div class="stat-label">مجموع النقاط</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + scoredQs.length + '</div><div class="stat-label">أسئلة مُقيّمة</div></div></div>' +
        '<div class="card" style="margin-bottom:20px"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">توزيع النقاط الكلية</h3><canvas id="cs1" height="180"></canvas></div>' +
        '<div class="card" style="margin-bottom:20px"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px"><i class="fa-solid fa-users" style="color:var(--accent);margin-left:8px"></i>مقارنة المستجيبين</h3><canvas id="csUsers" height="' + Math.max(200, responses.length * 30) + '"></canvas></div>' +
        '<div id="perQCharts"></div>' +
        '<div class="card"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">آخر الردود</h3>';

    if (!responses.length) {
        h += '<p style="color:var(--muted);text-align:center;padding:30px">لا توجد ردود</p>';
    } else {
        h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="border-bottom:2px solid var(--border)"><th style="padding:10px;text-align:right">التاريخ</th><th style="padding:10px;text-align:right">البريد</th><th style="padding:10px;text-align:right">النقاط</th><th style="padding:10px;text-align:right">التقييم</th></tr></thead><tbody>';
        responses.slice(0, 30).forEach(function(r) {
            var dt = r.createdAt ? (r.createdAt.toDate ? r.createdAt.toDate().toLocaleString('ar-EG') : '—') : '—';
            var ev = r.evaluationResult || {};
            h += '<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px">' + dt + '</td>' +
                '<td style="padding:10px;direction:ltr;text-align:right">' + E(r.respondentEmail || '—') + '</td>' +
                '<td style="padding:10px;font-weight:700;color:var(--accent)">' + (r.totalPoints || 0) + '</td>' +
                '<td style="padding:10px">' + (ev.label ? '<span class="badge" style="background:' + (ev.color || '#ddd') + '22;color:' + (ev.color || '#666') + '">' + E(ev.label) + '</span>' : '—') + '</td></tr>';
        });
        h += '</tbody></table></div>';
    }
    h += '</div></div>';
    c.innerHTML = h;

    Naqsh.Utils.destroyCharts();

    if (responses.length) {
        // توزيع النقاط
        var dist = {};
        responses.forEach(function(r) { var s = r.totalPoints || 0; dist[s] = (dist[s] || 0) + 1; });
        var sk = Object.keys(dist).sort(function(a, b) { return a - b; });
        Naqsh.Charts.bar('cs1', sk, sk.map(function(k) { return dist[k]; }));

        // مقارنة المستخدمين
        var userMap = {};
        responses.forEach(function(r) {
            var e = r.respondentEmail || 'مجهول';
            if (!userMap[e]) userMap[e] = [];
            userMap[e].push(r.totalPoints || 0);
        });
        var uLabels = Object.keys(userMap);
        var uAvgs = uLabels.map(function(e) { var a = userMap[e]; return (a.reduce(function(s, v) { return s + v; }, 0) / a.length).toFixed(1); });
        var uCounts = uLabels.map(function(e) { return userMap[e].length; });
        Naqsh.Charts.horizontalBar('csUsers', uLabels.map(function(l) { return l.substring(0, 25); }), [
            { label: 'متوسط النقاط', data: uAvgs, backgroundColor: 'rgba(13,124,102,.6)', borderRadius: 6 },
            { label: 'عدد المرات', data: uCounts, backgroundColor: 'rgba(217,119,6,.4)', borderRadius: 6 }
        ]);
    }

    // رسوم لكل سؤال
    var qh = '';
    (form.questions || []).forEach(function(q, qi) {
        if (q.type === 'scale') qh += '<div class="card"><h4 style="font-size:14px;font-weight:700;margin-bottom:12px">' + E(q.text || '') + '</h4><canvas id="qC' + qi + '" height="140"></canvas></div>';
        else if (q.type === 'choice' || q.type === 'dropdown') qh += '<div class="card"><h4 style="font-size:14px;font-weight:700;margin-bottom:12px">' + E(q.text || '') + '</h4><canvas id="qC' + qi + '" height="140"></canvas></div>';
        else if (q.type === 'matrix') qh += '<div class="card"><h4 style="font-size:14px;font-weight:700;margin-bottom:4px">' + E(q.text || '') + '</h4><canvas id="qC' + qi + '" height="' + Math.max(140, (q.rows || []).length * 28) + '"></canvas></div>';
    });
    document.getElementById('perQCharts').innerHTML = qh;

    (form.questions || []).forEach(function(q, qi) {
        if (q.type === 'scale') {
            var dist = {}; for (var v = q.scaleMin; v <= q.scaleMax; v++) dist[v] = 0;
            responses.forEach(function(r) { var a = r.answers && r.answers[qi]; if (a && a.value !== undefined && a.value !== null) dist[a.value] = (dist[a.value] || 0) + 1; });
            Naqsh.Charts.bar('qC' + qi, Object.keys(dist), Object.values(dist), { colors: Naqsh.Charts.COLORS_SCALE, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } });
        } else if (q.type === 'choice' || q.type === 'dropdown') {
            var dist = {}; (q.options || []).forEach(function(o) { dist[o] = 0; });
            responses.forEach(function(r) { var a = r.answers && r.answers[qi]; if (a && a.value) dist[a.value] = (dist[a.value] || 0) + 1; });
            Naqsh.Charts.doughnut('qC' + qi, Object.keys(dist), Object.values(dist));
        } else if (q.type === 'matrix') {
            var rowAvgs = (q.rows || []).map(function(row) {
                var s = 0, cnt = 0;
                responses.forEach(function(r) {
                    var a = r.answers && r.answers[qi];
                    if (a && a.value && a.value[row.id] !== undefined) {
                        var ci = (q.columns || []).findIndex(function(x) { return x.id === a.value[row.id]; });
                        if (ci >= 0) { s += q.columns[ci].points; cnt++; }
                    }
                });
                return cnt ? (s / cnt).toFixed(1) : 0;
            });
            Naqsh.Charts.horizontalBar('qC' + qi, (q.rows || []).map(function(r) { return r.text.substring(0, 30); }), [
                { label: 'متوسط', data: rowAvgs, backgroundColor: 'rgba(13,124,102,.6)', borderRadius: 6 }
            ], { scales: { x: { beginAtZero: true, max: Math.max.apply(null, (q.columns || []).map(function(c) { return c.points; }).concat([4])) } } });
        }
    });
};