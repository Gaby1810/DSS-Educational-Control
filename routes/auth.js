const express=require("express");
const router=express.Router();
const bcrypt=require("bcrypt");
const db=require("../db");

const intentos={};

// =====================================
// REGISTER
// =====================================

router.post("/register",async(req,res)=>{

const{

nombre,
correo,
password,
rol,
dui,
tipo_bachillerato,
anio,
telefono

}=req.body;


// Validar campos básicos

if(
!nombre ||
!correo ||
!password ||
!rol
){

return res.status(400).json({
message:"Completa todos los campos"
});

}

// impedir admin desde frontend

if(rol==="admin"){

return res.status(403).json({
message:"No permitido"
});

}


// validar correo

const correoRegex=
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!correoRegex.test(correo)){

return res.status(400).json({
message:"Correo inválido"
});

}


// contraseña fuerte

const passRegex=
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

if(!passRegex.test(password)){

return res.status(400).json({

message:
"Contraseña: mínimo 8 caracteres, mayúscula, número y símbolo"

});

}


// validar DUI

if(dui){

const regexDUI=/^\d{8}-\d$/;

if(!regexDUI.test(dui)){

return res.status(400).json({
message:"DUI inválido"
});

}

}


// verificar correo repetido

db.query(

"SELECT id FROM usuarios WHERE correo=?",
[correo],

async(err,result)=>{

if(err){

return res.status(500).json({
message:"Error servidor"
});

}

if(result.length>0){

return res.status(400).json({
message:"Correo ya registrado"
});

}


const hash=
await bcrypt.hash(
password,
12
);


let sql="";
let values=[];


// estudiante

if(rol==="estudiante"){

sql=`

INSERT INTO usuarios
(nombre,correo,password,rol,tipo_bachillerato,anio)

VALUES(?,?,?,?,?,?)

`;

values=[

nombre,
correo,
hash,
rol,
tipo_bachillerato||null,
anio||null

];

}


// docente

if(rol==="docente"){

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
telefono||null,
dui||null

];

}

db.query(
sql,
values,
(err)=>{

if(err){

console.log(err);

return res.status(500).json({
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


// bloquear después de 5 intentos

if(intentos[correo]){

if(
intentos[correo].cantidad>=5 &&
Date.now()<intentos[correo].bloqueadoHasta
){

return res.status(429).json({

message:
"Cuenta bloqueada 15 minutos"

});

}

}


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


// contraseña incorrecta

if(!ok){

if(!intentos[correo]){

intentos[correo]={

cantidad:0,
bloqueadoHasta:0

};

}

intentos[correo].cantidad++;

if(intentos[correo].cantidad>=5){

intentos[correo].bloqueadoHasta=

Date.now()+(15*60*1000);

}

return res.status(400).json({
message:"Contraseña incorrecta"
});

}


// limpiar intentos

delete intentos[correo];


// regenerar sesión

req.session.regenerate((err)=>{

if(err){

return res.status(500).json({
message:"Error sesión"
});

}

req.session.usuario={

id:user.id,
nombre:user.nombre,
rol:user.rol

};

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

res.clearCookie("connect.sid");

res.json({
message:"Sesión cerrada"
});

});

});

module.exports=router;