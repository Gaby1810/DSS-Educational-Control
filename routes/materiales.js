const express = require("express");
const router  = express.Router();
const db      = require("../db");
const upload  = require("../middlewares/upload");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth);

function sanitize(str) { return String(str || "").trim().slice(0, 1000); }

router.post("/subir/:id", requireRole("docente", "admin"), upload.single("archivo"), (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });
    if (!req.file) return res.status(400).json({ message: "Archivo requerido" });

    const titulo = sanitize(req.body.titulo);
    const descripcion = sanitize(req.body.descripcion);
    if (!titulo) return res.status(400).json({ message: "Titulo requerido" });

    const checkSql = "SELECT id FROM docente_materias WHERE id=? AND (docente_id=? OR ?='admin')";
    db.query(checkSql, [claseId, req.session.usuario.id, req.session.usuario.rol], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error servidor" });
        if (rows.length === 0) return res.status(403).json({ message: "No tienes acceso a esta clase" });

        db.query(
            "INSERT INTO materiales (docente_materia_id, titulo, descripcion, archivo) VALUES (?,?,?,?)",
            [claseId, titulo, descripcion, req.file.filename],
            (err) => {
                if (err) return res.status(500).json({ message: "Error" });
                res.json({ message: "Material subido" });
            }
        );
    });
});

router.get("/:id", (req, res) => {
    const claseId = parseInt(req.params.id);
    if (isNaN(claseId)) return res.status(400).json({ message: "Clase invalida" });
    db.query(
        "SELECT * FROM materiales WHERE docente_materia_id=? ORDER BY id DESC",
        [claseId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(result);
        }
    );
});

module.exports = router;
