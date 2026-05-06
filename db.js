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