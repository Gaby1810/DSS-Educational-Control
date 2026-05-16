const express=require("express");
const router=express.Router();
const db=require("../db");

const multer=require("multer");
const path=require("path");

const storage=multer.diskStorage({

destination:(req,file,cb)=>{

cb(null,"uploads/");

},

filename:(req,file,cb)=>{

cb(

null,

Date.now()+
path.extname(
file.originalname
)

);

}

});

const upload=multer({
storage
});


// =====================================
// CREAR TAREA
// =====================================

router.post(

"/crear/:id",

upload.single(
"archivo"
),

(req,res)=>{

const claseId=
parseInt(
req.params.id
);

if(
isNaN(claseId)
){

return res.status(400)
.json({

message:
"Clase inválida"

});

}

const {

titulo,
descripcion,
fecha_entrega,
puntaje

}=req.body;

let archivo=null;
let tipo="otro";

if(req.file){

archivo=
req.file.filename;

const extension=
path.extname(
req.file.originalname
).toLowerCase();

if(
extension==".pdf"
){

tipo="pdf";

}

else if(

extension==".doc" ||
extension==".docx"

){

tipo="word";

}

else if(

[".jpg",".jpeg",".png"]
.includes(extension)

){

tipo="imagen";

}

}

const sql=`

INSERT INTO tareas
(

docente_materia_id,
titulo,
descripcion,
archivo,
tipo,
fecha_entrega,
valor

)

VALUES
(?,?,?,?,?,?,?)

`;

db.query(

sql,

[

claseId,
titulo,
descripcion,
archivo,
tipo,
fecha_entrega,
puntaje || 10

],

(err,result)=>{

if(err){

console.log(err);

return res.status(500)
.json({

message:
"Error al crear tarea"

});

}

res.json({

message:
"Tarea creada correctamente"

});

}

);

});



// =====================================
// OBTENER TAREAS
// =====================================

router.get("/:id",(req,res)=>{

const sql=`

SELECT

t.id,
t.titulo,
t.descripcion,
t.archivo,
t.fecha_entrega,
t.valor,

COUNT(
CASE
WHEN e.estado='Entregado'
THEN 1
END
)

AS entregados,

COUNT(
CASE
WHEN e.estado='Pendiente'
THEN 1
END
)

AS pendientes,

COUNT(
CASE
WHEN e.estado='Calificado'
THEN 1
END
)

AS calificados

FROM tareas t

LEFT JOIN entregas_tareas e
ON t.id=e.tarea_id

WHERE t.docente_materia_id=?

GROUP BY t.id

ORDER BY t.id DESC

`;

db.query(

sql,

[req.params.id],

(err,result)=>{

if(err){

console.log(err);

return res.status(500)
.json({

message:
"Error cargando tareas"

});

}

res.json(result);

});

});




// =====================================
// VER ENTREGAS
// =====================================

router.get(

"/entregas/:tarea",

(req,res)=>{

const sql=`

SELECT

u.id,
u.nombre,

COALESCE(
e.estado,
'Pendiente'
)

AS estado,

e.nota

FROM estudiante_materias em

INNER JOIN usuarios u
ON u.id=em.estudiante_id

LEFT JOIN entregas_tareas e

ON
u.id=e.estudiante_id
AND
e.tarea_id=?

WHERE em.docente_materia_id=(

SELECT docente_materia_id
FROM tareas
WHERE id=?

)

`;

db.query(

sql,

[
req.params.tarea,
req.params.tarea
],

(err,result)=>{

if(err){

console.log(err);

return res.status(500)
.json({

message:
"Error cargando entregas"

});

}

res.json(result);

});

});




// =====================================
// CALIFICAR
// =====================================

router.post(

"/calificar",

(req,res)=>{

const{

tarea_id,
estudiante_id,
nota

}=req.body;

const sql=`

UPDATE entregas_tareas

SET

nota=?,
estado='Calificado'

WHERE

tarea_id=?
AND estudiante_id=?

`;

db.query(

sql,

[
nota,
tarea_id,
estudiante_id
],

(err)=>{

if(err){

console.log(err);

return res.status(500)
.json({

message:
"Error calificando"

});

}

res.json({

message:
"Calificación guardada"

});

});

});

module.exports=router;