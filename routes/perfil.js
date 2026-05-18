const express=require("express");
const router=express.Router();
const db=require("../db");
const multer=require("multer");

// ================= STORAGE =================

const storage=multer.diskStorage({

destination:(req,file,cb)=>{

cb(null,"uploads/");

},

filename:(req,file,cb)=>{

cb(null,Date.now()+"-"+file.originalname);

}

});

const upload=multer({storage});

// ================= OBTENER PERFIL =================

router.get("/:id",(req,res)=>{

db.query(

`SELECT
id,
nombre,
correo,
rol,
telefono,
foto,
descripcion,
facebook,
instagram
FROM usuarios
WHERE id=?`,

[req.params.id],

(err,result)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json(result[0]);

}

);

});

// ================= ACTUALIZAR PERFIL =================

router.put(
"/:id",

upload.single("foto"),

(req,res)=>{

const {
nombre,
telefono,
descripcion,
facebook,
instagram
}=req.body;

let foto=null;

if(req.file){
foto=req.file.filename;
}

let sql=`
UPDATE usuarios
SET
nombre=?,
telefono=?,
descripcion=?,
facebook=?,
instagram=?
`;

let values=[
nombre,
telefono,
descripcion,
facebook,
instagram
];

if(foto){

sql+=`, foto=?`;
values.push(foto);

}

sql+=` WHERE id=?`;

values.push(req.params.id);

db.query(sql,values,(err)=>{

if(err){

return res.status(500).json({
message:"Error"
});

}

res.json({
message:"Perfil actualizado"
});

});

});

module.exports=router;