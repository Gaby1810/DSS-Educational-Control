const express = require("express");
const router  = express.Router();
const db      = require("../db");
const upload  = require("../middlewares/upload");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth);

function sanitize(str) { return String(str || "").trim().slice(0, 500); }

router.get("/dashboard", requireRole("estudiante"), (req, res) => {
    const id = req.session.usuario.id;
    db.query(
        "SELECT id, nombre, correo, rol, tipo_bachillerato, anio, telefono FROM usuarios WHERE id=?",
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result[0] || {});
        }
    );
});

router.post("/unirse", requireRole("estudiante"), (req, res) => {
    const codigo = sanitize(req.body.codigo);
    const estudiante = req.session.usuario.id;
    if (!codigo) return res.status(400).json({ message: "Codigo requerido" });

    db.query("SELECT * FROM docente_materias WHERE codigo_clase=?", [codigo], (err, result) => {
        if (err) return res.status(500).json({ message: "Error servidor" });
        if (result.length === 0) return res.status(404).json({ message: "Clase no encontrada" });
        const clase = result[0];

        db.query(
            "SELECT id FROM estudiante_materias WHERE estudiante_id=? AND docente_materia_id=?",
            [estudiante, clase.id],
            (err, existe) => {
                if (err) return res.status(500).json({ message: "Error" });
                if (existe.length > 0) return res.status(409).json({ message: "Ya perteneces a esta clase" });
                db.query(
                    "INSERT INTO estudiante_materias (estudiante_id, docente_materia_id) VALUES (?,?)",
                    [estudiante, clase.id],
                    (err) => {
                        if (err) return res.status(500).json({ message: "Error al unirse" });
                        res.json({ message: "Te uniste correctamente" });
                    }
                );
            }
        );
    });
});

router.get("/mis-clases", requireRole("estudiante"), (req, res) => {
    const estudiante = req.session.usuario.id;
    db.query(
        `SELECT dm.id, m.nombre AS materia, dm.grado, dm.seccion,
                dm.codigo_clase, u.nombre AS profesor
         FROM estudiante_materias em
         INNER JOIN docente_materias dm ON em.docente_materia_id = dm.id
         INNER JOIN materias m          ON dm.materia_id = m.id
         INNER JOIN usuarios u          ON dm.docente_id = u.id
         WHERE em.estudiante_id = ?`,
        [estudiante],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result);
        }
    );
});

router.get("/clase/:id", (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });
    db.query(`
        SELECT * FROM (
            SELECT m.id, m.titulo, m.descripcion, m.archivo,
                   DATE_FORMAT(m.fecha_subida,'%d/%m/%Y %H:%i') AS fecha,
                   'Material' AS tipo
            FROM materiales m WHERE m.docente_materia_id = ?
            UNION ALL
            SELECT t.id, t.titulo, t.descripcion, t.archivo,
                   DATE_FORMAT(t.fecha_subida,'%d/%m/%Y %H:%i') AS fecha,
                   'Tarea' AS tipo
            FROM tareas t WHERE t.docente_materia_id = ?
        ) AS contenido ORDER BY id DESC`,
        [claseId, claseId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result);
        }
    );
});

router.post("/entregar/:id", requireRole("estudiante"), upload.single("archivo"), (req, res) => {
    const tarea = parseInt(req.params.id);
    const estudiante = req.session.usuario.id;
    if (isNaN(tarea)) return res.status(400).json({ message: "Tarea invalida" });
    if (!req.file) return res.status(400).json({ message: "Selecciona archivo" });

    const comentario = sanitize(req.body.comentario);
    db.query(
        "SELECT id FROM entregas_tareas WHERE tarea_id=? AND estudiante_id=?",
        [tarea, estudiante],
        (err, existe) => {
            if (err) return res.status(500).json({ message: "Error" });
            if (existe.length > 0) return res.status(409).json({ message: "Ya entregaste esta tarea" });
            db.query(
                "INSERT INTO entregas_tareas (tarea_id, estudiante_id, archivo, comentario, estado) VALUES (?,?,?,?, 'Entregado')",
                [tarea, estudiante, req.file.filename, comentario],
                (err) => {
                    if (err) return res.status(500).json({ message: "Error al entregar" });
                    res.json({ message: "Tarea enviada correctamente" });
                }
            );
        }
    );
});

router.get("/asistencia/:clase", (req, res) => {
    const estudianteId = req.session.usuario.id;
    const clase = parseInt(req.params.clase);
    if (isNaN(clase)) return res.status(400).json({ message: "Clase invalida" });

    const resumen = `
        SELECT COUNT(CASE WHEN presente = 1 THEN 1 END) AS presentes,
               COUNT(CASE WHEN presente = 0 THEN 1 END) AS ausencias
        FROM asistencia WHERE estudiante_id = ? AND docente_materia_id = ?`;
    const historial = `
        SELECT DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha, presente
        FROM asistencia WHERE estudiante_id = ? AND docente_materia_id = ?
        ORDER BY fecha DESC`;

    db.query(resumen, [estudianteId, clase], (err, resumenData) => {
        if (err) return res.status(500).json({ message: "Error" });
        db.query(historial, [estudianteId, clase], (err, historialData) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json({
                resumen: resumenData[0] || { presentes: 0, ausencias: 0 },
                historial: historialData,
            });
        });
    });
});

router.get("/tareas/:clase", (req, res) => {
    const clase = parseInt(req.params.clase);
    const estudiante = req.session.usuario.id;
    if (isNaN(clase)) return res.status(400).json({ message: "Clase invalida" });
    const sql = `
        SELECT t.id, t.titulo, t.descripcion, t.archivo, t.fecha_entrega,
               CASE WHEN e.id IS NULL THEN 'Pendiente'
                    WHEN e.nota IS NULL THEN 'Entregado'
                    ELSE 'Calificado' END AS estado,
               e.nota
        FROM tareas t
        LEFT JOIN entregas_tareas e ON t.id = e.tarea_id AND e.estudiante_id = ?
        WHERE t.docente_materia_id = ?
        ORDER BY t.id DESC`;
    db.query(sql, [estudiante, clase], (err, result) => {
        if (err) return res.status(500).json({ message: "Error servidor" });
        res.json(result);
    });
});

router.get("/materiales/:clase", (req, res) => {
    const clase = parseInt(req.params.clase);
    if (isNaN(clase)) return res.status(400).json({ message: "Clase invalida" });
    db.query(
        `SELECT id, titulo, descripcion, archivo,
                DATE_FORMAT(fecha_subida,'%Y-%m-%d %H:%i:%s') AS fecha
         FROM materiales WHERE docente_materia_id = ? ORDER BY id DESC`,
        [clase],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result);
        }
    );
});

router.get("/companeros", requireRole("estudiante"), (req, res) => {
    const estudiante = req.session.usuario.id;
    const sql = `
        SELECT
            u.id,
            u.nombre,
            u.correo,
            COUNT(DISTINCT dm.id) AS clases_compartidas,
            GROUP_CONCAT(DISTINCT m.nombre ORDER BY m.nombre SEPARATOR ', ') AS materias
        FROM estudiante_materias actual
        INNER JOIN estudiante_materias peers
            ON peers.docente_materia_id = actual.docente_materia_id
           AND peers.estudiante_id <> actual.estudiante_id
        INNER JOIN usuarios u
            ON u.id = peers.estudiante_id
        INNER JOIN docente_materias dm
            ON dm.id = actual.docente_materia_id
        INNER JOIN materias m
            ON m.id = dm.materia_id
        WHERE actual.estudiante_id = ?
        GROUP BY u.id, u.nombre, u.correo
        ORDER BY u.nombre ASC`;
    db.query(sql, [estudiante], (err, result) => {
        if (err) return res.status(500).json({ message: "Error servidor" });
        res.json(result);
    });
});

module.exports = router;
