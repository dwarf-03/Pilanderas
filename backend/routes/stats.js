// backend/routes/stats.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/statsController');

router.get('/resumen',          controller.resumen);
router.get('/por-tipo',         controller.porTipo);
router.get('/por-procedencia',  controller.porProcedencia);
router.get('/por-mes',          controller.porMes);
router.get('/por-genero',       controller.porGenero);

module.exports = router;