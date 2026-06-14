// frontend/js/formulario.js

// ── Botones de selección tipo chip ───────────────
function iniciarGrupo(grupoId, inputId) {
  const botones = document.querySelectorAll(`#${grupoId} .opcion-btn`);
  const input   = document.getElementById(inputId);

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      botones.forEach(b => b.classList.remove('seleccionado'));
      btn.classList.add('seleccionado');
      input.value = btn.dataset.valor;
    });
  });
}

iniciarGrupo('grupo-edad',        'rango_edad');
iniciarGrupo('grupo-procedencia', 'procedencia');
iniciarGrupo('grupo-tipo',        'tipo_visitante');

// ── Calificación con estrellas ────────────────────
const estrellas  = document.querySelectorAll('.estrella');
const inputCalif = document.getElementById('calificacion');

estrellas.forEach(estrella => {
  estrella.addEventListener('click', () => {
    const valor = parseInt(estrella.dataset.valor);
    inputCalif.value = valor;
    actualizarEstrellas(valor);
  });
  estrella.addEventListener('mouseover', () => {
    actualizarEstrellas(parseInt(estrella.dataset.valor));
  });
  estrella.addEventListener('mouseout', () => {
    actualizarEstrellas(parseInt(inputCalif.value) || 0);
  });
});

function actualizarEstrellas(valor) {
  estrellas.forEach((e, i) => e.classList.toggle('activa', i < valor));
}

// ── Envío del formulario ──────────────────────────
document.getElementById('formVisitante').addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    nombre           : document.getElementById('nombre').value.trim(),
    edad             : document.getElementById('rango_edad').value,
    procedencia      : document.getElementById('procedencia').value,
    tipo_visitante   : document.getElementById('tipo_visitante').value,
    genero           : 'prefiero_no_decir',   // simplificado
    nivel_educativo  : 'universitario',        // simplificado
    medio_transporte : 'otro',                 // simplificado
    primera_visita   : 1,
    calificacion     : document.getElementById('calificacion').value || null,
    comentario       : document.getElementById('comentario').value.trim()
  };

  // Validación
  if (!datos.nombre) {
    alert('⚠️ Por favor ingresa tu nombre.'); return;
  }
  if (!datos.edad) {
    alert('⚠️ Por favor selecciona tu rango de edad.'); return;
  }
  if (!datos.procedencia) {
    alert('⚠️ Por favor selecciona tu procedencia.'); return;
  }
  if (!datos.tipo_visitante) {
    alert('⚠️ Por favor selecciona el tipo de visitante.'); return;
  }

  const btn = document.querySelector('.btn-pilanderas');
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrando...';

  try {
    const respuesta = await fetch('/api/visitantes', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      document.getElementById('nombreVisitante').textContent = datos.nombre;
      document.getElementById('fechaRegistro').textContent  =
        new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

      document.getElementById('seccionFormulario').style.display = 'none';
      document.getElementById('seccionContenido').style.display  = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } else {
      alert('❌ Error: ' + resultado.mensaje);
      btn.disabled  = false;
      btn.innerHTML = '<i class="bi bi-send-fill"></i> Registrar visita';
    }

  } catch (error) {
    alert('❌ Error de conexión. Intenta nuevamente.');
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-send-fill"></i> Registrar visita';
  }
});

// ── Volver al formulario ──────────────────────────
function volverFormulario() {
  document.getElementById('seccionContenido').style.display  = 'none';
  document.getElementById('seccionFormulario').style.display = 'block';
  document.getElementById('formVisitante').reset();

  // Limpiar chips seleccionados
  document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  actualizarEstrellas(0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Modal de galería ───────────────────────────────
function abrirModal(src) {
  document.getElementById('imagenModal').src = src;
  document.getElementById('modalImagen').classList.add('activo');
}

function cerrarModal() {
  document.getElementById('modalImagen').classList.remove('activo');
}