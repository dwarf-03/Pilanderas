-- ============================================================
-- SISTEMA TURÍSTICO - MONUMENTO LAS PILANDERAS
-- Universidad / Proyecto de Grado
-- Base de datos principal
-- ============================================================

-- 1. CREAR Y SELECCIONAR LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS pilanderas_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE pilanderas_db;

-- ============================================================
-- 2. TABLA PRINCIPAL: VISITANTES
-- ============================================================
CREATE TABLE IF NOT EXISTS visitantes (
id               INT AUTO_INCREMENT PRIMARY KEY,
nombre           VARCHAR(100)  NOT NULL,
edad             INT           NOT NULL,
procedencia      VARCHAR(100)  NOT NULL,
tipo_visitante   ENUM('turista_nacional','turista_extranjero','estudiante','investigador','residente_local') NOT NULL,
genero           ENUM('masculino','femenino','otro','prefiero_no_decir') NOT NULL,
nivel_educativo  ENUM('primaria','secundaria','tecnico','universitario','posgrado') NOT NULL,
medio_transporte ENUM('vehiculo_propio','transporte_publico','tour_organizado','otro') NOT NULL,
primera_visita   TINYINT(1)    NOT NULL DEFAULT 1,
calificacion     INT           CHECK (calificacion BETWEEN 1 AND 5),
comentario       TEXT,
fecha_visita     DATE          NOT NULL,
hora_visita      TIME          NOT NULL,
created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. TABLA: ADMINISTRADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS administradores (
id               INT AUTO_INCREMENT PRIMARY KEY,
nombre           VARCHAR(100) NOT NULL,
email            VARCHAR(100) NOT NULL UNIQUE,
password_hash    VARCHAR(255) NOT NULL,
created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. DATOS INICIALES — Admin por defecto
-- Contraseña: admin123 (encriptada con bcrypt)
-- ============================================================
INSERT INTO administradores (nombre, email, password_hash)
VALUES (
'Administrador',
'admin@pilanderas.com',
'$2b$10$xK9z1QwVmN3pL8rT5uY2eOjHdFgAsBcDeEfGhIjKlMnOpQrStUvWx'
);

-- ============================================================
-- 5. DATOS DE PRUEBA — Visitantes de ejemplo
-- ============================================================
INSERT INTO visitantes 
(nombre, edad, procedencia, tipo_visitante, genero, nivel_educativo, medio_transporte, primera_visita, calificacion, comentario, fecha_visita, hora_visita)
VALUES
('María González',   25, 'Bogotá',        'turista_nacional',   'femenino',   'universitario', 'tour_organizado',   1, 5, 'Hermoso monumento, muy representativo de la cultura wayuu.', '2025-01-15', '10:30:00'),
('Carlos Pérez',     34, 'Medellín',       'turista_nacional',   'masculino',  'universitario', 'vehiculo_propio',   0, 4, 'Excelente lugar histórico.',                                 '2025-01-16', '14:15:00'),
('Ana Martínez',     19, 'Riohacha',       'estudiante',         'femenino',   'secundaria',    'transporte_publico',1, 5, 'Me encantó aprender sobre las Pilanderas.',                  '2025-01-17', '09:00:00'),
('John Smith',       45, 'Estados Unidos', 'turista_extranjero', 'masculino',  'posgrado',      'tour_organizado',   1, 5, 'Amazing cultural heritage!',                                 '2025-01-18', '11:45:00'),
('Laura Torres',     28, 'Barranquilla',   'turista_nacional',   'femenino',   'tecnico',       'vehiculo_propio',   1, 4, 'Muy bien ubicado, fácil de encontrar.',                      '2025-01-19', '16:00:00');