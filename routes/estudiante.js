const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================
// PROTEGER RUTAS
// ======================================

function verificar(req, res, next) {

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autenticado"
        });

    }

    next();

}

// ======================================
// DASHBOARD ESTUDIANTE
// ======================================

router.get("/dashboard", verificar, (req, res) => {

    const id =
    req.session.usuario.id;

    db.query(

        `
        SELECT
        nombre,
        grado,
        seccion,
        turno

        FROM usuarios

        WHERE id = ?
        `,

        [id],

        (err, result) => {

            if(err){

                return res.status(500).json({
                    message:"Error servidor"
                });

            }

            res.json(result[0]);

        }

    );

});

// ======================================
// UNIRSE A CLASE
// ======================================

router.post("/unirse", verificar, (req, res) => {

    const { codigo } = req.body;

    const estudiante =
    req.session.usuario;

    db.query(

        `
        SELECT *
        FROM docente_materias
        WHERE codigo_clase = ?
        `,

        [codigo],

        (err, result) => {

            if(err){

                return res.json({
                    message:"Error servidor"
                });

            }

            if(result.length === 0){

                return res.json({
                    message:"Clase no encontrada"
                });

            }

            const clase =
            result[0];

            // VERIFICAR SI YA EXISTE

            db.query(

                `
                SELECT *
                FROM estudiante_materias

                WHERE estudiante_id = ?
                AND docente_materia_id = ?
                `,

                [
                    estudiante.id,
                    clase.id
                ],

                (err, existe) => {

                    if(existe.length > 0){

                        return res.json({
                            message:"Ya perteneces a esta clase"
                        });

                    }

                    // INSERTAR

                    db.query(

                        `
                        INSERT INTO estudiante_materias
                        (
                            estudiante_id,
                            docente_materia_id
                        )

                        VALUES (?, ?)
                        `,

                        [
                            estudiante.id,
                            clase.id
                        ],

                        (err) => {

                            if(err){

                                return res.json({
                                    message:"Error al unirse"
                                });

                            }

                            res.json({
                                message:"Te uniste correctamente"
                            });

                        }

                    );

                }

            );

        }

    );

});

// ======================================
// VER MIS CLASES
// ======================================

router.get("/mis-clases", verificar, (req, res) => {

    const estudiante =
    req.session.usuario;

    db.query(

        `
        SELECT

        dm.id,
        m.nombre,
        dm.grado,
        dm.seccion,
        dm.codigo_clase

        FROM estudiante_materias em

        INNER JOIN docente_materias dm
        ON em.docente_materia_id = dm.id

        INNER JOIN materias m
        ON dm.materia_id = m.id

        WHERE em.estudiante_id = ?
        `,

        [estudiante.id],

        (err, result) => {

            if(err){

                return res.json({
                    message:"Error servidor"
                });

            }

            res.json(result);

        }

    );

});

module.exports = router;