// electron/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crea la base de datos en la raíz del proyecto
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'cinetrack.db');
const db = new Database(dbPath, { verbose: console.log });

// Inicializar las tablas del MVP
function initDB() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS Usuarios (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Peliculas_Guardadas (
      id_local INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER UNIQUE NOT NULL,
      titulo VARCHAR(100) NOT NULL,
      poster_path VARCHAR(200),
      estado VARCHAR(20) DEFAULT 'PENDIENTE'
    );
  `;
  
  db.exec(createTables);
  console.log("Base de datos SQLite inicializada correctamente.");
}

module.exports = { db, initDB };