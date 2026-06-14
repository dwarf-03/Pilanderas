// backend/config/db.js
// Conexión a la base de datos MySQL

const mysql = require('mysql2');
require('dotenv').config();

// Crear pool de conexiones
// Un pool reutiliza conexiones en lugar de abrir una nueva cada vez
const pool = mysql.createPool({
host     : process.env.DB_HOST,
user     : process.env.DB_USER,
password : process.env.DB_PASSWORD,
database : process.env.DB_NAME,
waitForConnections: true,
connectionLimit   : 10,
queueLimit        : 0
});

// Convertir el pool a promesas (para usar async/await)
const db = pool.promise();

// Probar la conexión al iniciar
pool.getConnection((err, connection) => {
if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    return;
}
console.log('✅ Conexión a MySQL exitosa');
connection.release();
});

module.exports = db;