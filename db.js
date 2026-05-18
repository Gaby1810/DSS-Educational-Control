<<<<<<< HEAD
require("dotenv").config();
const mysql = require("mysql2");

// Pool de conexiones (mas estable que createConnection)
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "educational_control",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error("Error de conexion MySQL:", err.message);
        return;
    }
    console.log("MySQL conectado (pool)");
    conn.release();
});

module.exports = pool;
=======
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "gaby1810",
    database: "educational_control"
});

db.connect(err => {
    if (err) {
        console.log("❌ Error de conexión:", err);
    } else {
        console.log("✅ MySQL conectado");
    }
});

module.exports = db;
>>>>>>> d8b637490602872ebaae8320255b6368dfaa5421
