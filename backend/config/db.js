const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const db = pool.promise();

db.getConnection()
.then((connection) => {
    console.log('✅ Conexión a MySQL exitosa');
    connection.release();

    db.query("SELECT * FROM administradores")
    .then(([rows]) => {
        console.log("✅ ADMINISTRADORES:", rows);
    })
    .catch(err => {
        console.error("❌ Error tabla:", err.message);
    });

})
.catch((err) => {
    console.error('❌ Error conectando a MySQL:', err.message);
});

module.exports = db;