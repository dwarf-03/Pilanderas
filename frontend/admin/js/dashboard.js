// frontend/admin/js/dashboard.js
// ═══════════════════════════════════════════════════════════
// PARTE 1 — Estructura base + Filtro de fechas
// Todo el dashboard se calcula a partir de /api/visitantes
// y se recalcula cada vez que cambia el filtro de fechas.
// ═══════════════════════════════════════════════════════════

// ── Verificar sesión ───────────────────────────────
const token = localStorage.getItem('admin_token');
if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('nombreAdmin').textContent =
  '👤 ' + (localStorage.getItem('admin_nombre') || 'Admin');

function cerrarSesion() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_nombre');
  window.location.href = 'login.html';
}

// ── Paleta de colores (paleta wayuu) ────────────────
const colores = ['#A52A2A', '#D4A574', '#3E2723', '#C9A227', '#8B5E3C', '#E1CDAE', '#6B3A1E', '#B5651D'];

// ── Formatear etiquetas (snake_case → Texto Normal) ─
const mapaEtiquetas = {
  'turista_nacional'  : 'Turista Nacional',
  'turista_extranjero': 'Turista Extranjero',
  'estudiante'        : 'Estudiante',
  'investigador'      : 'Investigador',
  'residente_local'   : 'Residente',
  'otro'              : 'Otro',
  'menor_18'          : 'Menor de 18',
  '18_25'             : '18 - 25',
  '26_35'             : '26 - 35',
  '36_45'             : '36 - 45',
  '46_60'             : '46 - 60',
  'mayor_60'          : 'Mayor de 60'
};
function formatearEtiqueta(texto) {
  return mapaEtiquetas[texto] || texto;
}

// ── Estado global ────────────────────────────────────
let TODOS = [];          // todos los visitantes (sin filtrar)
const charts = {};        // instancias de Chart.js por id de canvas

function destruirChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function crearChart(id, config) {
  destruirChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  charts[id] = new Chart(ctx, config);
}

// ── Calcular la MODA de un arreglo de valores ──────
function calcularModa(valores) {
  const conteo = {};
  valores.forEach(val => conteo[val] = (conteo[val] || 0) + 1);

  let max = -1, modaKey = null;
  for (const key in conteo) {
    if (conteo[key] > max) {
      max = conteo[key];
      modaKey = key;
    }
  }
  return { valor: modaKey, cantidad: max };
}

// ═══════════════════════════════════════════════════════════
// CARGA INICIAL
// ═══════════════════════════════════════════════════════════
async function cargarDatos() {
  try {
    const res  = await fetch('/api/visitantes');
    const data = await res.json();
    if (data.ok) {
      TODOS = data.datos;
      aplicarFiltroFechas(); // renderiza con "Todo" por defecto
    }
  } catch (error) {
    console.error('Error cargando visitantes:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// FILTRO DE FECHAS
// ═══════════════════════════════════════════════════════════
function formatearFechaInput(d) {
  return d.toISOString().split('T')[0];
}

function filtroRapido(tipo) {
  const hoy = new Date();
  let desde, hasta = new Date(hoy);

  if (tipo === 'hoy') {
    desde = new Date(hoy);

  } else if (tipo === 'semana') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - hoy.getDay()); // domingo de esta semana

  } else if (tipo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  } else { // 'todo'
    document.getElementById('filtroDesde').value = '';
    document.getElementById('filtroHasta').value = '';
    marcarFiltroActivo('todo');
    aplicarFiltroFechas();
    return;
  }

  document.getElementById('filtroDesde').value = formatearFechaInput(desde);
  document.getElementById('filtroHasta').value = formatearFechaInput(hasta);
  marcarFiltroActivo(tipo);
  aplicarFiltroFechas();
}

function marcarFiltroActivo(tipo) {
  document.querySelectorAll('.filtro-rapido').forEach(b => b.classList.remove('seleccionado'));
  const btn = document.querySelector(`.filtro-rapido[data-filtro="${tipo}"]`);
  if (btn) btn.classList.add('seleccionado');
}

// Si el usuario edita manualmente las fechas, quitar selección de botones rápidos
function limpiarSeleccionRapida() {
  document.querySelectorAll('.filtro-rapido').forEach(b => b.classList.remove('seleccionado'));
}

function aplicarFiltroFechas() {
  const desde = document.getElementById('filtroDesde').value;
  const hasta = document.getElementById('filtroHasta').value;

  let filtrados = TODOS;

  if (desde) {
    filtrados = filtrados.filter(v => v.fecha_visita.split('T')[0] >= desde);
  }
  if (hasta) {
    filtrados = filtrados.filter(v => v.fecha_visita.split('T')[0] <= hasta);
  }

  renderizarDashboard(filtrados);
}

// Detectar edición manual de los inputs de fecha
document.getElementById('filtroDesde').addEventListener('input', limpiarSeleccionRapida);
document.getElementById('filtroHasta').addEventListener('input', limpiarSeleccionRapida);

// ═══════════════════════════════════════════════════════════
// RENDERIZADO PRINCIPAL — se ejecuta cada vez que cambia el filtro
// ═══════════════════════════════════════════════════════════
function renderizarDashboard(v) {

  // ── KPIs básicos ─────────────────────────────────
  document.getElementById('kpiTotal').textContent = v.length;

  const califs = v.filter(x => x.calificacion).map(x => x.calificacion);
  const promCalif = califs.length
    ? (califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1)
    : '—';
  document.getElementById('kpiPromedioCalif').textContent =
    califs.length ? promCalif + ' ★' : '—';

  const hoyStr = new Date().toISOString().split('T')[0];
  document.getElementById('kpiHoy').textContent =
    v.filter(x => x.fecha_visita.startsWith(hoyStr)).length;

  const primeraVisitaCount = v.filter(x => x.primera_visita === 1).length;
  document.getElementById('kpiPrimeraVisita').textContent =
    v.length ? Math.round((primeraVisitaCount / v.length) * 100) + '%' : '—';

// ── Indicadores Generales: Visitas por monumento ──
  // (sistema de un solo monumento — Las Pilanderas)
  document.getElementById('kpiVisitasMonumento').textContent = v.length;

  // ── Indicadores Generales: Predominantes (moda) ───
  if (v.length > 0) {
    const modaEdad        = calcularModa(v.map(x => x.edad));
    const modaProcedencia = calcularModa(v.map(x => x.procedencia));
    const modaTipo        = calcularModa(v.map(x => x.tipo_visitante));

    document.getElementById('kpiGrupoEtarioPred').textContent  = formatearEtiqueta(modaEdad.valor);
    document.getElementById('kpiProcedenciaPred').textContent  = modaProcedencia.valor;
    document.getElementById('kpiTipoPred').textContent         = formatearEtiqueta(modaTipo.valor);
  } else {
    document.getElementById('kpiGrupoEtarioPred').textContent = '—';
    document.getElementById('kpiProcedenciaPred').textContent = '—';
    document.getElementById('kpiTipoPred').textContent        = '—';
  }

  // ── Día y hora pico ──────────────────────────────
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const conteoDias = [0,0,0,0,0,0,0];
  v.forEach(x => conteoDias[new Date(x.fecha_visita).getUTCDay()]++);
  const maxDiaIndex = conteoDias.indexOf(Math.max(...conteoDias));
  document.getElementById('kpiDiaPico').textContent = v.length ? dias[maxDiaIndex] : '—';

  const conteoHoras = Array(24).fill(0);
  v.forEach(x => conteoHoras[parseInt(x.hora_visita.split(':')[0])]++);
  const maxHoraIndex = conteoHoras.indexOf(Math.max(...conteoHoras));
  document.getElementById('kpiHoraPico').textContent = v.length ? `${maxHoraIndex}:00` : '—';

  // ── Gráficas ─────────────────────────────────────
  renderTipo(v);
  renderProcedencia(v);
  renderEdad(v);
  renderPorMes(v);
  renderDiaSemana(conteoDias, dias);
  renderHora(conteoHoras);
  renderCalificacion(v);
  renderPrimeraVisita(v, primeraVisitaCount);

  // ── Tabla ────────────────────────────────────────
  renderTabla(v);
}

// ═══════════════════════════════════════════════════════════
// GRÁFICAS INDIVIDUALES
// ═══════════════════════════════════════════════════════════

function renderTipo(v) {
  const conteo = {};
  v.forEach(x => conteo[x.tipo_visitante] = (conteo[x.tipo_visitante] || 0) + 1);

  crearChart('chartTipo', {
    type: 'doughnut',
    data: {
      labels: Object.keys(conteo).map(formatearEtiqueta),
      datasets: [{ data: Object.values(conteo), backgroundColor: colores }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderProcedencia(v) {
  const conteo = {};
  v.forEach(x => conteo[x.procedencia] = (conteo[x.procedencia] || 0) + 1);

  // ordenar de mayor a menor
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  crearChart('chartProcedencia', {
    type: 'bar',
    data: {
      labels: entradas.map(e => e[0]),
      datasets: [{ label: 'Visitantes', data: entradas.map(e => e[1]), backgroundColor: colores[0] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderEdad(v) {
  const conteo = {};
  v.forEach(x => {
    const edad = x.edad || 'No especificado';
    conteo[edad] = (conteo[edad] || 0) + 1;
  });

  crearChart('chartEdad', {
    type: 'pie',
    data: {
      labels: Object.keys(conteo).map(formatearEtiqueta),
      datasets: [{ data: Object.values(conteo), backgroundColor: colores }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderPorMes(v) {
  const conteo = {};
  v.forEach(x => {
    const mes = x.fecha_visita.split('T')[0].slice(0, 7); // YYYY-MM
    conteo[mes] = (conteo[mes] || 0) + 1;
  });

  const meses = Object.keys(conteo).sort();

  crearChart('chartMes', {
    type: 'line',
    data: {
      labels: meses,
      datasets: [{
        label: 'Visitantes',
        data: meses.map(m => conteo[m]),
        borderColor: colores[0],
        backgroundColor: 'rgba(165,42,42,0.15)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderDiaSemana(conteoDias, dias) {
  crearChart('chartDiaSemana', {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{ label: 'Visitantes', data: conteoDias, backgroundColor: colores[1] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderHora(conteoHoras) {
  const labelsHoras = conteoHoras.map((_, i) => `${i}:00`);

  crearChart('chartHora', {
    type: 'bar',
    data: {
      labels: labelsHoras,
      datasets: [{ label: 'Visitantes', data: conteoHoras, backgroundColor: colores[3] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderCalificacion(v) {
  const conteo = { '1':0, '2':0, '3':0, '4':0, '5':0 };
  v.forEach(x => { if (x.calificacion) conteo[String(x.calificacion)]++; });

  crearChart('chartCalificacion', {
    type: 'bar',
    data: {
      labels: ['★ 1', '★★ 2', '★★★ 3', '★★★★ 4', '★★★★★ 5'],
      datasets: [{ label: 'Cantidad', data: Object.values(conteo), backgroundColor: colores[2] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderPrimeraVisita(v, primeraVez) {
  const recurrente = v.length - primeraVez;

  crearChart('chartPrimeraVisita', {
    type: 'doughnut',
    data: {
      labels: ['Primera visita', 'Visitante recurrente'],
      datasets: [{ data: [primeraVez, recurrente], backgroundColor: [colores[0], colores[4]] }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// ═══════════════════════════════════════════════════════════
// TABLA DE VISITANTES
// ═══════════════════════════════════════════════════════════
function renderTabla(v) {
  const tbody = document.getElementById('tablaVisitantes');
  tbody.innerHTML = '';

  if (v.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay visitantes en el rango seleccionado</td></tr>';
    return;
  }

  // ordenar por fecha/hora descendente y mostrar los últimos 10
  const ordenados = [...v].sort((a, b) => {
    const fa = a.fecha_visita + ' ' + a.hora_visita;
    const fb = b.fecha_visita + ' ' + b.hora_visita;
    return fb.localeCompare(fa);
  });

  ordenados.slice(0, 10).forEach((x, i) => {
    const fecha = new Date(x.fecha_visita).toLocaleDateString('es-CO');
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${x.nombre}</td>
        <td>${formatearEtiqueta(String(x.edad))}</td>
        <td>${x.procedencia}</td>
        <td><span class="badge bg-secondary">${formatearEtiqueta(x.tipo_visitante)}</span></td>
        <td>${x.calificacion ? '★'.repeat(x.calificacion) : '—'}</td>
        <td>${fecha}</td>
        <td>${x.hora_visita}</td>
      </tr>
    `;
  });
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAR
// ═══════════════════════════════════════════════════════════
cargarDatos();