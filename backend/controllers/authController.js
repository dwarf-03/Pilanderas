// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const authController = {

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          ok: false, mensaje: 'Email y contraseña son obligatorios'
        });
      }

      const [filas] = await db.execute(
        'SELECT * FROM administradores WHERE email = ?', [email]
      );

      if (filas.length === 0) {
        return res.status(401).json({
          ok: false, mensaje: 'Credenciales incorrectas'
        });
      }

      const admin = filas[0];

      const esValida = await bcrypt.compare(password, admin.password_hash);

      if (!esValida) {
        return res.status(401).json({
          ok: false, mensaje: 'Credenciales incorrectas'
        });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, nombre: admin.nombre },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        ok      : true,
        mensaje : 'Inicio de sesión exitoso',
        token,
        admin   : { id: admin.id, nombre: admin.nombre, email: admin.email }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
  }

};

module.exports = authController;