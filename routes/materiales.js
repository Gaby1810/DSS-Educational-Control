const express = require("express");
const router = express.Router();
const db = require("../db");

const multer = require("multer");
const path = require("path");

// =====================================
// MULTER CONFIG
// =====================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const nombre =
            Date.now() + path.extname(file.originalname);
        cb(null, nombre);
    }
});

const upload = multer({ storage });

// =====================================
// SUBIR MATERIAL
// =====================================

router.post("/subir/:id", upload.single("archivo"), (req, res) => {

    const claseId = req.params.id;
    const { titulo, descripcion } = req.body;

    if (!req.file) {
        return res.json({ message: "Debes seleccionar un archivo" });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    let tipo = "otro";

    if (extension === ".pdf") tipo = "pdf";
    else if (extension === ".doc" || extension === ".docx") tipo = "word";
    else if ([".png", ".jpg", ".jpeg", ".gif"].includes(extension)) tipo = "imagen";

    const sql = `
        INSERT INTO materiales
        (docente_materia_id, titulo, descripcion, archivo, tipo)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [claseId, titulo, descripcion, req.file.filename, tipo],
        (err) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Error subiendo material"
                });
            }

            res.json({
                message: "Material publicado correctamente"
            });

        }
    );
});

// =====================================
// OBTENER MATERIALES
// =====================================

router.get("/:id", (req, res) => {

    const claseId = req.params.id;
    const sql = `
    SELECT
        id,
        docente_materia_id,
        titulo,
        descripcion,
        archivo,
        DATE_FORMAT(fecha_subida, '%Y-%m-%dT%H:%i:%s') AS fecha
    FROM materiales
    WHERE docente_materia_id = ?
    ORDER BY id DESC
`;
    db.query(sql, [claseId], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error cargando materiales"
            });
        }

        res.json(result);
    });
});

// =========================
// SUBIR TAREA
// =========================

router.post("/subir/:id", upload.single("archivo"), (req, res) => {

    const claseId = req.params.id;
    const { titulo, descripcion, fecha_entrega } = req.body;

    if (!req.file) {
        return res.json({ message: "Debes subir un archivo" });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    let tipo = "otro";
    if (extension === ".pdf") tipo = "pdf";
    else if (extension === ".doc" || extension === ".docx") tipo = "word";
    else if ([".png", ".jpg", ".jpeg"].includes(extension)) tipo = "imagen";

    const sql = `
        INSERT INTO tareas_materiales
        (docente_materia_id, titulo, descripcion, archivo, tipo, fecha_entrega)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        claseId,
        titulo,
        descripcion,
        req.file.filename,
        tipo,
        fecha_entrega
    ], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error subiendo tarea" });
        }

        res.json({ message: "Tarea publicada correctamente" });
    });
});

// =========================
// OBTENER TAREAS
// =========================

router.get("/:id", (req, res) => {

    const claseId = req.params.id;

    const sql = `
        SELECT
            id,
            docente_materia_id,
            titulo,
            descripcion,
            archivo,
            tipo,
            DATE_FORMAT(fecha_subida, '%Y-%m-%dT%H:%i:%s') AS fecha,
            fecha_entrega
        FROM tareas_materiales
        WHERE docente_materia_id = ?
        ORDER BY id DESC
    `;

    db.query(sql, [claseId], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error cargando tareas" });
        }

        res.json(result);
    });
});


module.exports = router;