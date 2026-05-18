const express = require("express");
const router  = express.Router();
const db      = require("../db");
const path    = require("path");
const upload  = require("../middlewares/upload");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth);

function sanitize(str) { return String(str || "").trim().slice(0, 2000); }

router.post("/crear/:id", requireRole("docente", "admin"), upload.single("archivo"), (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });

    const titulo      = sanitize(req.body.titulo);
    const descripcion = sanitize(req.body.descripcion);
    const fecha_entrega = req.body.fecha_entrega || null;
    const puntaje = parseFloat(req.body.puntaje) || 10;

    if (!titulo) return res.status(400).json({ message: "Titulo requerido" });
    if (puntaje < 0 || puntaje > 100)
        return res.status(400).json({ message: "Puntaje debe estar entre 0 y 100" });

    let archivo = null, tipo = "otro";
    if (req.file) {
        archivo = req.file.filename;
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === ".pdf") tipo = "pdf";
        else if ([".doc", ".docx"].includes(ext)) tipo = "word";
        else if ([".jpg", ".jpeg", ".png"].includes(ext)) tipo = "imagen";
    }

    db.query(
        "SELECT id FROM docente_materias WHERE id=? AND (docente_id=? OR ?='admin')",
        [claseId, req.session.usuario.id, req.session.usuario.rol],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            if (rows.length === 0) return res.status(403).json({ message: "No tienes acceso a esta clase" });

            db.query(
                "INSERT INTO tareas (docente_materia_id, titulo, descripcion, archivo, tipo, fecha_entrega, valor) VALUES (?,?,?,?,?,?,?)",
                [claseId, titulo, descripcion, archivo, tipo, fecha_entrega, puntaje],
                (err) => {
                    if (err) return res.status(500).json({ message: "Error al crear tarea" });
                    res.json({ message: "Tarea creada correctamente" });
                }
            );
        }
    );
});

router.get("/:id", (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });
    const sql = `
        SELECT t.id, t.titulo, t.descripcion, t.archivo, t.fecha_entrega, t.valor,
               COUNT(CASE WHEN e.estado='Entregado'  THEN 1 END) AS entregados,
               COUNT(CASE WHEN e.estado='Pendiente'  THEN 1 END) AS pendientes,
               COUNT(CASE WHEN e.estado='Calificado' THEN 1 END) AS calificados
        FROM tareas t
        LEFT JOIN entregas_tareas e ON t.id = e.tarea_id
        WHERE t.docente_materia_id = ?
        GROUP BY t.id ORDER BY t.id DESC`;
    db.query(sql, [claseId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error cargando tareas" });
        res.json(result);
    });
});

router.get("/entregas/:tarea", requireRole("docente", "admin"), (req, res) => {
    const tarea = parseInt(req.params.tarea);
    if (isNaN(tarea)) return res.status(400).json({ message: "Tarea invalida" });
    const sql = `
        SELECT u.id, u.nombre, COALESCE(e.estado, 'Pendiente') AS estado, e.nota, e.archivo
        FROM estudiante_materias em
        INNER JOIN usuarios u ON u.id = em.estudiante_id
        LEFT JOIN entregas_tareas e ON u.id = e.estudiante_id AND e.tarea_id = ?
        WHERE em.docente_materia_id = (SELECT docente_materia_id FROM tareas WHERE id = ?)`;
    db.query(sql, [tarea, tarea], (err, result) => {
        if (err) return res.status(500).json({ message: "Error cargando entregas" });
        res.json(result);
    });
});

router.post("/calificar", requireRole("docente", "admin"), (req, res) => {
    const tarea_id      = parseInt(req.body.tarea_id);
    const estudiante_id = parseInt(req.body.estudiante_id);
    const nota          = parseFloat(req.body.nota);
    if (isNaN(tarea_id) || isNaN(estudiante_id) || isNaN(nota))
        return res.status(400).json({ message: "Datos invalidos" });
    if (nota < 0 || nota > 100)
        return res.status(400).json({ message: "La nota debe estar entre 0 y 100" });
    db.query(
        "UPDATE entregas_tareas SET nota=?, estado='Calificado' WHERE tarea_id=? AND estudiante_id=?",
        [nota, tarea_id, estudiante_id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error calificando" });
            if (result.affectedRows === 0) return res.status(404).json({ message: "Entrega no encontrada" });
            res.json({ message: "Calificacion guardada" });
        }
    );
});

module.exports = router;
