const mysql = require('mysql2');
require('dotenv').config();

// Usar conexión completa de Railway (RECOMENDADO)
const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

// Versión con promesas (async/await)
const db = pool.promise();

// Probar conexión
db.getConnection()
.then((connection) => {
    console.log('✅ Conexión a MySQL exitosa');
    connection.release();
})
.catch((err) => {
    console.error('❌ Error conectando a MySQL:', err.message);
});

module.exports = db;