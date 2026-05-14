const { Sequelize } = require('sequelize');
const path = require('path');

/**
 * @module config/db
 * @description Establece la conexión a SQLite mediante Sequelize.
 * Reutiliza la base de datos existente del proyecto CineTrack (cinetrack.db).
 * Incluye manejo de eventos de conexión y cierre limpio.
 */

// Resolver ruta del archivo .db (relativa al directorio del backend)
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || '../database/cinetrack.db');

/**
 * Instancia de Sequelize configurada para SQLite.
 * @type {Sequelize}
 */
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        // No añadir timestamps automáticamente (los definimos manualmente donde los necesitemos)
        timestamps: false,
        // Usar snake_case para columnas generadas automáticamente
        underscored: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

/**
 * Prueba la conexión a la base de datos y sincroniza los modelos.
 * En desarrollo, usa alter:true para aplicar cambios sin borrar datos.
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ SQLite conectada: ${dbPath}`);

        // Activar soporte de Claves Foráneas en SQLite (desactivado por defecto)
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log('✅ Soporte de Claves Foráneas activado');

        // sync() sin alter — solo crea tablas que no existen, nunca modifica las existentes.
        // alter: true causa "Validation error" si la BD ya tiene datos que no coinciden con el modelo.
        // Los cambios de esquema deben hacerse con migraciones manuales.
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados con la base de datos');

        // Migración manual: Añadir fecha_visionado para el Cine-Calendario (Heatmap)
        try {
            await sequelize.query('ALTER TABLE Peliculas_Guardadas ADD COLUMN fecha_visionado DATETIME;');
            console.log('✅ Columna fecha_visionado añadida a Peliculas_Guardadas');
        } catch (e) {
            // Si ya existe, SQLite lanzará un error que ignoramos.
        }


    } catch (err) {
        console.error(`❌ Error fatal de conexión a SQLite: ${err.message}`);
        process.exit(1);
    }
};

// Cierre limpio al terminar el proceso
process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('🔌 Conexión SQLite cerrada por terminación de la aplicación');
    process.exit(0);
});

module.exports = { sequelize, connectDB };
