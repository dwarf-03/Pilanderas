// backend/controllers/statsController.js
// Consultas para el dashboard estadístico

const db = require('../config/db');

const statsController = {

  // GET /api/stats/resumen
async resumen(req, res) {
    try {
    const [[{ total }]]          = await db.execute('SELECT COUNT(*) as total FROM visitantes');
    const [[{ promedio_edad }]]  = await db.execute('SELECT AVG(edad) as promedio_edad FROM visitantes');
    const [[{ promedio_calif }]] = await db.execute('SELECT AVG(calificacion) as promedio_calif FROM visitantes');

    res.json({
        ok   : true,
        datos: {
        total_visitantes : total,
        promedio_edad    : parseFloat(promedio_edad).toFixed(1),
        promedio_calif   : parseFloat(promedio_calif).toFixed(1)
        }
    });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en estadísticas' });
    }
},

  // GET /api/stats/por-tipo
async porTipo(req, res) {
    try {
    const [filas] = await db.execute(`
        SELECT tipo_visitante, COUNT(*) as cantidad
        FROM visitantes
        GROUP BY tipo_visitante
        ORDER BY cantidad DESC
    `);
    res.json({ ok: true, datos: filas });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en estadísticas' });
    }
},

  // GET /api/stats/por-procedencia
async porProcedencia(req, res) {
    try {
    const [filas] = await db.execute(`
        SELECT procedencia, COUNT(*) as cantidad
        FROM visitantes
        GROUP BY procedencia
        ORDER BY cantidad DESC
        LIMIT 10
    `);
    res.json({ ok: true, datos: filas });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en estadísticas' });
    }
},

  // GET /api/stats/por-mes
async porMes(req, res) {
    try {
    const [filas] = await db.execute(`
        SELECT 
        DATE_FORMAT(fecha_visita, '%Y-%m') as mes,
        COUNT(*) as cantidad
        FROM visitantes
        GROUP BY mes
        ORDER BY mes ASC
        LIMIT 12
    `);
    res.json({ ok: true, datos: filas });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en estadísticas' });
    }
},

  // GET /api/stats/por-genero
async porGenero(req, res) {
    try {
    const [filas] = await db.execute(`
        SELECT genero, COUNT(*) as cantidad
        FROM visitantes
        GROUP BY genero
    `);
    res.json({ ok: true, datos: filas });
    } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en estadísticas' });
    }
}

};

module.exports = statsController;