const express = require("express");
<<<<<<< HEAD
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
=======
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* =========================
SUBIR MATERIAL
========================= */
router.post("/subir/:id", upload.single("archivo"), (req, res) => {

    const { titulo, descripcion } = req.body;
    const claseId = req.params.id;

    const sql = `
        INSERT INTO materiales
        (docente_materia_id, titulo, descripcion, archivo)
        VALUES (?,?,?,?)
    `;

    db.query(sql, [
        claseId,
        titulo,
        descripcion,
        req.file.filename
    ], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ message: "Material subido" });
    });
});

/* =========================
OBTENER MATERIALES
========================= */
router.get("/:id", (req, res) => {

    db.query(
        `SELECT * FROM materiales WHERE docente_materia_id=? ORDER BY id DESC`,
        [req.params.id],
>>>>>>> d8b637490602872ebaae8320255b6368dfaa5421
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(result);
        }
    );
<<<<<<< HEAD
});

module.exports = router;
=======

});

module.exports = router;
>>>>>>> d8b637490602872ebaae8320255b6368dfaa5421
