const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================
// MIDDLEWARE ADMIN
// =====================================

function verificarAdmin(req,res,next){

if(!req.session || !req.session.usuario){

return res.status(401).json({
message:"No autenticado"
});

}

if(req.session.usuario.rol!=="admin"){

return res.status(403).json({
message:"No autorizado"
});

}

next();

}

// =====================================
// DASHBOARD
// =====================================

router.get("/dashboard", verificarAdmin, (req,res)=>{

const sql=`

SELECT

(SELECT COUNT(*) FROM usuarios) AS usuarios,

(SELECT COUNT(*) FROM usuarios
WHERE rol='estudiante') AS estudiantes,

(SELECT COUNT(*) FROM usuarios
WHERE rol='docente') AS docentes,

(SELECT COUNT(*) FROM docente_materias) AS clases

`;

db.query(sql,(err,result)=>{

if(err){

return res.status(500).json({
message:"Error servidor"
});

}

res.json(result[0]);

});

});

// =====================================
// ACTIVIDAD RECIENTE
// =====================================

router.get("/actividad", verificarAdmin, (req,res)=>{

const sql=`

SELECT
'usuario' AS tipo,
nombre AS titulo,
correo AS descripcion,
id
FROM usuarios

UNION

SELECT
'clase' AS tipo,
m.nombre AS titulo,
u.nombre AS descripcion,
dm.id
FROM docente_materias dm
INNER JOIN materias m
ON dm.materia_id=m.id
INNER JOIN usuarios u
ON dm.docente_id=u.id

ORDER BY id DESC
LIMIT 8

`;

db.query(sql,(err,result)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json(result);

});

});

// =====================================
// LISTAR USUARIOS
// =====================================

router.get("/usuarios", verificarAdmin, (req,res)=>{

const sql=`
SELECT
id,
nombre,
correo,
rol,
telefono
FROM usuarios
ORDER BY id DESC
`;

db.query(sql,(err,result)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json(result);

});

});

// =====================================
// CREAR USUARIO
// =====================================

router.post("/usuarios", verificarAdmin, (req,res)=>{

const {
nombre,
correo,
password,
rol
}=req.body;

const sql=`
INSERT INTO usuarios
(nombre,correo,password,rol)
VALUES(?,?,?,?)
`;

db.query(
sql,
[nombre,correo,password,rol],
(err)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json({
message:"Usuario creado"
});

});

});

// =====================================
// EDITAR USUARIO
// =====================================

router.put("/usuarios/:id", verificarAdmin, (req,res)=>{

const {
nombre,
correo,
rol
}=req.body;

const sql=`
UPDATE usuarios
SET
nombre=?,
correo=?,
rol=?
WHERE id=?
`;

db.query(
sql,
[nombre,correo,rol,req.params.id],
(err)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json({
message:"Usuario actualizado"
});

});

});

// =====================================
// ELIMINAR USUARIO
// =====================================

router.delete("/usuarios/:id", verificarAdmin, (req,res)=>{

db.query(
"DELETE FROM usuarios WHERE id=?",
[req.params.id],
(err)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json({
message:"Usuario eliminado"
});

});

});
// =====================================
// REPORTES
// =====================================

router.get("/reportes", verificarAdmin, (req,res)=>{

const sql=`

SELECT

(SELECT COUNT(*)
FROM usuarios
WHERE rol='estudiante') AS alumnos,

(SELECT ROUND(AVG(nota),1)
FROM entregas_tareas
WHERE nota IS NOT NULL) AS promedio,

(
SELECT ROUND(
(
COUNT(
CASE WHEN presente=1 THEN 1 END
) * 100.0
) / COUNT(*)
)
FROM asistencia
) AS asistencia

`;

db.query(sql,(err,result)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

const info=result[0];

// ================= AÑOS BACHILLERATO =================

const gradosSql=`

SELECT

CASE

WHEN anio='1'
THEN '1° Año Bachillerato'

WHEN anio='2'
THEN '2° Año Bachillerato'

WHEN anio='3'
THEN '3° Año Bachillerato'

END AS grado,

COUNT(*) AS total,

(
SELECT COUNT(*)
FROM docente_materias dm
WHERE dm.grado=u.anio
) AS clases

FROM usuarios u

WHERE rol='estudiante'

GROUP BY anio

ORDER BY anio ASC

`;

db.query(gradosSql,(err2,grados)=>{

if(err2){

return res.status(500).json({
message:"Error"
});

}

res.json({

alumnos:info.alumnos || 0,

promedio:info.promedio || 0,

asistencia:info.asistencia || 0,

graficos:grados

});

});

});

});

// =====================================
// CLASES
// =====================================

router.get("/clases", verificarAdmin, (req,res)=>{

const sql=`

SELECT

dm.id,

m.nombre AS materia,

u.nombre AS docente,

dm.grado,

dm.seccion,

dm.codigo_clase,

COUNT(em.id) AS estudiantes

FROM docente_materias dm

INNER JOIN materias m
ON dm.materia_id=m.id

INNER JOIN usuarios u
ON dm.docente_id=u.id

LEFT JOIN estudiante_materias em
ON em.docente_materia_id=dm.id

GROUP BY dm.id

ORDER BY dm.id DESC

`;

db.query(sql,(err,result)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json(result);

});

});
module.exports = router;