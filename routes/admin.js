const express = require("express");
const db = require("../db");
const router = express.Router();


// 🔐 Middleware para proteger rutas (solo admin)
function verificarAdmin(req, res, next) {

    if (!req.session.usuario) {
        return res.status(401).json({ message: "No autenticado" });
    }

    if (req.session.usuario.rol !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
    }

    next();
}


// 📚 Crear materia
router.post("/crear-materia", verificarAdmin, (req, res) => {

    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: "Nombre requerido" });
    }

    db.query(
        "INSERT INTO materias (nombre) VALUES (?)",
        [nombre],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error al crear materia" });
            }

            res.json({ message: "Materia creada correctamente" });
        }
    );
});


// 📌 Asignar materia a docente
router.post("/asignar-materia", verificarAdmin, (req, res) => {

    const { docente_id, materia_id, grado, seccion } = req.body;

    if (!docente_id || !materia_id || !grado || !seccion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    db.query(
        `INSERT INTO docente_materias 
        (docente_id, materia_id, grado, seccion) 
        VALUES (?, ?, ?, ?)`,
        [docente_id, materia_id, grado, seccion],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error al asignar materia" });
            }

            res.json({ message: "Materia asignada correctamente" });
        }
    );
});


module.exports = router;