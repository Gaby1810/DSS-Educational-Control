// =====================================
// CONFIGURACIÓN SEGURA DE MULTER
// =====================================
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Tipos de archivo permitidos
const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"];

const ALLOWED_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename:    (req, file, cb) => {
        // Nombre seguro: random + timestamp + extensión validada
        const ext = path.extname(file.originalname).toLowerCase();
        const safe = crypto.randomBytes(12).toString("hex");
        cb(null, `${Date.now()}-${safe}${ext}`);
    },
});

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
        return cb(new Error("Extensión de archivo no permitida"));
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new Error("Tipo MIME no permitido"));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
        files: 1,
    },
});

module.exports = upload;
