const AppError = require('../utils/AppError');

/**
 * @module middleware/errorHandler
 * @description Middleware global de manejo de errores de Express (4 parámetros).
 * Centraliza toda la lógica de respuesta de errores en un solo punto.
 *
 * Distingue entre:
 * - Errores operacionales (AppError): respuesta JSON estructurada al cliente.
 * - Errores de programador (bugs): log completo + respuesta genérica 500.
 * - Errores específicos de Sequelize: UniqueConstraintError, ValidationError, ForeignKeyConstraintError.
 * - Errores de JWT: JsonWebTokenError, TokenExpiredError.
 */

/**
 * Maneja errores de restricción única de Sequelize (campos duplicados).
 * @param {Error} err - Error de tipo UniqueConstraintError
 * @returns {AppError} Error operacional con el campo duplicado
 */
const handleUniqueConstraintError = (err) => {
    const fields = err.errors ? err.errors.map(e => e.path).join(', ') : 'campo';
    const message = `El valor para '${fields}' ya está en uso. Por favor, usa otro valor.`;
    return new AppError(message, 400);
};

/**
 * Maneja errores de validación de Sequelize.
 * @param {Error} err - Error de tipo SequelizeValidationError
 * @returns {AppError} Error operacional con mensajes de validación concatenados
 */
const handleSequelizeValidationError = (err) => {
    const errors = err.errors ? err.errors.map(e => e.message) : ['Error de validación'];
    const message = `Datos inválidos: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * Maneja errores de clave foránea de Sequelize.
 * @param {Error} err - Error de tipo ForeignKeyConstraintError
 * @returns {AppError} Error operacional
 */
const handleForeignKeyError = (err) => {
    return new AppError('Error de referencia: el registro relacionado no existe.', 400);
};

/**
 * Maneja errores de JWT expirado.
 * @returns {AppError} Error 401 con código TOKEN_EXPIRED
 */
const handleJWTExpiredError = () => {
    return new AppError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 401, 'TOKEN_EXPIRED');
};

/**
 * Maneja errores de JWT malformado.
 * @returns {AppError} Error 401 con código TOKEN_INVALID
 */
const handleJWTError = () => {
    return new AppError('Token no válido. Por favor, inicia sesión de nuevo.', 401, 'TOKEN_INVALID');
};

/**
 * Envía respuesta de error en entorno de desarrollo (detallada).
 * @param {AppError} err - Error a enviar
 * @param {import('express').Response} res - Objeto response de Express
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        code: err.code || undefined,
        message: err.message,
        stack: err.stack,
        error: err
    });
};

/**
 * Envía respuesta de error en entorno de producción (sanitizada).
 * @param {AppError} err - Error a enviar
 * @param {import('express').Response} res - Objeto response de Express
 */
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            code: err.code || undefined,
            message: err.message
        });
    } else {
        console.error('💥 ERROR NO OPERACIONAL:', err);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Error interno del servidor. Contacta al administrador.'
        });
    }
};

/**
 * Middleware global de errores de Express.
 * @param {Error} err - Error capturado
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err, message: err.message, name: err.name };

        if (error.name === 'SequelizeUniqueConstraintError') error = handleUniqueConstraintError(error);
        if (error.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
        if (error.name === 'SequelizeForeignKeyConstraintError') error = handleForeignKeyError(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = globalErrorHandler;
