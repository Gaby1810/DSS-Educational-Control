const express = require("express");
const router = express.Router();
const db = require("../db");

const multer = require("multer");
const path = require("path");

// ======================================
// SUBIR ARCHIVOS
// ======================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ======================================
// PROTEGER RUTAS
// ======================================

function verificar(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
}

// ======================================
// DASHBOARD
// ======================================

router.get("/dashboard", verificar, (req, res) => {
    const id = req.session.usuario.id;

    db.query(
        `SELECT nombre, grado, seccion, turno FROM usuarios WHERE id=?`,
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result[0]);
        }
    );
});

// ======================================
// UNIRSE A CLASE
// ======================================

router.post("/unirse", verificar, (req, res) => {
    const codigo = req.body.codigo;
    const estudiante = req.session.usuario.id;

    db.query(
        `SELECT * FROM docente_materias WHERE codigo_clase=?`,
        [codigo],
        (err, result) => {
            if (err) return res.json({ message: "Error servidor" });

            if (result.length === 0) {
                return res.json({ message: "Clase no encontrada" });
            }

            const clase = result[0];

            db.query(
                `SELECT * FROM estudiante_materias WHERE estudiante_id=? AND docente_materia_id=?`,
                [estudiante, clase.id],
                (err, existe) => {

                    if (existe.length > 0) {
                        return res.json({ message: "Ya perteneces a esta clase" });
                    }

                    db.query(
                        `INSERT INTO estudiante_materias (estudiante_id, docente_materia_id) VALUES (?,?)`,
                        [estudiante, clase.id],
                        (err) => {
                            if (err) return res.json({ message: "Error al unirse" });

                            res.json({ message: "Te uniste correctamente" });
                        }
                    );

                }
            );

        }
    );
});

// ======================================
// MIS CLASES
// ======================================

router.get("/mis-clases", verificar, (req, res) => {
    const estudiante = req.session.usuario.id;

    db.query(
        `SELECT dm.id, m.nombre AS materia, dm.grado, dm.seccion, dm.codigo_clase, u.nombre AS profesor
         FROM estudiante_materias em
         INNER JOIN docente_materias dm ON em.docente_materia_id = dm.id
         INNER JOIN materias m ON dm.materia_id = m.id
         INNER JOIN usuarios u ON dm.docente_id = u.id
         WHERE em.estudiante_id = ?`,
        [estudiante],
        (err, result) => {
            if (err) return res.json({ message: "Error servidor" });
            res.json(result);
        }
    );
});

// ======================================
// DETALLE CLASE (MATERIA + TAREAS)
// ======================================

router.get("/clase/:id", verificar, (req, res) => {

    const claseId = req.params.id;

    db.query(
        `
        SELECT * FROM (
            SELECT
                m.id,
                m.titulo,
                m.descripcion,
                m.archivo,
                DATE_FORMAT(m.fecha_subida,'%d/%m/%Y %H:%i') AS fecha,
                'Material' AS tipo
            FROM materiales m
            WHERE m.docente_materia_id=?

            UNION ALL

            SELECT
                t.id,
                t.titulo,
                t.descripcion,
                t.archivo,
                DATE_FORMAT(t.fecha_subida,'%d/%m/%Y %H:%i') AS fecha,
                'Tarea' AS tipo
            FROM tareas t
            WHERE t.docente_materia_id=?
        ) AS contenido
        ORDER BY id DESC
        `,
        [claseId, claseId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Error servidor" });
            res.json(result);
        }
    );

});

// ======================================
// ENTREGAR TAREA
// ======================================

router.post("/entregar/:id", verificar, upload.single("archivo"), (req, res) => {

    const tarea = req.params.id;
    const estudiante = req.session.usuario.id;

    if (!req.file) {
        return res.json({ message: "Selecciona archivo" });
    }

    const comentario = req.body.comentario || null;

    db.query(
        `SELECT * FROM entregas_tareas WHERE tarea_id=? AND estudiante_id=?`,
        [tarea, estudiante],
        (err, existe) => {

            if (existe.length > 0) {
                return res.json({ message: "Ya entregaste esta tarea" });
            }

            db.query(
                `INSERT INTO entregas_tareas (tarea_id, estudiante_id, archivo, comentario)
                 VALUES (?,?,?,?)`,
                [tarea, estudiante, req.file.filename, comentario],
                (err) => {
                    if (err) return res.json({ message: "Error al entregar" });

                    res.json({ message: "Tarea enviada correctamente" });
                }
            );

        }
    );

});

// ======================================
// ASISTENCIA
// ======================================

router.get("/asistencia/:clase", verificar, (req, res) => {

    const estudianteId = req.session.usuario.id;
    const clase = req.params.clase;

    const resumen = `
        SELECT
        COUNT(CASE WHEN presente = 1 THEN 1 END) AS presentes,
        COUNT(CASE WHEN presente = 0 THEN 1 END) AS ausencias
        FROM asistencia
        WHERE estudiante_id = ? AND docente_materia_id = ?
    `;

    const historial = `
        SELECT DATE_FORMAT(fecha,'%d/%m/%Y %H:%i') AS fecha, presente
        FROM asistencia
        WHERE estudiante_id = ? AND docente_materia_id = ?
        ORDER BY fecha DESC
    `;

    db.query(resumen, [estudianteId, clase], (err, resumenData) => {

        db.query(historial, [estudianteId, clase], (err, historialData) => {

            res.json({
                resumen: resumenData[0],
                historial: historialData
            });

        });

    });

});// ======================================
// VER TAREAS (CORREGIDO)
// ======================================

router.get("/tareas/:clase", verificar, (req, res) => {

    const clase = req.params.clase;
    const estudiante = req.session.usuario.id;

    const sql = `
        SELECT
            t.id,
            t.titulo,
            t.descripcion,
            t.archivo,

            t.fecha_entrega,

            CASE
                WHEN e.id IS NULL THEN 'Pendiente'
                WHEN e.nota IS NULL THEN 'Entregado'
                ELSE 'Calificado'
            END AS estado,

            e.nota

        FROM tareas t

        LEFT JOIN entregas_tareas e
        ON t.id=e.tarea_id
        AND e.estudiante_id=?

        WHERE t.docente_materia_id=?

        ORDER BY t.id DESC
    `;

    db.query(
        sql,
        [estudiante, clase],

        (err,result)=>{

            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Error servidor"
                });

            }

            res.json(result);

        }

    );

});
//materiales//
router.get("/materiales/:clase", (req, res) => {

const clase = req.params.clase;

const sql = `
SELECT
id,
titulo,
descripcion,
archivo,
DATE_FORMAT(fecha_subida,'%Y-%m-%d %H:%i:%s') AS fecha
FROM materiales
WHERE docente_materia_id = ?
ORDER BY id DESC
`;

db.query(sql, [clase], (err, result) => {

if (err) {
console.log(err);
return res.status(500).json({ message: "Error servidor" });
}

res.json(result);

});

});

module.exports = router;