const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");

// =========================
// REGISTER
// =========================

router.post("/register", async (req, res) => {

    const {
        nombre,
        correo,
        password,
        rol,
        grado,
        seccion,
        turno,
        materia_principal,
        telefono
    } = req.body;

    if (!nombre || !correo || !password || !rol) {

        return res.json({
            message: "Faltan datos"
        });

    }

    db.query(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo],
        async (err, result) => {

            if (result.length > 0) {

                return res.json({
                    message: "Correo ya existe"
                });

            }

            const hash = await bcrypt.hash(password, 10);

            const sql = `
            INSERT INTO usuarios
            (
                nombre,
                correo,
                password,
                rol,
                grado,
                seccion,
                turno,
                materia_principal,
                telefono
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    nombre,
                    correo,
                    hash,
                    rol,
                    grado || null,
                    seccion || null,
                    turno || null,
                    materia_principal || null,
                    telefono || null
                ],
                (err) => {

                    if (err) {

                        console.log(err);

                        return res.json({
                            message: "Error servidor"
                        });

                    }

                    res.json({
                        message: "Usuario registrado correctamente"
                    });

                }
            );

        }
    );

});

// =========================
// LOGIN
// =========================
router.post("/login", (req, res) => {

    const { correo, password } = req.body;

    db.query(
        "SELECT * FROM usuarios WHERE correo = ?",
        [correo],
        async (err, result) => {

            if (err) {
                return res.status(500).json({ message: "Error servidor" });
            }

            if (result.length === 0) {
                return res.status(400).json({ message: "Usuario no existe" });
            }

            const user = result[0];

            const ok = await bcrypt.compare(password, user.password);

            if (!ok) {
                return res.status(400).json({ message: "Contraseña incorrecta" });
            }

            // 🔥 GUARDAR SESIÓN BIEN
            req.session.usuario = {
                id: user.id,
                nombre: user.nombre,
                rol: user.rol
            };

            req.session.save((err) => {
                if (err) {
                    return res.status(500).json({ message: "Error guardando sesión" });
                }

                return res.json({
                    message: "Login correcto",
                    rol: user.rol
                });
            });
        }
    );
});

// LOGOUT

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            message: "Sesión cerrada"
        });

    });

});
module.exports = router;