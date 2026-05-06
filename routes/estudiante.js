const express = require("express");
const router = express.Router();
const db = require("../db");

// PROTEGER
function verificar(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
}

// DASHBOARD
router.get("/dashboard", verificar, (req, res) => {

    const id = req.session.usuario.id;

    db.query(
        "SELECT nombre, grado, seccion, turno FROM usuarios WHERE id = ?",
        [id],
        (err, result) => {
            res.json(result[0]);
        }
    );
});

module.exports = router;