const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// OBTENER FECHA
// =====================================

function obtenerFecha(){

const hoy = new Date();

const year = hoy.getFullYear();

const month =
String(hoy.getMonth() + 1)
.padStart(2,"0");

const day =
String(hoy.getDate())
.padStart(2,"0");

return `${year}-${month}-${day}`;

}

// =====================================
// VER ESTUDIANTES
// =====================================

router.get("/:clase",(req,res)=>{

const clase = req.params.clase;

const fecha =
req.query.fecha || obtenerFecha();

const sql = `

SELECT

u.id,
u.nombre,

a.presente,
a.fecha,

(
SELECT COUNT(*)
FROM asistencia aa

WHERE
aa.estudiante_id=u.id
AND aa.docente_materia_id=em.docente_materia_id
AND aa.presente=1

) AS total_presentes,

(
SELECT COUNT(*)
FROM asistencia aa

WHERE
aa.estudiante_id=u.id
AND aa.docente_materia_id=em.docente_materia_id
AND aa.presente=0

) AS total_ausentes

FROM estudiante_materias em

INNER JOIN usuarios u
ON u.id = em.estudiante_id

LEFT JOIN asistencia a

ON a.estudiante_id = u.id
AND a.docente_materia_id = em.docente_materia_id
AND a.fecha = ?

WHERE em.docente_materia_id = ?

ORDER BY u.nombre ASC

`;

db.query(

sql,

[
fecha,
clase
],

(err,result)=>{

if(err){

console.log(err);

return res.status(500).json({
message:"Error servidor"
});

}

res.json({

fecha,
estudiantes: result

});

}

);

});

// =====================================
// GUARDAR ASISTENCIA
// =====================================

router.post("/guardar",(req,res)=>{

const {
clase_id,
estudiante_id,
presente,
fecha
} = req.body;

const fechaFinal =
fecha || obtenerFecha();

// =====================================
// VERIFICAR
// =====================================

const verificar = `

SELECT *
FROM asistencia

WHERE

docente_materia_id = ?
AND estudiante_id = ?
AND fecha = ?

`;

db.query(

verificar,

[
clase_id,
estudiante_id,
fechaFinal
],

(err,existe)=>{

if(err){

console.log(err);

return res.status(500).json({
message:"Error"
});

}

// =====================================
// ACTUALIZAR
// =====================================

if(existe.length > 0){

const update = `

UPDATE asistencia

SET presente = ?

WHERE

docente_materia_id = ?
AND estudiante_id = ?
AND fecha = ?

`;

db.query(

update,

[
presente ? 1 : 0,
clase_id,
estudiante_id,
fechaFinal
],

(err)=>{

if(err){

console.log(err);

return res.status(500).json({
message:"Error actualizando"
});

}

res.json({
message:"Asistencia actualizada"
});

}

);

}

// =====================================
// INSERTAR
// =====================================

else{

const insert = `

INSERT INTO asistencia
(

docente_materia_id,
estudiante_id,
fecha,
presente

)

VALUES
(?,?,?,?)

`;

db.query(

insert,

[
clase_id,
estudiante_id,
fechaFinal,
presente ? 1 : 0
],

(err)=>{

if(err){

console.log(err);

return res.status(500).json({
message:"Error guardando"
});

}

res.json({
message:"Asistencia guardada"
});

}

);

}

}

);

});
// =====================================
// REPORTE DEL ESTUDIANTE
// =====================================

router.get("/reporte/:clase/:estudiante",(req,res)=>{

const {
clase,
estudiante
} = req.params;

const sql = `

SELECT

fecha,
presente

FROM asistencia

WHERE

docente_materia_id = ?
AND estudiante_id = ?

ORDER BY fecha DESC

`;

db.query(

sql,

[
clase,
estudiante
],

(err,result)=>{

if(err){

console.log(err);

return res.status(500).json({
message:"Error cargando reporte"
});

}

res.json(result);

}

);

});

module.exports = router;