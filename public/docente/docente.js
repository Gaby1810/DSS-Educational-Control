const express = require("express");
const router = express.Router();
const db = require("../db");

// MIS MATERIAS

router.get("/mis-materias", (req, res) => {

    // validar sesión

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autorizado"
        });

    }

    const docenteId = req.session.usuario.id;

    const sql = `
    SELECT
        dm.id,
        m.nombre,
        dm.grado,
        dm.seccion
    FROM docente_materias dm
    INNER JOIN materias m
    ON dm.materia_id = m.id
    WHERE dm.docente_id = ?
    `;

    db.query(sql, [docenteId], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Error servidor"
            });

        }

        res.json(result);

    });

});

module.exports = router;