/**
 * @module utils/AppError
 * @description Clase de error operacional personalizada para CineTrack.
 * Extiende Error nativo para añadir statusCode, status y un flag isOperational
 * que permite al error handler global distinguir entre errores predecibles
 * (validación, autenticación) y errores de programador (bugs).
 *
 * @example
 * const AppError = require('../utils/AppError');
 * throw new AppError('Usuario no encontrado', 404);
 * throw new AppError('Acceso denegado: Se requiere rol de administrador', 403);
 */

class AppError extends Error {
    /**
     * Crea una instancia de AppError.
     * @param {string} message - Mensaje descriptivo del error para el cliente.
     * @param {number} statusCode - Código HTTP (400, 401, 403, 404, 500, etc.).
     * @param {string} [code] - Código de error interno opcional (e.g., 'TOKEN_EXPIRED', 'ACTIVE_SESSION').
     */
    constructor(message, statusCode, code = undefined) {
        super(message);

        /** @type {number} Código de estado HTTP */
        this.statusCode = statusCode;

        /** @type {string} 'fail' para 4xx, 'error' para 5xx */
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        /** @type {boolean} true para errores operacionales predecibles */
        this.isOperational = true;

        /** @type {string|undefined} Código de error interno para el frontend */
        this.code = code;

        // Preservar stack trace sin incluir el constructor en la traza
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
