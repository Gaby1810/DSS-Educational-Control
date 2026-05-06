const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors"); // 🔥 IMPORTANTE

const app = express();

// 🔥 CONFIGURAR CORS
app.use(cors({
    origin: "http://127.0.0.1:5500", // tu frontend
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 SESIÓN
app.use(session({
    secret: "secreto123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000*60*60 }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/estudiante", require("./routes/estudiante"));
app.use("/api/docente", require("./routes/docente"));

app.listen(3000, () => console.log("Servidor en puerto 3000"));