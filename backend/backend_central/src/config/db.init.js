"use strict";
import { pool } from "./db.js";

export async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS empresa (
        codigo       INT AUTO_INCREMENT PRIMARY KEY,
        nombre       VARCHAR(100) NOT NULL,
        contacto     VARCHAR(150)
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        codigo_usuario  INT AUTO_INCREMENT PRIMARY KEY,
        codigo_empresa  INT NULL,
        correo          VARCHAR(150) NOT NULL UNIQUE,
        contrasena      VARCHAR(255) NOT NULL,
        rol             ENUM('superadmin','admin','usuario') NOT NULL DEFAULT 'usuario',
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) ON DELETE SET NULL
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS filtros (
        codigo          INT AUTO_INCREMENT PRIMARY KEY,
        codigo_empresa  INT NOT NULL,
        nro_salida      INT NOT NULL,
        prefijo         VARCHAR(50) NOT NULL,
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) ON DELETE CASCADE
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salidas (
        codigo          INT AUTO_INCREMENT PRIMARY KEY,
        codigo_empresa  INT NULL,
        nro_salida      INT NOT NULL DEFAULT 0,
        codigo_barras   VARCHAR(100) NULL,
        estado          ENUM('distribuido','descarte_conocido','descarte_desconocido') NOT NULL DEFAULT 'distribuido',
        fecha_salida    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tablas creadas / verificadas");
  } finally {
    conn.release();
  }
}