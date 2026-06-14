// backend/server.js
// Punto de entrada principal del servidor

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas API ────────────────────────────────────────────
app.use('/api/visitantes', require('./routes/visitantes'));
app.use('/api/stats',      require('./routes/stats'));
app.use('/api/auth',       require('./routes/auth'));

// ── Ruta de prueba ───────────────────────────────────────
app.get('/api/test', (req, res) => {
res.json({
    status  : 'ok',
    mensaje : '🏛️ Servidor Las Pilanderas funcionando correctamente',
    fecha   : new Date().toLocaleString('es-CO')
});
});

// ── Iniciar servidor ─────────────────────────────────────
app.listen(PORT, () => {
console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});