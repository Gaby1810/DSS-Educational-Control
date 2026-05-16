const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads");

    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        );

    }

});

const upload = multer({
    storage
});

// =====================================
// MIS CLASES
// =====================================

router.get("/mis-clases", (req, res) => {

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autorizado"
        });

    }

    const docenteId = req.session.usuario.id;

    const sql = `
    SELECT
        dm.id,
        m.nombre AS materia,
        dm.grado,
        dm.seccion,
        dm.codigo_clase,
        u.nombre AS profesor
    FROM docente_materias dm

    INNER JOIN materias m
    ON dm.materia_id = m.id

    INNER JOIN usuarios u
    ON dm.docente_id = u.id

    WHERE dm.docente_id = ?

    ORDER BY dm.id DESC
    `;

    db.query(sql, [docenteId], (err, result) => {

        if(err){

            console.log(err);

            return res.status(500).json({
                message:"Error servidor"
            });

        }

        res.json(result);

    });

});

// =====================================
// CREAR CLASE
// =====================================

router.post("/crear-clase", (req, res) => {

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autorizado"
        });

    }

    const docenteId = req.session.usuario.id;

    const {
        nombreMateria,
        grado,
        seccion
    } = req.body;

    if(!nombreMateria || !grado || !seccion){

        return res.json({
            message:"Completa todos los campos"
        });

    }

    db.query(
        "SELECT * FROM materias WHERE nombre = ?",
        [nombreMateria],
        (err, materiaResult) => {

            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Error servidor"
                });

            }

            if(materiaResult.length === 0){

                db.query(
                    "INSERT INTO materias(nombre) VALUES(?)",
                    [nombreMateria],
                    (err, insertResult) => {

                        if(err){

                            console.log(err);

                            return res.status(500).json({
                                message:"Error creando materia"
                            });

                        }

                        crearRelacion(insertResult.insertId);

                    }
                );

            }else{

                crearRelacion(materiaResult[0].id);

            }

        }
    );

    function crearRelacion(materiaId){

        const codigo =
        Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase();

        const sql = `
        INSERT INTO docente_materias
        (
            docente_id,
            materia_id,
            grado,
            seccion,
            codigo_clase
        )
        VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                docenteId,
                materiaId,
                grado,
                seccion,
                codigo
            ],
            (err) => {

                if(err){

                    console.log(err);

                    return res.status(500).json({
                        message:"Error creando clase"
                    });

                }

                res.json({
                    message:"Clase creada correctamente"
                });

            }
        );

    }

});

// =====================================
// EDITAR CLASE
// =====================================

router.put("/editar-clase/:id", (req, res) => {

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autorizado"
        });

    }

    const id = req.params.id;

    const {
        materia,
        grado,
        seccion
    } = req.body;

    db.query(
        "SELECT * FROM materias WHERE nombre = ?",
        [materia],
        (err, result) => {

            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Error buscando materia"
                });

            }

            if(result.length === 0){

                db.query(
                    "INSERT INTO materias(nombre) VALUES(?)",
                    [materia],
                    (err, insertResult) => {

                        if(err){

                            console.log(err);

                            return res.status(500).json({
                                message:"Error creando materia"
                            });

                        }

                        actualizarClase(insertResult.insertId);

                    }
                );

            }else{

                actualizarClase(result[0].id);

            }

        }
    );

    function actualizarClase(materiaId){

        const sql = `
        UPDATE docente_materias
        SET
            materia_id = ?,
            grado = ?,
            seccion = ?
        WHERE id = ?
        `;

        db.query(
            sql,
            [
                materiaId,
                grado,
                seccion,
                id
            ],
            (err, result) => {

                if(err){

                    console.log(err);

                    return res.status(500).json({
                        message:"Error actualizando clase"
                    });

                }

                res.json({
                    message:"Clase actualizada correctamente"
                });

            }
        );

    }

});

// =====================================
// ELIMINAR CLASE
// =====================================

router.delete("/eliminar-clase/:id", (req, res) => {

    if (!req.session.usuario) {

        return res.status(401).json({
            message: "No autorizado"
        });

    }

    const id = req.params.id;

    db.query(
        "DELETE FROM docente_materias WHERE id = ?",
        [id],
        (err, result) => {

            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Error eliminando clase"
                });

            }

            res.json({
                message:"Clase eliminada correctamente"
            });

        }
    );

});
// =====================================
// VER ESTUDIANTES DE UNA CLASE
// =====================================

router.get(
"/estudiantes/:id",
(req,res)=>{

const claseId=
req.params.id;

const sql=`

SELECT

u.id,
u.nombre,
u.correo,
u.grado,
u.seccion

FROM estudiante_materias em

INNER JOIN usuarios u
ON em.estudiante_id=u.id

WHERE em.docente_materia_id=?

ORDER BY u.nombre ASC

`;

db.query(

sql,

[claseId],

(err,result)=>{

if(err){

console.log(err);

return res.status(500)
.json({

message:
"Error cargando estudiantes"

});

}

res.json(
result
);

});

});

module.exports = router;