require("dotenv").config();

const express=require("express");
const session=require("express-session");
const path=require("path");
const cors=require("cors");
const helmet=require("helmet");

const rateLimit=require("express-rate-limit");

const app=express();

// Seguridad cabeceras
app.use(helmet());

// limitar peticiones
const limiter=rateLimit({

windowMs:15*60*1000,
max:100,

message:{
message:"Demasiadas peticiones, intenta luego"
}

});

app.use(limiter);

app.use(cors({

origin:"http://localhost:5500",
credentials:true

}));

app.use(express.json());

app.use(express.urlencoded({

extended:true

}));

app.set("trust proxy",1);

// sesiones seguras

app.use(session({

secret:process.env.SESSION_SECRET,

resave:false,

saveUninitialized:false,

cookie:{

maxAge:1000*60*60,

httpOnly:true,

sameSite:"strict",

secure:false

}

}));

// carpetas

app.use(
express.static(
path.join(__dirname,"public")
)
);

app.use(
"/uploads",
express.static(
path.join(__dirname,"uploads")
)
);

// rutas

app.use("/api/auth",require("./routes/auth"));
app.use("/api/docente",require("./routes/docente"));
app.use("/api/materiales",require("./routes/materiales"));
app.use("/api/tareas",require("./routes/tareas"));
app.use("/api/asistencia",require("./routes/asistencia"));
app.use("/api/admin",require("./routes/admin"));
app.use("/api/perfil",require("./routes/perfil"));
app.use("/estudiante",require("./routes/estudiante"));

app.get("/",(req,res)=>{

res.send("Servidor funcionando");

});

const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
`✅ Servidor puerto ${PORT}`
);

});