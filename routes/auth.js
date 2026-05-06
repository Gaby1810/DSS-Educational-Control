
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");

// REGISTRO
router.post("/register", async (req, res) => {

    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password || !rol) {
        return res.json({ message: "Faltan datos" });
    }

    db.query("SELECT * FROM usuarios WHERE correo = ?", [correo], async (err, result) => {

        if (result.length > 0) {
            return res.json({ message: "Correo ya existe" });
        }

        const hash = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)",
            [nombre, correo, hash, rol],
            (err) => {
                if (err) return res.json({ message: "Error servidor" });

                res.json({ message: "Usuario registrado correctamente" });
            }
        );
    });
});

// LOGIN
router.post("/login", (req, res) => {

    const { correo, password } = req.body;

    db.query("SELECT * FROM usuarios WHERE correo = ?", [correo], async (err, result) => {

        if (result.length === 0) {
            return res.json({ message: "Usuario no existe" });
        }

        const user = result[0];
        const ok = await bcrypt.compare(password, user.password);

        if (!ok) {
            return res.json({ message: "Contraseña incorrecta" });
        }

        req.session.usuario = {
            id: user.id,
            nombre: user.nombre,
            rol: user.rol
        };

        res.json({
            message: "Login correcto",
            rol: user.rol
        });
    });
});

module.exports = router;