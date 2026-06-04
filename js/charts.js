/**
 * charts.js — مساعدات إنشاء الرسوم البيانية
 */

window.Naqsh = window.Naqsh || {};

Naqsh.Charts = {

    /** ألوان قياسية */
    COLORS: [
        'rgba(13,124,102,.7)',
        'rgba(217,119,6,.7)',
        'rgba(37,99,235,.7)',
        'rgba(220,38,38,.7)',
        'rgba(107,114,128,.7)',
        'rgba(124,58,237,.7)',
        'rgba(236,72,153,.7)'
    ],

    COLORS_SCALE: [
        'rgba(5,150,105,.7)',
        'rgba(101,163,13,.7)',
        'rgba(202,138,4,.7)',
        'rgba(234,88,12,.7)',
        'rgba(220,38,38,.7)'
    ],

    /**
     * إنشاء رسم أعمدة
     */
    bar: function(canvasId, labels, data, options) {
        var ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        var opts = Object.assign({
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }, options || {});
        var chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: opts.datasetLabel || '',
                    data: data,
                    backgroundColor: opts.colors || this.COLORS[0],
                    borderRadius: 8,
                    barThickness: opts.barThickness || undefined
                }]
            },
            options: opts
        });
        Naqsh.APP.chartInstances.push(chart);
        return chart;
    },

    /**
     * إنشاء رسم دائري
     */
    doughnut: function(canvasId, labels, data, options) {
        var ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        var opts = Object.assign({
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Cairo', size: 11 } }
                }
            }
        }, options || {});
        var chart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: options && options.colors ? options.colors : this.COLORS
                }]
            },
            options: opts
        });
        Naqsh.APP.chartInstances.push(chart);
        return chart;
    },

    /**
     * إنشاء رسم خطي
     */
    line: function(canvasId, labels, data, options) {
        var ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        var color = (options && options.color) || 'rgba(13,124,102,1)';
        var chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: (options && options.label) || '',
                    data: data,
                    borderColor: color,
                    backgroundColor: color.replace('1)', '0.1)'),
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: color
                }]
            },
            options: Object.assign({
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }, options || {})
        });
        Naqsh.APP.chartInstances.push(chart);
        return chart;
    },

    /**
     * رسم أعمدة أفقي
     */
    horizontalBar: function(canvasId, labels, datasets, options) {
        var ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        var chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: Object.assign({
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { labels: { font: { family: 'Cairo' } } }
                },
                scales: { x: { beginAtZero: true } }
            }, options || {})
        });
        Naqsh.APP.chartInstances.push(chart);
        return chart;
    }
};