const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @module models/Lista
 * @description Modelo de Lista para CineTrack (Sequelize + SQLite).
 * Cada usuario puede tener listas predefinidas (Favoritas, Vistas, Pendientes)
 * y listas personalizadas. Las películas se vinculan mediante ListaPelicula.
 *
 * Tipos de lista predefinidos (del prototipo Mi Colección):
 * - 'favoritas': Películas marcadas como favoritas
 * - 'vistas': Películas ya vistas (habilita opción de reseñar)
 * - 'pendientes': Películas por ver
 * - 'personalizada': Listas creadas por el usuario
 */

const Lista = sequelize.define('Listas', {
    id_lista: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre de la lista es obligatorio' }
        }
    },
    tipo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: {
                args: [['favoritas', 'vistas', 'pendientes', 'personalizada']],
                msg: 'El tipo de lista debe ser: favoritas, vistas, pendientes o personalizada'
            }
        }
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    es_publica: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Listas',
    timestamps: false
});

/**
 * @description Tabla intermedia para la relación N:M entre Listas y Películas.
 */
const ListaPelicula = sequelize.define('Lista_Peliculas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    lista_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Listas',
            key: 'id_lista'
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
    fecha_agregada: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Lista_Peliculas',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['lista_id', 'pelicula_id']
        }
    ]
});

module.exports = { Lista, ListaPelicula };
