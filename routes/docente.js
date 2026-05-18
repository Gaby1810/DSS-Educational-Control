const express = require("express");
const router  = express.Router();
const db      = require("../db");
const crypto  = require("crypto");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth, requireRole("docente", "admin"));

function sanitize(str) { return String(str || "").trim().slice(0, 200); }

router.get("/mis-clases", (req, res) => {
    const docenteId = req.session.usuario.id;
    const sql = `
        SELECT dm.id, m.nombre AS materia, dm.grado, dm.seccion,
               dm.codigo_clase, u.nombre AS profesor
        FROM docente_materias dm
        INNER JOIN materias  m ON dm.materia_id = m.id
        INNER JOIN usuarios  u ON dm.docente_id = u.id
        WHERE dm.docente_id = ?
        ORDER BY dm.id DESC`;
    db.query(sql, [docenteId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error servidor" });
        res.json(result);
    });
});

router.post("/crear-clase", (req, res) => {
    const docenteId = req.session.usuario.id;
    const nombreMateria = sanitize(req.body.nombreMateria);
    const grado   = sanitize(req.body.grado);
    const seccion = sanitize(req.body.seccion);

    if (!nombreMateria || !grado || !seccion)
        return res.status(400).json({ message: "Completa todos los campos" });

    db.query("SELECT * FROM materias WHERE nombre=?", [nombreMateria], (err, materia) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (materia.length > 0) crearRelacion(materia[0].id);
        else db.query("INSERT INTO materias(nombre) VALUES(?)", [nombreMateria], (err, nueva) => {
            if (err) return res.status(500).json({ message: "Error creando materia" });
            crearRelacion(nueva.insertId);
        });
    });

    function crearRelacion(materiaId) {
        const codigo = crypto.randomBytes(4).toString("hex").toUpperCase();
        db.query(
            "INSERT INTO docente_materias (docente_id, materia_id, grado, seccion, codigo_clase) VALUES (?,?,?,?,?)",
            [docenteId, materiaId, grado, seccion, codigo],
            (err) => {
                if (err) return res.status(500).json({ message: "Error creando" });
                res.json({ message: "Clase creada correctamente", codigo });
            }
        );
    }
});

router.delete("/eliminar-clase/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });

    const isAdmin = req.session.usuario.rol === "admin";
    const sql = isAdmin
        ? "DELETE FROM docente_materias WHERE id=?"
        : "DELETE FROM docente_materias WHERE id=? AND docente_id=?";
    const params = isAdmin ? [id] : [id, req.session.usuario.id];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Error eliminando" });
        if (result.affectedRows === 0)
            return res.status(403).json({ message: "No tienes permiso para eliminar esta clase" });
        res.json({ message: "Clase eliminada" });
    });
});

router.get("/estudiantes/:id", (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });
    const sql = `
        SELECT u.id, u.nombre, u.correo, dm.grado, dm.seccion
        FROM estudiante_materias em
        INNER JOIN usuarios u           ON em.estudiante_id = u.id
        INNER JOIN docente_materias dm  ON em.docente_materia_id = dm.id
        WHERE em.docente_materia_id = ?
        ORDER BY u.nombre ASC`;
    db.query(sql, [claseId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error cargando estudiantes" });
        res.json(result);
    });
});

module.exports = router;
