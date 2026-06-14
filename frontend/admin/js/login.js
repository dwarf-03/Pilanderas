// frontend/admin/js/login.js

// Si ya hay un token guardado y válido, redirigir directo al dashboard
const tokenExistente = localStorage.getItem('admin_token');
if (tokenExistente) {
  window.location.href = 'dashboard.html';
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorBox = document.getElementById('errorLogin');

  errorBox.classList.add('d-none');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';

  try {
    const respuesta = await fetch('/api/auth/login', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ email, password })
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
      // Guardar token y datos del admin
      localStorage.setItem('admin_token', resultado.token);
      localStorage.setItem('admin_nombre', resultado.admin.nombre);

      window.location.href = 'dashboard.html';
    } else {
      errorBox.textContent = resultado.mensaje || 'Credenciales incorrectas';
      errorBox.classList.remove('d-none');
      btn.disabled  = false;
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Ingresar';
    }

  } catch (error) {
    errorBox.textContent = 'Error de conexión con el servidor';
    errorBox.classList.remove('d-none');
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Ingresar';
  }
});