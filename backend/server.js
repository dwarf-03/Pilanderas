// backend/server.js
// Punto de entrada principal del servidor

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── FRONTEND (HTML ESTÁTICO) ─────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

// ── RUTAS API ────────────────────────────────────────────
app.use('/api/visitantes', require('./routes/visitantes'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/auth', require('./routes/auth'));

// ── RUTA DE PRUEBA ───────────────────────────────────────
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        mensaje: '🏛️ Servidor Las Pilanderas funcionando correctamente',
        fecha: new Date().toLocaleString('es-CO')
    });
});

// ── FRONTEND FALLBACK (EXPRESS 5) ────────────────────────
app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── INICIAR SERVIDOR ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});