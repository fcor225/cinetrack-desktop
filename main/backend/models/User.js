const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @module models/User
 * @description Modelo de Usuario para CineTrack (Sequelize + SQLite).
 * Compatible con la tabla Usuarios existente en cinetrack.db.
 *
 * Tabla original: Usuarios (id_usuario, nombre, password)
 * Campos extendidos: email, foto, rol, session_token, reset_password_token, etc.
 *
 * Roles RBAC disponibles:
 * - 'usuario': Usuario estándar (puede crear listas, reseñas)
 * - 'moderador': Puede moderar reseñas y contenido
 * - 'administrador': Acceso total al sistema
 */

const User = sequelize.define('Usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: {
                args: [3, 50],
                msg: 'El nombre de usuario debe tener entre 3 y 50 caracteres'
            }
        }
    },
    email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
        validate: {
            isEmail: { msg: 'Por favor, introduce un correo electrónico válido' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener al menos 6 caracteres'
            }
        }
    },
    foto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
    },
    rol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'usuario',
        validate: {
            isIn: {
                args: [['usuario', 'moderador', 'administrador']],
                msg: 'El rol debe ser: usuario, moderador o administrador'
            }
        }
    },
    /** Token de sesión para detección de logins concurrentes (patrón EasyTourney) */
    session_token: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null
    },
    reset_password_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    /** Puntos de experiencia acumulados por el usuario (Sistema de Rangos) */
    xp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'Usuarios',
    timestamps: false
});

module.exports = User;
