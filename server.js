const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const app = express();

// =====================================
// CONFIGURACIÓN
// =====================================

app.use(cors({
    origin: "http://localhost:5500",
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.set("trust proxy", 1);

// =====================================
// SESIONES
// =====================================

app.use(session({

    secret: "secreto123",

    resave: false,

    saveUninitialized: false,

    cookie: {

        maxAge: 1000 * 60 * 60,

        httpOnly: true

    }

}));

// =====================================
// CARPETA PUBLIC
// =====================================

app.use(

    express.static(
        path.join(__dirname, "public")
    )

);

// =====================================
// CARPETA UPLOADS
// =====================================

app.use(

    "/uploads",

    express.static(
        path.join(__dirname, "uploads")
    )

);

// =====================================
// RUTAS API
// =====================================

app.use(
    "/api/auth",
    require("./routes/auth")
);

app.use(
    "/api/docente",
    require("./routes/docente")
);

app.use(
    "/api/materiales",
    require("./routes/materiales")
);

app.use(
    "/api/tareas",
    require("./routes/tareas")
);

app.use(
    "/estudiante",
    require("./routes/estudiante")
);

// =====================================
// ✅ NUEVA RUTA ASISTENCIA
// =====================================

app.use(
    "/api/asistencia",
    require("./routes/asistencia")
);

// =====================================
// RUTA PRINCIPAL
// =====================================

app.get("/", (req, res) => {

    res.send("Servidor funcionando");

});

// =====================================
// SERVIDOR
// =====================================

app.listen(3000, () => {

    console.log(
        "✅ Servidor ejecutándose en puerto 3000"
    );

});