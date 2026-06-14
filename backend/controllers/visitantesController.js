// backend/controllers/visitantesController.js
// Lógica que se ejecuta cuando llega una petición

const Visitante = require('../models/Visitante');

const visitantesController = {

  // POST /api/visitantes — Registrar nuevo visitante
async registrar(req, res) {
    try {
      // Capturar fecha y hora automáticamente
    const ahora        = new Date();
      const fecha_visita = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
      const hora_visita  = ahora.toTimeString().split(' ')[0]; // HH:MM:SS

      // Unir datos del formulario con fecha/hora automática
    const datos = {
        ...req.body,
        fecha_visita,
        hora_visita
    };

      // Validar campos obligatorios
    const obligatorios = [
        'nombre','edad','procedencia','tipo_visitante',
        'genero','nivel_educativo','medio_transporte','primera_visita'
    ];

    for (const campo of obligatorios) {
        if (!datos[campo] && datos[campo] !== 0) {
        return res.status(400).json({
            ok     : false,
            mensaje: `El campo "${campo}" es obligatorio`
        });
        }
    }

    const resultado = await Visitante.crear(datos);

    res.status(201).json({
        ok      : true,
        mensaje : '✅ Visitante registrado correctamente',
        id      : resultado.insertId
    });

    } catch (error) {
    console.error('Error al registrar visitante:', error);
    res.status(500).json({
        ok     : false,
        mensaje: 'Error interno del servidor'
    });
    }
},

  // GET /api/visitantes — Obtener todos los visitantes
async listar(req, res) {
    try {
    const visitantes = await Visitante.obtenerTodos();
    res.json({
        ok      : true,
        total   : visitantes.length,
        datos   : visitantes
    });
    } catch (error) {
    console.error('Error al listar visitantes:', error);
    res.status(500).json({
        ok     : false,
        mensaje: 'Error interno del servidor'
    });
    }
}

};

module.exports = visitantesController;