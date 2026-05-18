// =====================================
// MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
// =====================================

/**
 * Requiere que haya una sesión iniciada (cualquier rol).
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
}

/**
 * Requiere que la sesión sea de uno de los roles permitidos.
 * Ejemplo: requireRole("admin"), requireRole("docente","admin")
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ message: "No autenticado" });
        }
        if (!roles.includes(req.session.usuario.rol)) {
            return res.status(403).json({ message: "No autorizado" });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
};
