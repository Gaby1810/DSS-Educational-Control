DROP DATABASE IF EXISTS educational_control;
CREATE DATABASE educational_control;
USE educational_control;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    rol ENUM(
        'estudiante',
        'docente',
        'admin'
    ) NOT NULL,

    dui VARCHAR(20) UNIQUE,

    tipo_bachillerato ENUM(
        'Tecnico',
        'General'
    ) NULL,

    anio ENUM(
        '1',
        '2',
        '3'
    ) NULL,

    telefono VARCHAR(20)
);

CREATE TABLE materias (

    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL

);

CREATE TABLE docente_materias (

    id INT AUTO_INCREMENT PRIMARY KEY,

    docente_id INT NOT NULL,

    materia_id INT NOT NULL,

    grado VARCHAR(30),
    seccion VARCHAR(30),

    codigo_clase VARCHAR(20) UNIQUE,

    FOREIGN KEY(docente_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,

    FOREIGN KEY(materia_id)
    REFERENCES materias(id)
    ON DELETE CASCADE

);
-- =====================================
-- ESTUDIANTES EN CLASES
-- =====================================
CREATE TABLE estudiante_materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    docente_materia_id INT NOT NULL,

    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_materia_id) REFERENCES docente_materias(id) ON DELETE CASCADE
);

-- =====================================
-- MATERIALES
-- =====================================
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_materia_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'otro',
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (docente_materia_id) REFERENCES docente_materias(id) ON DELETE CASCADE
);

-- =====================================
-- TAREAS
-- =====================================
CREATE TABLE tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_materia_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'otro',
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME,
    valor DECIMAL(5,2) DEFAULT 10,

    FOREIGN KEY (docente_materia_id) REFERENCES docente_materias(id) ON DELETE CASCADE
);

-- =====================================
-- ENTREGAS
-- =====================================
CREATE TABLE entregas_tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarea_id INT NOT NULL,
    estudiante_id INT NOT NULL,
    archivo VARCHAR(255),
    comentario TEXT,
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota DECIMAL(5,2),
    estado ENUM('Pendiente','Entregado','Calificado') DEFAULT 'Pendiente',

    FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =====================================
-- ASISTENCIA
-- =====================================
CREATE TABLE asistencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_materia_id INT NOT NULL,
    estudiante_id INT NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL,

    FOREIGN KEY (docente_materia_id) REFERENCES docente_materias(id) ON DELETE CASCADE,
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

ALTER TABLE usuarios
ADD foto VARCHAR(255) NULL,
ADD descripcion TEXT NULL,
ADD facebook VARCHAR(255) NULL,
ADD instagram VARCHAR(255) NULL;
Select*from usuarios;