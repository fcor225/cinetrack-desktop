const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @module middleware/authorize
 * @description Middleware de autorización RBAC (Role-Based Access Control) para CineTrack.
 * Acepta un array de roles permitidos vía closure.
 *
 * @example
 * router.delete('/users/:id', auth, authorize('administrador'), controller.deleteUser);
 * router.post('/movies', auth, authorize('administrador', 'moderador'), controller.createMovie);
 */

/**
 * Crea un middleware que verifica si el usuario autenticado tiene uno de los roles permitidos.
 * Debe usarse DESPUÉS del middleware auth (requiere req.user con id y rol).
 *
 * @param {...string} roles - Roles permitidos para acceder a la ruta
 * @returns {Function} Middleware de Express (req, res, next)
 *
 * @throws {AppError} 403 - FORBIDDEN | 401 - USER_NOT_FOUND
 */
const authorize = (...roles) => {
    return catchAsync(async (req, res, next) => {
        if (!req.user || !req.user.id) {
            return next(new AppError(
                'Error de autorización: usuario no autenticado.',
                401,
                'AUTH_REQUIRED'
            ));
        }

        // Obtener usuario fresco de la BD para verificar rol actual (Sequelize)
        const user = await User.findByPk(req.user.id, {
            attributes: ['id_usuario', 'rol', 'nombre']
        });

        if (!user) {
            return next(new AppError(
                'El usuario asociado a esta sesión ya no existe.',
                401,
                'USER_NOT_FOUND'
            ));
        }

        if (!roles.includes(user.rol)) {
            return next(new AppError(
                `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}. ` +
                `Tu rol actual es: ${user.rol}.`,
                403,
                'FORBIDDEN'
            ));
        }

        req.user.rol = user.rol;
        req.user.username = user.nombre;

        next();
    });
};

module.exports = authorize;
