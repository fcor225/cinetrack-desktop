const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @module models/Pelicula
 * @description Modelo de Película para CineTrack (Sequelize + SQLite).
 * Compatible con la tabla Peliculas_Guardadas existente en cinetrack.db.
 *
 * Tabla original: Peliculas_Guardadas (id_local, tmdb_id, titulo, poster_path, estado)
 * Campos extendidos: sinopsis, anio, backdrop_path, valoracion_tmdb, fecha_estreno, etc.
 */

const Pelicula = sequelize.define('Peliculas_Guardadas', {
    id_local: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tmdb_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El título de la película es obligatorio' }
        }
    },
    titulo_original: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    poster_path: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    backdrop_path: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    sinopsis: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    anio: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    /** @type {string} Estado de la película: PENDIENTE, VISTA, FAVORITA, ARCHIVADA, ELIMINADA */
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDIENTE',
        validate: {
            isIn: {
                args: [['PENDIENTE', 'VISTA', 'FAVORITA', 'ARCHIVADA', 'ELIMINADA']],
                msg: 'Estado no válido'
            }
        }
    },
    valoracion_tmdb: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    fecha_estreno: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    duracion: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_visionado: {
        type: DataTypes.DATE,
        allowNull: true
    },
    generos: {
        type: DataTypes.TEXT,
        allowNull: true,
        // Almacenar como JSON string
        get() {
            const raw = this.getDataValue('generos');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('generos', value ? JSON.stringify(value) : null);
        }
    },
    /** @type {number} ID del usuario propietario */
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    }
}, {
    tableName: 'Peliculas_Guardadas',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['tmdb_id', 'usuario_id'],
            name: 'unique_movie_per_user'
        }
    ]
});

module.exports = Pelicula;
