const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @module models/Resena
 * @description Modelo de Reseña para CineTrack (Sequelize + SQLite).
 * Basado en la entidad RESEÑA del diagrama ER del proyecto.
 *
 * Regla de negocio del UML de estado:
 * Solo se puede reseñar una película que esté en estado "VISTA".
 *
 * Restricción: Un usuario solo puede hacer UNA reseña por película (unique constraint).
 */

const Resena = sequelize.define('Resenas', {
    id_resena: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    autor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    pelicula_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Peliculas_Guardadas',
            key: 'id_local'
        }
    },
    texto: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: {
                args: [10, 2000],
                msg: 'La reseña debe tener entre 10 y 2000 caracteres'
            }
        }
    },
    /** @type {number} Valoración en estrellas (1 a 5) */
    estrellas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'La valoración mínima es 1 estrella' },
            max: { args: [5], msg: 'La valoración máxima es 5 estrellas' }
        }
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    contiene_spoilers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    oculta: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Resenas',
    timestamps: false,
    indexes: [
        {
            // Un usuario solo puede hacer UNA reseña por película
            unique: true,
            fields: ['autor_id', 'pelicula_id']
        }
    ]
});

module.exports = Resena;
