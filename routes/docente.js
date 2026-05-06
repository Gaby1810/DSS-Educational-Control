const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔐 Middleware
function verificarDocente(req, res, next) {
    if (!req.session.usuario || req.session.usuario.rol !== "docente") {
        return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
}

// 📚 Obtener materias del docente
router.get("/mis-materias", verificarDocente, (req, res) => {
    const docenteId = req.session.usuario.id;

    const sql = `
    SELECT dm.id, m.nombre, dm.grado, dm.seccion
    FROM docente_materias dm
    JOIN materias m ON dm.materia_id = m.id
    WHERE dm.docente_id = ?
    `;

    db.query(sql, [docenteId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 👨‍🎓 Estudiantes por materia
router.get("/estudiantes/:id", verificarDocente, (req, res) => {

    const sql = `
    SELECT u.id, u.nombre
    FROM usuarios u
    JOIN docente_materias dm
        ON u.grado = dm.grado AND u.seccion = dm.seccion
    WHERE dm.id = ? AND u.rol = 'estudiante'
    `;

    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 📝 Crear tarea
router.post("/crear-tarea", verificarDocente, (req, res) => {

    const { materiaId, titulo } = req.body;

    if (!materiaId || !titulo) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    const sql = `
    INSERT INTO tareas (docente_materia_id, titulo, descripcion, fecha_entrega, valor)
    VALUES (?, ?, '', NULL, NULL)
    `;

    db.query(sql, [materiaId, titulo], (err) => {
        if (err) return res.status(500).json({ message: "Error en servidor" });

        res.json({ message: "Tarea creada correctamente" });
    });
});

// 📥 Obtener tareas
router.get("/tareas/:materiaId", verificarDocente, (req, res) => {

    const sql = `
    SELECT * FROM tareas
    WHERE docente_materia_id = ?
    `;

    db.query(sql, [req.params.materiaId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 📊 Guardar notas
router.post("/guardar-notas", verificarDocente, (req, res) => {

    const notas = req.body.notas;

    if (!notas || notas.length === 0) {
        return res.json({ message: "No hay notas para guardar" });
    }

    const sql = `
    INSERT INTO notas_tareas (tarea_id, estudiante_id, nota)
    VALUES ?
    `;

    const values = notas.map(n => [n.tarea_id, n.estudiante_id, n.nota]);

    db.query(sql, [values], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Notas guardadas correctamente" });
    });
});

// 📅 Asistencia
router.post("/asistencia", verificarDocente, (req, res) => {

    const asistencia = req.body.asistencia;

    if (!asistencia || asistencia.length === 0) {
        return res.json({ message: "No hay datos de asistencia" });
    }

    const sql = `
    INSERT INTO asistencia (docente_materia_id, estudiante_id, fecha, presente)
    VALUES ?
    `;

    const values = asistencia.map(a =>
        [a.docente_materia_id, a.estudiante_id, a.fecha, a.presente]
    );

    db.query(sql, [values], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Asistencia guardada correctamente" });
    });
});

module.exports = router;