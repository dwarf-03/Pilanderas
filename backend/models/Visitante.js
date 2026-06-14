// backend/models/Visitante.js
// Todas las consultas SQL relacionadas a visitantes

const db = require('../config/db');

const Visitante = {

  // Guardar un nuevo visitante
async crear(datos) {
    const sql = `
    INSERT INTO visitantes 
        (nombre, edad, procedencia, tipo_visitante, genero,
        nivel_educativo, medio_transporte, primera_visita,
        calificacion, comentario, fecha_visita, hora_visita)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
    datos.nombre,
    datos.edad,
    datos.procedencia,
    datos.tipo_visitante,
    datos.genero,
    datos.nivel_educativo,
    datos.medio_transporte,
    datos.primera_visita,
    datos.calificacion,
    datos.comentario,
    datos.fecha_visita,
    datos.hora_visita
    ];
    const [resultado] = await db.execute(sql, valores);
    return resultado;
},

  // Obtener todos los visitantes
async obtenerTodos() {
    const [filas] = await db.execute(
      'SELECT * FROM visitantes ORDER BY created_at DESC'
    );
    return filas;
},

  // Obtener un visitante por ID
async obtenerPorId(id) {
    const [filas] = await db.execute(
      'SELECT * FROM visitantes WHERE id = ?', [id]
    );
    return filas[0];
},

  // Contar total de visitantes
async contarTotal() {
    const [filas] = await db.execute(
    'SELECT COUNT(*) as total FROM visitantes'
    );
    return filas[0].total;
}

};

module.exports = Visitante;