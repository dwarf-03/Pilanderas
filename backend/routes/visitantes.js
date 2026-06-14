// backend/routes/visitantes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/visitantesController');

router.post('/', controller.registrar);   // Registrar visitante
router.get('/',  controller.listar);      // Listar visitantes

module.exports = router;