 th:inline="javascript"
    /*<![CDATA[*/
    // Datos iniciales inyectados por Thymeleaf
    const INIT_VIAJES_POR_MES   = /*[[${resumen.viajesPorMes}]]*/ [];
    const INIT_INGRESOS_POR_MES = /*[[${resumen.ingresosPorMes}]]*/ [];
    const INIT_GASTOS_POR_MES   = /*[[${resumen.gastosPorMes}]]*/ [];
    const INIT_ESTADOS          = /*[[${resumen.viajesPorEstado}]]*/ {};
    const AÑO_ACTUAL            = /*[[${anoActual}]]*/ 2026;

    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    const COLOR_ESTADOS = {
    'cargando':     '#f59e0b',
    'en camino':    '#3b82f6',
    'descargando':  '#06b6d4',
    'con fallas':   '#f97316',
    'cancelado':    '#ef4444',
    'completado':   '#22c55e',
};

    // ── Gráfica de barras: Viajes por mes ──────────────────────────────────────
    const ctxViajes = document.getElementById('chartViajes').getContext('2d');
    const chartViajes = new Chart(ctxViajes, {
    type: 'bar',
    data: {
    labels: MESES,
    datasets: [{
    label: 'Viajes',
    data: INIT_VIAJES_POR_MES,
    backgroundColor: MESES.map((_, i) =>
    i === (new Date().getMonth()) ? 'rgba(26,58,143,0.9)' : 'rgba(26,58,143,0.4)'),
    borderColor: 'rgba(26,58,143,1)',
    borderWidth: 2,
    borderRadius: 6,
}]
},
    options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f0f0f0' } },
    x: { ticks: { font: { size: 11 } }, grid: { display: false } }
}
}
});

    // ── Gráfica de líneas: Ingresos vs Gastos ─────────────────────────────────
    const ctxFin = document.getElementById('chartFinanciero').getContext('2d');
    const chartFinanciero = new Chart(ctxFin, {
    type: 'line',
    data: {
    labels: MESES,
    datasets: [
{
    label: 'Ingresos',
    data: INIT_INGRESOS_POR_MES,
    borderColor: '#059669',
    backgroundColor: 'rgba(5,150,105,0.08)',
    borderWidth: 2.5,
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#059669',
    pointRadius: 4,
},
{
    label: 'Gastos',
    data: INIT_GASTOS_POR_MES,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 2.5,
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#ef4444',
    pointRadius: 4,
}
    ]
},
    options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
    legend: {
    position: 'top',
    labels: { font: { size: 11 }, boxWidth: 12 }
},
    tooltip: {
    callbacks: {
    label: ctx => ` $${ctx.parsed.y.toFixed(2)}`
}
}
},
    scales: {
    y: {
    beginAtZero: true,
    ticks: { font: { size: 11 }, callback: v => '$' + v.toLocaleString() },
    grid: { color: '#f0f0f0' }
},
    x: { ticks: { font: { size: 11 } }, grid: { display: false } }
}
}
});

    // ── Gráfica de dona: Estados ───────────────────────────────────────────────
    function buildDonaEstados(estados) {
    const labels = Object.keys(estados);
    const data   = Object.values(estados);
    const colors = labels.map(l => COLOR_ESTADOS[l] || '#94a3b8');

    const ctxEstado = document.getElementById('chartEstados').getContext('2d');
    if (window._chartEstados) window._chartEstados.destroy();
    window._chartEstados = new Chart(ctxEstado, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: {
    responsive: true, maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { display: false } }
}
});

    // Leyenda personalizada
    const ley = document.getElementById('leyendaEstados');
    ley.innerHTML = '';
    labels.forEach((l, i) => {
    ley.insertAdjacentHTML('beforeend', `
            <span class="d-flex align-items-center gap-1" style="font-size:.75rem;">
                <span style="width:10px;height:10px;border-radius:50%;background:${colors[i]};display:inline-block;"></span>
                ${l} <strong>(${data[i]})</strong>
            </span>`);
});
}
    buildDonaEstados(INIT_ESTADOS);

    // ── Selector de año → actualiza todo vía API ──────────────────────────────
    document.getElementById('selectorAno').addEventListener('change', async function() {
    const ano = this.value;
    document.getElementById('lblAnoActivo').textContent = ano;

    // Mostrar loading
    document.getElementById('loadingViajes').style.display    = 'flex';
    document.getElementById('loadingFinanciero').style.display = 'flex';

    try {
    const res  = await fetch(`/api/dashboard/resumen?ano=${ano}&mes=${new Date().getMonth() + 1}`);
    const data = await res.json();

    // Actualizar gráficas
    chartViajes.data.datasets[0].data = data.viajesPorMes;
    chartViajes.update();

    chartFinanciero.data.datasets[0].data = data.ingresosPorMes;
    chartFinanciero.data.datasets[1].data = data.gastosPorMes;
    chartFinanciero.update();

    buildDonaEstados(data.viajesPorEstado);

    // Actualizar KPIs
    const fmt = v => '$' + parseFloat(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('kpiViajes').textContent      = data.viajesMes;
    document.getElementById('kpiIngresos').textContent    = fmt(data.ingresosMes);
    document.getElementById('kpiGastoViajes').textContent = fmt(data.gastoViajesMes);
    document.getElementById('kpiGastoGeneral').textContent= fmt(data.gastoGeneralesMes);
    document.getElementById('kpiGastoCamion').textContent = fmt(data.gastoCamionesMes);
    const bal = parseFloat(data.balanceMes);
    const kpiB = document.getElementById('kpiBalance');
    kpiB.textContent = fmt(bal);
    kpiB.className = 'kpi-value ' + (bal >= 0 ? 'balance-positive' : 'balance-negative');

    // Actualizar tabla
    document.getElementById('tabIngresos').textContent   = fmt(data.ingresosMes);
    document.getElementById('tabGastoViaje').textContent = '−' + fmt(data.gastoViajesMes);
    document.getElementById('tabGastoGeneral').textContent='−' + fmt(data.gastoGeneralesMes);
    document.getElementById('tabGastoCamion').textContent= '−' + fmt(data.gastoCamionesMes);
    document.getElementById('tabTotalGastos').textContent= '−' + fmt(data.totalGastosMes);
    const tabB = document.getElementById('tabBalance');
    tabB.textContent  = fmt(bal);
    tabB.className = 'text-end fw-bold fs-5 ' + (bal >= 0 ? 'text-success' : 'text-danger');

} catch(e) { console.error('Error actualizando dashboard', e); }

    document.getElementById('loadingViajes').style.display    = 'none';
    document.getElementById('loadingFinanciero').style.display = 'none';
});

