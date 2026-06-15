// frontend/admin/js/dashboard.js

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
const colores = ['#A52A2A','#D4A574','#3E2723','#C9A227','#8B5E3C','#E1CDAE','#6B3A1E','#B5651D'];

// ── Paleta para cruce dinámico ──────────────────────
const PALETA_CRUCE = [
  '#7F77DD','#1D9E75','#D85A30','#D4537E',
  '#378ADD','#639922','#BA7517','#534AB7'
];

// ── Formatear etiquetas ─────────────────────────────
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

// ── Puntos medios de rangos de edad ─────────────────
const EDAD_PUNTO_MEDIO = {
  'menor_18' : 15,
  '18_25'    : 21.5,
  '26_35'    : 30.5,
  '36_45'    : 40.5,
  '46_60'    : 53,
  'mayor_60' : 65
};

// ── Órdenes personalizados ──────────────────────────
const ORDEN_EDAD  = ['menor_18','18_25','26_35','36_45','46_60','mayor_60'];
const ORDEN_CALIF = ['5','4','3','2','1'];
const ORDEN_SINO  = ['1','0'];

// ── Variables disponibles para cruce dinámico ───────
const VARS_CRUCE = [
  {
    key   : 'edad',
    label : 'Edad',
    orden : ORDEN_EDAD,
    fmt   : formatearEtiqueta
  },
  {
    key   : 'procedencia',
    label : 'Procedencia',
    orden : null,
    fmt   : t => t
  },
  {
    key   : 'tipo_visitante',
    label : 'Tipo',
    orden : null,
    fmt   : formatearEtiqueta
  },
  {
    key   : 'calificacion',
    label : 'Calificación',
    orden : ORDEN_CALIF,
    fmt   : t => '★'.repeat(Number(t)) + ` (${t})`
  },
  {
    key   : 'primera_visita',
    label : 'Primera Visita',
    orden : ['1','0'],
    fmt   : t => t === '1' ? 'Sí' : 'No'
  },
];

// ── Estado del selector dinámico ────────────────────
let varCruceX           = 'edad';
let varCruceY           = 'procedencia';
let chartCruce          = null;
let visitantesFiltrados = [];

// ── Estado global ────────────────────────────────────
let TODOS = [];
const charts = {};

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

// ── Estadísticas ─────────────────────────────────────
function calcularModa(valores) {
  const conteo = {};
  valores.forEach(val => conteo[val] = (conteo[val] || 0) + 1);
  let max = -1, modaKey = null;
  for (const key in conteo) {
    if (conteo[key] > max) { max = conteo[key]; modaKey = key; }
  }
  return { valor: modaKey, cantidad: max };
}

function calcularMedia(valores) {
  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function calcularMediana(valores) {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? (ordenados[mid - 1] + ordenados[mid]) / 2
    : ordenados[mid];
}

// ── Tabla cruzada ────────────────────────────────────
function tablaCruzada(datos, campoX, campoY) {
  const filas    = [...new Set(datos.map(x => x[campoX]).filter(Boolean))];
  const columnas = [...new Set(datos.map(x => x[campoY]).filter(Boolean))];
  const matriz   = {};
  filas.forEach(fila => {
    matriz[fila] = {};
    columnas.forEach(col => { matriz[fila][col] = 0; });
  });
  datos.forEach(reg => {
    if (reg[campoX] && reg[campoY] && matriz[reg[campoX]]) {
      matriz[reg[campoX]][reg[campoY]]++;
    }
  });
  return { filas, columnas, matriz };
}

// ── Tabla de frecuencia ──────────────────────────────
function generarTablaFrecuencia(valores, tbodyId, opciones = {}) {
  const {
    ordenPersonalizado      = null,
    formatear               = formatearEtiqueta,
    etiquetasPersonalizadas = null
  } = opciones;

  const tbody = document.getElementById(tbodyId);
  const total = valores.length;

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>';
    return;
  }

  const conteo = {};
  valores.forEach(v => conteo[v] = (conteo[v] || 0) + 1);

  let claves;
  if (ordenPersonalizado) {
    claves = ordenPersonalizado.filter(k => conteo[k] !== undefined);
    Object.keys(conteo).forEach(k => { if (!claves.includes(k)) claves.push(k); });
  } else {
    claves = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]);
  }

  tbody.innerHTML = '';
  claves.forEach(k => {
    const fi  = conteo[k];
    const fr  = fi / total;
    const pct = (fr * 100).toFixed(1);
    const etiqueta = etiquetasPersonalizadas
      ? (etiquetasPersonalizadas[k] || formatear(k))
      : formatear(k);
    tbody.innerHTML += `
      <tr>
        <td>${etiqueta}</td>
        <td class="text-center">${fi}</td>
        <td class="text-center">${fr.toFixed(2)}</td>
        <td class="text-center">${pct}%</td>
      </tr>`;
  });
  tbody.innerHTML += `
    <tr class="fila-total">
      <td>Total</td>
      <td class="text-center">${total}</td>
      <td class="text-center">1.00</td>
      <td class="text-center">100%</td>
    </tr>`;
}

// ════════════════════════════════════════════════════
// SELECTOR DINÁMICO DE VARIABLES
// ════════════════════════════════════════════════════
function valoresDe(defVar, datos) {
  if (defVar.orden) {
    return defVar.orden.filter(v =>
      datos.some(d => String(d[defVar.key]) === v)
    );
  }
  return [...new Set(datos.map(d => String(d[defVar.key])))].filter(Boolean).sort();
}

function pintarBotonesVariable(contenedorId, seleccionada, excluida, callback) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = '';
  VARS_CRUCE.forEach(v => {
    const b = document.createElement('button');
    b.className = 'btn-variable' + (v.key === seleccionada ? ' activo' : '');
    b.textContent = v.label;
    if (v.key === excluida) b.disabled = true;
    b.onclick = () => { callback(v.key); renderizarCruceDinamico(); };
    cont.appendChild(b);
  });
}

function renderizarCruceDinamico() {
  const datos = visitantesFiltrados;

  pintarBotonesVariable('btnVarX', varCruceX, varCruceY, k => { varCruceX = k; });
  pintarBotonesVariable('btnVarY', varCruceY, varCruceX, k => { varCruceY = k; });

  const defX = VARS_CRUCE.find(v => v.key === varCruceX);
  const defY = VARS_CRUCE.find(v => v.key === varCruceY);

  const titulo = document.getElementById('tituloCruceVar');
  if (titulo) titulo.textContent = defX.label + ' vs ' + defY.label;

  const valsX = valoresDe(defX, datos);
  const valsY = valoresDe(defY, datos);

  const datasets = valsY.map((vy, i) => ({
    label           : defY.fmt(vy),
    data            : valsX.map(vx =>
      datos.filter(d =>
        String(d[defX.key]) === vx && String(d[defY.key]) === vy
      ).length
    ),
    backgroundColor : PALETA_CRUCE[i % PALETA_CRUCE.length] + 'CC',
    borderColor     : PALETA_CRUCE[i % PALETA_CRUCE.length],
    borderWidth     : 1,
  }));

  if (chartCruce) { chartCruce.destroy(); chartCruce = null; }
  const ctx = document.getElementById('chartCruceDinamico');
  if (ctx) {
    chartCruce = new Chart(ctx, {
      type : 'bar',
      data : { labels: valsX.map(defX.fmt), datasets },
      options: {
        responsive : true,
        plugins    : { legend: { display: false } },
        scales     : {
          x: { title: { display: true, text: defX.label } },
          y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'Visitantes' } }
        }
      }
    });
  }

  const leg = document.getElementById('legendaCruceDinamico');
  if (leg) {
    leg.innerHTML = datasets.map((d, i) => `
      <span style="display:flex;align-items:center;gap:5px;">
        <span style="width:10px;height:10px;border-radius:2px;
          background:${PALETA_CRUCE[i % PALETA_CRUCE.length]};
          flex-shrink:0;display:inline-block;"></span>
        ${d.label}
      </span>`).join('');
  }
}

// ════════════════════════════════════════════════════
// CARGA INICIAL
// ════════════════════════════════════════════════════
async function cargarDatos() {
  try {
    const res  = await fetch('/api/visitantes');
    const data = await res.json();
    if (data.ok) {
      TODOS = data.datos;
      aplicarFiltroFechas();
    }
  } catch (error) {
    console.error('Error cargando visitantes:', error);
  }
}

// ════════════════════════════════════════════════════
// FILTRO DE FECHAS
// ════════════════════════════════════════════════════
function formatearFechaInput(d) {
  return d.toISOString().split('T')[0];
}

function filtroRapido(tipo) {
  const hoy = new Date();
  let desde;

  if (tipo === 'hoy') {
    desde = new Date(hoy);
  } else if (tipo === 'semana') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - hoy.getDay());
  } else if (tipo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else {
    document.getElementById('filtroDesde').value = '';
    document.getElementById('filtroHasta').value = '';
    marcarFiltroActivo('todo');
    aplicarFiltroFechas();
    return;
  }

  document.getElementById('filtroDesde').value = formatearFechaInput(desde);
  document.getElementById('filtroHasta').value = formatearFechaInput(new Date(hoy));
  marcarFiltroActivo(tipo);
  aplicarFiltroFechas();
}

function marcarFiltroActivo(tipo) {
  document.querySelectorAll('.filtro-rapido').forEach(b => b.classList.remove('seleccionado'));
  const btn = document.querySelector(`.filtro-rapido[data-filtro="${tipo}"]`);
  if (btn) btn.classList.add('seleccionado');
}

function limpiarSeleccionRapida() {
  document.querySelectorAll('.filtro-rapido').forEach(b => b.classList.remove('seleccionado'));
}

function aplicarFiltroFechas() {
  const desde = document.getElementById('filtroDesde').value;
  const hasta = document.getElementById('filtroHasta').value;
  let filtrados = TODOS;
  if (desde) filtrados = filtrados.filter(v => v.fecha_visita.split('T')[0] >= desde);
  if (hasta) filtrados = filtrados.filter(v => v.fecha_visita.split('T')[0] <= hasta);
  renderizarDashboard(filtrados);
}

document.getElementById('filtroDesde').addEventListener('input', limpiarSeleccionRapida);
document.getElementById('filtroHasta').addEventListener('input', limpiarSeleccionRapida);

// ════════════════════════════════════════════════════
// RENDERIZADO PRINCIPAL
// ════════════════════════════════════════════════════
function renderizarDashboard(v) {

  // ── KPIs ─────────────────────────────────────────
  document.getElementById('kpiTotal').textContent = v.length;
  document.getElementById('kpiVisitasMonumento').textContent = v.length;

  const califs = v.filter(x => x.calificacion).map(x => x.calificacion);
  document.getElementById('kpiPromedioCalif').textContent = califs.length
    ? (califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1) + ' ★'
    : '—';

  const hoyStr = new Date().toISOString().split('T')[0];
  document.getElementById('kpiHoy').textContent =
    v.filter(x => x.fecha_visita.startsWith(hoyStr)).length;

  const primeraVisitaCount = v.filter(x => x.primera_visita === 1).length;
  document.getElementById('kpiPrimeraVisita').textContent =
    v.length ? Math.round((primeraVisitaCount / v.length) * 100) + '%' : '—';

  if (v.length > 0) {
    const modaEdad        = calcularModa(v.map(x => x.edad));
    const modaProcedencia = calcularModa(v.map(x => x.procedencia));
    const modaTipo        = calcularModa(v.map(x => x.tipo_visitante));
    document.getElementById('kpiGrupoEtarioPred').textContent = formatearEtiqueta(modaEdad.valor);
    document.getElementById('kpiProcedenciaPred').textContent = modaProcedencia.valor;
    document.getElementById('kpiTipoPred').textContent        = formatearEtiqueta(modaTipo.valor);
  } else {
    document.getElementById('kpiGrupoEtarioPred').textContent = '—';
    document.getElementById('kpiProcedenciaPred').textContent = '—';
    document.getElementById('kpiTipoPred').textContent        = '—';
  }

  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const conteoDias = [0,0,0,0,0,0,0];
  v.forEach(x => conteoDias[new Date(x.fecha_visita).getUTCDay()]++);
  const maxDiaIndex = conteoDias.indexOf(Math.max(...conteoDias));
  document.getElementById('kpiDiaPico').textContent = v.length ? dias[maxDiaIndex] : '—';

  const conteoHoras = Array(24).fill(0);
  v.forEach(x => conteoHoras[parseInt(x.hora_visita.split(':')[0])]++);
  const maxHoraIndex = conteoHoras.indexOf(Math.max(...conteoHoras));
  document.getElementById('kpiHoraPico').textContent = v.length ? `${maxHoraIndex}:00` : '—';

  // ── Gráficas base ─────────────────────────────────
  renderTipo(v);
  renderProcedencia(v);
  renderEdad(v);
  renderPorMes(v);
  renderDiaSemana(conteoDias, dias);
  renderHora(conteoHoras);
  renderCalificacion(v);
  renderPrimeraVisita(v, primeraVisitaCount);
  renderHistogramaEdad(v);

  // ── Medidas estadísticas ──────────────────────────
  const valoresCalif = v.filter(x => x.calificacion).map(x => x.calificacion);
  if (valoresCalif.length) {
    document.getElementById('medCalifMedia').textContent   = calcularMedia(valoresCalif).toFixed(2);
    document.getElementById('medCalifMediana').textContent = calcularMediana(valoresCalif).toFixed(1);
    const modaCalif = calcularModa(valoresCalif.map(String));
    document.getElementById('medCalifModa').textContent    = '★'.repeat(Number(modaCalif.valor));
  } else {
    document.getElementById('medCalifMedia').textContent   = '—';
    document.getElementById('medCalifMediana').textContent = '—';
    document.getElementById('medCalifModa').textContent    = '—';
  }

  const valoresEdad = v.map(x => EDAD_PUNTO_MEDIO[x.edad]).filter(x => x !== undefined);
  if (valoresEdad.length) {
    document.getElementById('medEdadMedia').textContent   = calcularMedia(valoresEdad).toFixed(1) + ' años';
    document.getElementById('medEdadMediana').textContent = calcularMediana(valoresEdad).toFixed(1) + ' años';
    const modaEdadRango = calcularModa(v.map(x => x.edad));
    document.getElementById('medEdadModa').textContent    = formatearEtiqueta(modaEdadRango.valor);
  } else {
    document.getElementById('medEdadMedia').textContent   = '—';
    document.getElementById('medEdadMediana').textContent = '—';
    document.getElementById('medEdadModa').textContent    = '—';
  }

  // ── Selector dinámico ─────────────────────────────
  visitantesFiltrados = v;
  renderizarCruceDinamico();

  // ── Gráficos comparativos fijos ───────────────────
  renderEdadProcedencia(v);
  renderEdadTipo(v);
  renderProcedenciaTipo(v);
  renderCalificacionEdad(v);
  renderCalificacionTipo(v);

  // ── Tablas de frecuencia ──────────────────────────
  generarTablaFrecuencia(
    v.map(x => x.edad), 'tablaFrecEdad',
    { ordenPersonalizado: ORDEN_EDAD }
  );
  generarTablaFrecuencia(
    v.map(x => x.procedencia), 'tablaFrecProcedencia',
    { formatear: t => t }
  );
  generarTablaFrecuencia(
    v.map(x => x.tipo_visitante), 'tablaFrecTipo'
  );
  generarTablaFrecuencia(
    v.filter(x => x.calificacion).map(x => String(x.calificacion)), 'tablaFrecCalificacion',
    { ordenPersonalizado: ORDEN_CALIF, formatear: t => '★'.repeat(Number(t)) + ` (${t})` }
  );
  generarTablaFrecuencia(
    v.map(x => String(x.primera_visita)), 'tablaFrecPrimeraVisita',
    { ordenPersonalizado: ORDEN_SINO, etiquetasPersonalizadas: { '1': 'Sí', '0': 'No' } }
  );

  // ── Tabla de visitantes ───────────────────────────
  renderTabla(v);
}

// ════════════════════════════════════════════════════
// GRÁFICAS INDIVIDUALES
// ════════════════════════════════════════════════════
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
    const mes = x.fecha_visita.split('T')[0].slice(0, 7);
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
  crearChart('chartHora', {
    type: 'bar',
    data: {
      labels: conteoHoras.map((_, i) => `${i}:00`),
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
  const conteo = { '1':0,'2':0,'3':0,'4':0,'5':0 };
  v.forEach(x => { if (x.calificacion) conteo[String(x.calificacion)]++; });
  crearChart('chartCalificacion', {
    type: 'bar',
    data: {
      labels: ['★ 1','★★ 2','★★★ 3','★★★★ 4','★★★★★ 5'],
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
  crearChart('chartPrimeraVisita', {
    type: 'doughnut',
    data: {
      labels: ['Primera visita','Visitante recurrente'],
      datasets: [{ data: [primeraVez, v.length - primeraVez], backgroundColor: [colores[0], colores[4]] }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderHistogramaEdad(v) {
  const conteo = {};
  ORDEN_EDAD.forEach(k => conteo[k] = 0);
  v.forEach(x => { if (conteo[x.edad] !== undefined) conteo[x.edad]++; });
  crearChart('chartHistogramaEdad', {
    type: 'bar',
    data: {
      labels: ORDEN_EDAD.map(formatearEtiqueta),
      datasets: [{
        label: 'Visitantes',
        data: ORDEN_EDAD.map(k => conteo[k]),
        backgroundColor: colores[5],
        borderColor: '#FFFDF8',
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'Frecuencia' } },
        x: { title: { display: true, text: 'Rango de edad' } }
      }
    }
  });
}

// ── Gráficos comparativos fijos ──────────────────────
function renderEdadProcedencia(v) {
  const { filas, columnas, matriz } = tablaCruzada(v, 'edad', 'procedencia');
  crearChart('chartEdadProcedencia', {
    type: 'bar',
    data: {
      labels: filas.map(formatearEtiqueta),
      datasets: columnas.map((c, i) => ({
        label: c,
        data: filas.map(f => matriz[f][c]),
        backgroundColor: colores[i % colores.length]
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

function renderEdadTipo(v) {
  const { filas, columnas, matriz } = tablaCruzada(v, 'edad', 'tipo_visitante');
  crearChart('chartEdadTipo', {
    type: 'bar',
    data: {
      labels: filas.map(formatearEtiqueta),
      datasets: columnas.map((c, i) => ({
        label: formatearEtiqueta(c),
        data: filas.map(f => matriz[f][c]),
        backgroundColor: colores[i % colores.length]
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

function renderProcedenciaTipo(v) {
  const { filas, columnas, matriz } = tablaCruzada(v, 'procedencia', 'tipo_visitante');
  crearChart('chartProcedenciaTipo', {
    type: 'bar',
    data: {
      labels: filas,
      datasets: columnas.map((c, i) => ({
        label: formatearEtiqueta(c),
        data: filas.map(f => matriz[f][c]),
        backgroundColor: colores[i % colores.length]
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderCalificacionEdad(v) {
  const datos = v.filter(x => x.calificacion);
  const { filas, columnas, matriz } = tablaCruzada(datos, 'edad', 'calificacion');
  filas.sort((a, b) => ORDEN_EDAD.indexOf(a) - ORDEN_EDAD.indexOf(b));
  crearChart('chartCalificacionEdad', {
    type: 'bar',
    data: {
      labels: filas.map(formatearEtiqueta),
      datasets: columnas.map((c, i) => ({
        label: '★'.repeat(Number(c)),
        data: filas.map(f => matriz[f][c]),
        backgroundColor: colores[i % colores.length]
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

function renderCalificacionTipo(v) {
  const datos = v.filter(x => x.calificacion);
  const { filas, columnas, matriz } = tablaCruzada(datos, 'tipo_visitante', 'calificacion');
  crearChart('chartCalificacionTipo', {
    type: 'bar',
    data: {
      labels: filas.map(formatearEtiqueta),
      datasets: columnas.map((c, i) => ({
        label: '★'.repeat(Number(c)),
        data: filas.map(f => matriz[f][c]),
        backgroundColor: colores[i % colores.length]
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

// ════════════════════════════════════════════════════
// TABLA DE VISITANTES
// ════════════════════════════════════════════════════
function renderTabla(v) {
  const tbody = document.getElementById('tablaVisitantes');
  tbody.innerHTML = '';
  if (v.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay visitantes en el rango seleccionado</td></tr>';
    return;
  }
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
      </tr>`;
  });
}

// ════════════════════════════════════════════════════
// EXPORTACIÓN — Excel y PDF con selector de secciones
// ════════════════════════════════════════════════════

const SECCIONES_EXCEL = [
  { id: 'visitantes',   label: 'Lista de visitantes' },
  { id: 'frecEdad',     label: 'Tabla de frecuencia — Edad' },
  { id: 'frecProcedencia', label: 'Tabla de frecuencia — Procedencia' },
  { id: 'frecTipo',     label: 'Tabla de frecuencia — Tipo de visitante' },
  { id: 'frecCalif',    label: 'Tabla de frecuencia — Calificación' },
  { id: 'frecPrimera',  label: 'Tabla de frecuencia — Primera visita' },
  { id: 'medidas',      label: 'Medidas estadísticas' },
];

const SECCIONES_PDF = [
  { id: 'kpis',         label: 'Indicadores (KPIs)' },
  { id: 'medidas',      label: 'Medidas estadísticas' },
  { id: 'frecEdad',     label: 'Tabla de frecuencia — Edad' },
  { id: 'frecProcedencia', label: 'Tabla de frecuencia — Procedencia' },
  { id: 'frecTipo',     label: 'Tabla de frecuencia — Tipo de visitante' },
  { id: 'frecCalif',    label: 'Tabla de frecuencia — Calificación' },
  { id: 'frecPrimera',  label: 'Tabla de frecuencia — Primera visita' },
  { id: 'visitantes',   label: 'Lista de visitantes' },
];

let modoExportar = 'excel';

function abrirModalExportar(modo) {
  modoExportar = modo;
  const esExcel = modo === 'excel';

  document.getElementById('modalExportarIcono').className =
    'bi ' + (esExcel ? 'bi-file-earmark-excel' : 'bi-file-earmark-pdf');
  document.getElementById('modalExportarTitulo').textContent =
    ' Exportar a ' + (esExcel ? 'Excel' : 'PDF');
  document.getElementById('iconoConfirmar').className =
    'bi ' + (esExcel ? 'bi-download' : 'bi-download');
  document.getElementById('textoConfirmar').textContent =
    'Descargar ' + (esExcel ? '.xlsx' : '.pdf');

  const secciones = esExcel ? SECCIONES_EXCEL : SECCIONES_PDF;
  const cont = document.getElementById('opcionesExportar');
  cont.innerHTML = '';

  secciones.forEach(s => {
    cont.innerHTML += `
      <div class="form-check">
        <input class="form-check-input" type="checkbox"
               id="chk_${s.id}" value="${s.id}" checked
               style="accent-color:var(--color-secundario);">
        <label class="form-check-label" for="chk_${s.id}">${s.label}</label>
      </div>`;
  });

  document.getElementById('btnConfirmarExportar').onclick = () => {
    const seleccionadas = [...document.querySelectorAll('#opcionesExportar input:checked')]
      .map(i => i.value);
    if (!seleccionadas.length) { alert('Selecciona al menos una sección.'); return; }
    bootstrap.Modal.getInstance(document.getElementById('modalExportar')).hide();
    if (esExcel) exportarExcel(seleccionadas);
    else         exportarPDF(seleccionadas);
  };

  new bootstrap.Modal(document.getElementById('modalExportar')).show();
}

// ── Helpers de frecuencia ────────────────────────────
function calcularFrecuencia(valores, orden = null, fmtKey = null, etiqPersonalizadas = null) {
  const conteo = {};
  valores.forEach(v => conteo[v] = (conteo[v] || 0) + 1);
  const total = valores.length;
  let claves = orden
    ? orden.filter(k => conteo[k] !== undefined)
    : Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]);
  Object.keys(conteo).forEach(k => { if (!claves.includes(k)) claves.push(k); });

  const filas = claves.map(k => {
    const fi  = conteo[k];
    const fr  = fi / total;
    let etiq = k;
    if (etiqPersonalizadas && etiqPersonalizadas[k]) etiq = etiqPersonalizadas[k];
    else if (fmtKey) etiq = fmtKey(k);
    return [etiq, fi, parseFloat(fr.toFixed(2)), parseFloat((fr * 100).toFixed(1)) + '%'];
  });
  filas.push(['Total', total, 1.00, '100%']);
  return filas;
}

// ════════════════════════════════════════════════════
// EXPORTAR EXCEL
// ════════════════════════════════════════════════════
function exportarExcel(secciones) {
  const wb = XLSX.utils.book_new();
  const v  = visitantesFiltrados;

  if (secciones.includes('visitantes')) {
    const encabezado = [['#','Nombre','Edad','Procedencia','Tipo','Calificación','Fecha','Hora']];
    const filas = v.map((x, i) => [
      i + 1,
      x.nombre,
      formatearEtiqueta(String(x.edad)),
      x.procedencia,
      formatearEtiqueta(x.tipo_visitante),
      x.calificacion || '—',
      new Date(x.fecha_visita).toLocaleDateString('es-CO'),
      x.hora_visita
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...filas]);
    ws['!cols'] = [4,20,14,16,18,12,12,10].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Visitantes');
  }

  const agregarHojaFrecuencia = (nombre, valores, orden, fmt, etiqPersonalizadas) => {
    const enc  = [['Categoría','Fi','Fr','%']];
    const filas = calcularFrecuencia(valores, orden, fmt, etiqPersonalizadas);
    const ws   = XLSX.utils.aoa_to_sheet([...enc, ...filas]);
    ws['!cols'] = [{ wch: 22 },{ wch: 6 },{ wch: 6 },{ wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  };

  if (secciones.includes('frecEdad'))
    agregarHojaFrecuencia('Frec. Edad', v.map(x => x.edad), ORDEN_EDAD, formatearEtiqueta, null);

  if (secciones.includes('frecProcedencia'))
    agregarHojaFrecuencia('Frec. Procedencia', v.map(x => x.procedencia), null, t => t, null);

  if (secciones.includes('frecTipo'))
    agregarHojaFrecuencia('Frec. Tipo', v.map(x => x.tipo_visitante), null, formatearEtiqueta, null);

  if (secciones.includes('frecCalif'))
    agregarHojaFrecuencia('Frec. Calificación',
      v.filter(x => x.calificacion).map(x => String(x.calificacion)),
      ORDEN_CALIF,
      t => '★'.repeat(Number(t)) + ` (${t})`,
      null
    );

  if (secciones.includes('frecPrimera'))
    agregarHojaFrecuencia('Frec. Primera Visita',
      v.map(x => String(x.primera_visita)),
      ORDEN_SINO, null, { '1': 'Sí', '0': 'No' }
    );

  if (secciones.includes('medidas')) {
    const valCalif = v.filter(x => x.calificacion).map(x => x.calificacion);
    const valEdad  = v.map(x => EDAD_PUNTO_MEDIO[x.edad]).filter(Boolean);
    const modaCalif = valCalif.length ? calcularModa(valCalif.map(String)) : { valor: '—' };
    const modaEdad  = v.length ? calcularModa(v.map(x => x.edad)) : { valor: '—' };

    const filas = [
      ['Variable','Media','Mediana','Moda'],
      [
        'Calificación',
        valCalif.length ? parseFloat(calcularMedia(valCalif).toFixed(2)) : '—',
        valCalif.length ? parseFloat(calcularMediana(valCalif).toFixed(1)) : '—',
        valCalif.length ? '★'.repeat(Number(modaCalif.valor)) : '—'
      ],
      [
        'Edad (punto medio)',
        valEdad.length ? parseFloat(calcularMedia(valEdad).toFixed(1)) : '—',
        valEdad.length ? parseFloat(calcularMediana(valEdad).toFixed(1)) : '—',
        valEdad.length ? formatearEtiqueta(modaEdad.valor) : '—'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws['!cols'] = [{ wch: 22 },{ wch: 10 },{ wch: 10 },{ wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Medidas Estadísticas');
  }

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `pilanderas_dashboard_${fecha}.xlsx`);
}

// ════════════════════════════════════════════════════
// EXPORTAR PDF
// ════════════════════════════════════════════════════
function exportarPDF(secciones) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const v   = visitantesFiltrados;
  const fecha = new Date().toLocaleDateString('es-CO');
  let y = 20;

  // ── encabezado ───────────────────────────────────
  doc.setFillColor(90, 46, 27);
  doc.rect(0, 0, 210, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LAS PILANDERAS — Dashboard Estadístico', 14, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Generado: ' + fecha, 160, 9);
  doc.setTextColor(0, 0, 0);
  y = 22;

  const titulo = (texto) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 46, 27);
    doc.text(texto, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  const tabla = (head, body) => {
    doc.autoTable({
      startY       : y,
      head         : [head],
      body         : body,
      margin       : { left: 14, right: 14 },
      styles       : { fontSize: 8, cellPadding: 2 },
      headStyles   : { fillColor: [90, 46, 27], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 253, 248] },
      didDrawPage  : () => { y = doc.lastAutoTable.finalY + 8; }
    });
    y = doc.lastAutoTable.finalY + 8;
  };

  // ── KPIs ─────────────────────────────────────────
  if (secciones.includes('kpis')) {
    titulo('Indicadores Generales');
    const califs = v.filter(x => x.calificacion).map(x => x.calificacion);
    const prom   = califs.length
      ? (califs.reduce((a,b) => a+b, 0) / califs.length).toFixed(1)
      : '—';
    const pv = v.filter(x => x.primera_visita === 1).length;
    const modaEdad = v.length ? calcularModa(v.map(x => x.edad)) : { valor: '—' };
    const modaProc = v.length ? calcularModa(v.map(x => x.procedencia)) : { valor: '—' };
    const modaTipo = v.length ? calcularModa(v.map(x => x.tipo_visitante)) : { valor: '—' };

    tabla(
      ['Indicador', 'Valor'],
      [
        ['Total de visitas',                 v.length],
        ['Calificación promedio',            prom + (califs.length ? ' ★' : '')],
        ['% Primera visita',                 v.length ? Math.round((pv/v.length)*100) + '%' : '—'],
        ['Grupo etario predominante',        formatearEtiqueta(modaEdad.valor)],
        ['Procedencia predominante',         modaProc.valor],
        ['Tipo de visitante predominante',   formatearEtiqueta(modaTipo.valor)],
      ]
    );
  }

  // ── Medidas estadísticas ──────────────────────────
  if (secciones.includes('medidas')) {
    titulo('Medidas Estadísticas');
    const valCalif = v.filter(x => x.calificacion).map(x => x.calificacion);
    const valEdad  = v.map(x => EDAD_PUNTO_MEDIO[x.edad]).filter(Boolean);
    const modaCalif = valCalif.length ? calcularModa(valCalif.map(String)) : { valor: null };
    const modaEdad  = v.length ? calcularModa(v.map(x => x.edad)) : { valor: null };

    tabla(
      ['Variable', 'Media', 'Mediana', 'Moda'],
      [
        [
          'Calificación',
          valCalif.length ? calcularMedia(valCalif).toFixed(2) : '—',
          valCalif.length ? calcularMediana(valCalif).toFixed(1) : '—',
          modaCalif.valor ? '★'.repeat(Number(modaCalif.valor)) : '—'
        ],
        [
          'Edad (punto medio)',
          valEdad.length ? calcularMedia(valEdad).toFixed(1) + ' años' : '—',
          valEdad.length ? calcularMediana(valEdad).toFixed(1) + ' años' : '—',
          modaEdad.valor ? formatearEtiqueta(modaEdad.valor) : '—'
        ]
      ]
    );
  }

  // ── Tablas de frecuencia ──────────────────────────
  const agregarFrecPDF = (tituloTexto, valores, orden, fmt, etiqPersonalizadas) => {
    titulo(tituloTexto);
    const filas = calcularFrecuencia(valores, orden, fmt, etiqPersonalizadas);
    tabla(['Categoría', 'Fi', 'Fr', '%'], filas);
  };

  if (secciones.includes('frecEdad'))
    agregarFrecPDF('Tabla de Frecuencia — Edad',
      v.map(x => x.edad), ORDEN_EDAD, formatearEtiqueta, null);

  if (secciones.includes('frecProcedencia'))
    agregarFrecPDF('Tabla de Frecuencia — Procedencia',
      v.map(x => x.procedencia), null, t => t, null);

  if (secciones.includes('frecTipo'))
    agregarFrecPDF('Tabla de Frecuencia — Tipo de Visitante',
      v.map(x => x.tipo_visitante), null, formatearEtiqueta, null);

  if (secciones.includes('frecCalif'))
    agregarFrecPDF('Tabla de Frecuencia — Calificación',
      v.filter(x => x.calificacion).map(x => String(x.calificacion)),
      ORDEN_CALIF, t => '★'.repeat(Number(t)) + ` (${t})`, null);

  if (secciones.includes('frecPrimera'))
    agregarFrecPDF('Tabla de Frecuencia — Primera Visita',
      v.map(x => String(x.primera_visita)),
      ORDEN_SINO, null, { '1': 'Sí', '0': 'No' });

  // ── Lista de visitantes ───────────────────────────
  if (secciones.includes('visitantes')) {
    titulo('Últimos Visitantes Registrados');
    const ordenados = [...v].sort((a, b) =>
      (b.fecha_visita + b.hora_visita).localeCompare(a.fecha_visita + a.hora_visita)
    );
    tabla(
      ['#','Nombre','Edad','Procedencia','Tipo','Calif.','Fecha'],
      ordenados.slice(0, 50).map((x, i) => [
        i + 1,
        x.nombre,
        formatearEtiqueta(String(x.edad)),
        x.procedencia,
        formatearEtiqueta(x.tipo_visitante),
        x.calificacion ? '★'.repeat(x.calificacion) : '—',
        new Date(x.fecha_visita).toLocaleDateString('es-CO')
      ])
    );
  }

  // ── pie de página en cada hoja ────────────────────
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Monumento Las Pilanderas — Riohacha | Página ${p} de ${totalPaginas}`,
      14, 290
    );
  }

  doc.save(`pilanderas_dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ════════════════════════════════════════════════════
// INICIALIZAR
// ════════════════════════════════════════════════════
cargarDatos();