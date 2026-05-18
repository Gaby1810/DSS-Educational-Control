const express = require("express");
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
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(result);
        }
    );

});

module.exports = router;