const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @module middleware/auth
 * @description Middleware de autenticación JWT para CineTrack (Sequelize + SQLite).
 * Hereda y mejora el patrón de EasyTourney con:
 * - Manejo explícito de TokenExpiredError vs JsonWebTokenError
 * - Verificación de sessionToken para detección de sesiones concurrentes
 * - Códigos de error semánticos para el frontend
 *
 * @example
 * const auth = require('../middleware/auth');
 * router.get('/profile', auth, controller.getProfile);
 */

/**
 * Protege rutas verificando el token JWT del header x-auth-token.
 *
 * @param {import('express').Request} req - Debe contener header 'x-auth-token'
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * @throws {AppError} 401 - TOKEN_MISSING / TOKEN_EXPIRED / TOKEN_INVALID / USER_NOT_FOUND / SESSION_INVALIDATED
 */
const auth = catchAsync(async (req, res, next) => {
    // 1) Extraer token del header
    const token = req.header('x-auth-token');

    if (!token) {
        return next(new AppError('No hay token de autenticación. Acceso denegado.', 401, 'TOKEN_MISSING'));
    }

    // 2) Verificar y decodificar token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError(
                'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
                401,
                'TOKEN_EXPIRED'
            ));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError(
                'Token no válido o malformado. Por favor, inicia sesión de nuevo.',
                401,
                'TOKEN_INVALID'
            ));
        }
        return next(new AppError('Error al verificar el token de autenticación.', 401, 'TOKEN_ERROR'));
    }

    // 3) Verificar que el usuario sigue existiendo en la BD (Sequelize)
    const user = await User.findByPk(decoded.user.id);

    if (!user) {
        return next(new AppError(
            'El usuario asociado a este token ya no existe.',
            401,
            'USER_NOT_FOUND'
        ));
    }

    // 4) Verificar sessionToken para detección de sesiones concurrentes
    if (user.session_token && user.session_token !== decoded.user.sessionToken) {
        return next(new AppError(
            'Sesión invalidada. Se ha iniciado sesión desde otro dispositivo.',
            401,
            'SESSION_INVALIDATED'
        ));
    }

    // 5) Adjuntar datos del usuario al request
    req.user = decoded.user;
    next();
});

module.exports = auth;
