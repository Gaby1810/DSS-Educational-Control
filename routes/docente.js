const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// VERIFICAR SESIÓN
// =====================================

function verificarSesion(req, res, next){

    if(!req.session.usuario){

        return res.status(401).json({
            message:"No autorizado"
        });

    }

    next();

}

// =====================================
// MIS MATERIAS
// =====================================

router.get(
"/mis-materias",
verificarSesion,

(req, res) => {

    const docenteId =
    req.session.usuario.id;

    const sql = `
    SELECT
        dm.id,
        m.nombre,
        dm.grado,
        dm.seccion,
        dm.codigo_clase
    FROM docente_materias dm
    INNER JOIN materias m
    ON dm.materia_id = m.id
    WHERE dm.docente_id = ?
    `;

    db.query(
    sql,
    [docenteId],

    (err, result) => {

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

router.post(
"/crear-clase",
verificarSesion,

(req, res) => {

    console.log(req.body);

    const docenteId =
    req.session.usuario.id;

    const {
        nombreMateria,
        grado,
        seccion
    } = req.body;

    // VALIDAR

    if(
        !nombreMateria ||
        !grado ||
        !seccion
    ){

        return res.status(400).json({
            message:"Complete todos los campos"
        });

    }

    // =====================================
    // BUSCAR MATERIA
    // =====================================

    const sqlBuscar = `
    SELECT * FROM materias
    WHERE nombre = ?
    `;

    db.query(
    sqlBuscar,
    [nombreMateria],

    (err, materia) => {

        if(err){

            console.log(err);

            return res.status(500).json({
                message:"Error servidor"
            });

        }

        // =====================================
        // SI NO EXISTE -> CREAR
        // =====================================

        if(materia.length === 0){

            const sqlInsertMateria = `
            INSERT INTO materias(nombre)
            VALUES(?)
            `;

            db.query(
            sqlInsertMateria,
            [nombreMateria],

            (err, nuevaMateria) => {

                if(err){

                    console.log(err);

                    return res.status(500).json({
                        message:"Error creando materia"
                    });

                }

                crearClase(
                    nuevaMateria.insertId
                );

            });

        }

        // =====================================
        // SI EXISTE
        // =====================================

        else{

            crearClase(
                materia[0].id
            );

        }

    });

    // =====================================
    // FUNCIÓN CREAR CLASE
    // =====================================

    function crearClase(materiaId){

        // GENERAR CÓDIGO

        const codigo =
        Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase();

        const sqlClase = `
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
        sqlClase,

        [
            docenteId,
            materiaId,
            grado,
            seccion,
            codigo
        ],

        (err, result) => {

            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Error al crear clase"
                });

            }

            res.json({

                message:
                "Clase creada correctamente",

                codigo_clase:
                codigo

            });

        });

    }

});

// =====================================
// ESTUDIANTES
// =====================================

router.get(
"/estudiantes/:id",

(req, res) => {

    res.json([]);

});

// =====================================
// TAREAS
// =====================================

router.get(
"/tareas/:id",

(req, res) => {

    res.json([]);

});

module.exports = router;