const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");

// =====================================
// REGISTER
// =====================================

router.post("/register", async (req, res) => {

const {
nombre,
correo,
password,
rol,
dui,
tipo_bachillerato,
anio,
telefono
} = req.body;

if (!nombre || !correo || !password || !rol) {
return res.json({
message:"Faltan datos"
});
}

/* VALIDAR DUI */
const regexDUI=/^\d{8}-\d$/;

if(dui && !regexDUI.test(dui)){
return res.json({
message:"DUI inválido"
});
}

/* VALIDAR PASSWORD */

if(password.length<6){

return res.json({
message:"Contraseña muy corta"
});

}

db.query(

"SELECT * FROM usuarios WHERE correo=?",
[correo],

async(err,result)=>{

if(err){

console.log(err);

return res.json({
message:"Error servidor"
});

}

if(result.length>0){

return res.json({
message:"Correo ya existe"
});

}

const hash=
await bcrypt.hash(password,10);

let sql="";
let values=[];

/* =====================================
ESTUDIANTE
===================================== */

if(rol==="estudiante"){

sql=`

INSERT INTO usuarios
(nombre,correo,password,rol,tipo_bachillerato,anio,dui)

VALUES(?,?,?,?,?,?,?)

`;

values=[

nombre,
correo,
hash,
rol,
tipo_bachillerato || null,
anio || null,
null

];

}

/* =====================================
DOCENTE
===================================== */

else if(rol==="docente"){

sql=`

INSERT INTO usuarios
(nombre,correo,password,rol,telefono,dui)

VALUES(?,?,?,?,?,?)

`;

values=[

nombre,
correo,
hash,
rol,
telefono || null,
dui || null

];

}

/* =====================================
ADMIN
===================================== */

else{

sql=`

INSERT INTO usuarios
(nombre,correo,password,rol,dui)

VALUES(?,?,?,?,?)

`;

values=[

nombre,
correo,
hash,
rol,
dui || null

];

}

db.query(

sql,
values,

(err)=>{

if(err){

console.log(err);

return res.json({
message:"Error servidor"
});

}

res.json({
message:"Usuario registrado correctamente"
});

});

});

});

// =====================================
// LOGIN
// =====================================

router.post("/login",(req,res)=>{

const{
correo,
password
}=req.body;

db.query(

"SELECT * FROM usuarios WHERE correo=?",
[correo],

async(err,result)=>{

if(err){

return res.status(500).json({
message:"Error servidor"
});

}

if(result.length===0){

return res.status(400).json({
message:"Usuario no existe"
});

}

const user=result[0];

const ok=
await bcrypt.compare(
password,
user.password
);

if(!ok){

return res.status(400).json({
message:"Contraseña incorrecta"
});

}

req.session.usuario={

id:user.id,
nombre:user.nombre,
rol:user.rol

};

req.session.save((err)=>{

if(err){

return res.status(500).json({
message:"Error guardando sesión"
});

}

res.json({

message:"Login correcto",
rol:user.rol

});

});

});

});

// =====================================
// LOGOUT
// =====================================

router.get("/logout",(req,res)=>{

req.session.destroy(()=>{

res.json({
message:"Sesión cerrada"
});

});

});

module.exports=router;