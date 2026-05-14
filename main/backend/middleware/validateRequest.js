const AppError = require('../utils/AppError');

/**
 * @module middleware/validateRequest
 * @description Middleware de validación de request body genérico.
 * Sin dependencias externas (joi/yup) — usa reglas simples inline.
 *
 * @example
 * const { validate, rules } = require('../middleware/validateRequest');
 * router.post('/register', validate([
 *     rules.required('nombre'),
 *     rules.minLength('password', 6),
 *     rules.isEmail('email')
 * ]), controller.register);
 */

/**
 * Colección de reglas de validación reutilizables.
 */
const rules = {
    /**
     * Campo obligatorio.
     * @param {string} field - Nombre del campo
     * @param {string} [msg] - Mensaje personalizado
     */
    required: (field, msg) => ({
        field,
        check: (value) => value !== undefined && value !== null && value !== '',
        message: msg || `El campo '${field}' es obligatorio.`
    }),

    /**
     * Longitud mínima de string.
     * @param {string} field
     * @param {number} min
     */
    minLength: (field, min, msg) => ({
        field,
        check: (value) => !value || String(value).length >= min,
        message: msg || `El campo '${field}' debe tener al menos ${min} caracteres.`
    }),

    /**
     * Longitud máxima de string.
     * @param {string} field
     * @param {number} max
     */
    maxLength: (field, max, msg) => ({
        field,
        check: (value) => !value || String(value).length <= max,
        message: msg || `El campo '${field}' no puede exceder ${max} caracteres.`
    }),

    /**
     * Formato de email válido.
     * @param {string} field
     */
    isEmail: (field, msg) => ({
        field,
        check: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: msg || `El campo '${field}' debe ser un email válido.`
    }),

    /**
     * Valor numérico dentro de un rango.
     * @param {string} field
     * @param {number} min
     * @param {number} max
     */
    range: (field, min, max, msg) => ({
        field,
        check: (value) => value === undefined || value === null || (Number(value) >= min && Number(value) <= max),
        message: msg || `El campo '${field}' debe estar entre ${min} y ${max}.`
    }),

    /**
     * Valor incluido en lista de opciones.
     * @param {string} field
     * @param {Array} options
     */
    isIn: (field, options, msg) => ({
        field,
        check: (value) => !value || options.includes(value),
        message: msg || `El campo '${field}' debe ser uno de: ${options.join(', ')}.`
    })
};

/**
 * Middleware factory que valida req.body según las reglas proporcionadas.
 * @param {Array<Object>} validationRules - Array de reglas creadas con `rules.*`
 * @returns {Function} Middleware de Express
 */
const validate = (validationRules) => {
    return (req, res, next) => {
        const errors = [];

        for (const rule of validationRules) {
            const value = req.body[rule.field];
            if (!rule.check(value)) {
                errors.push(rule.message);
            }
        }

        if (errors.length > 0) {
            return next(new AppError(errors.join(' '), 400, 'VALIDATION_ERROR'));
        }

        next();
    };
};

module.exports = { validate, rules };
