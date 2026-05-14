/**
 * @module utils/catchAsync
 * @description Higher-Order Function (HOF) que envuelve controladores Express
 * asíncronos para capturar automáticamente errores de promesas rechazadas
 * y delegarlos al middleware global de errores vía next().
 *
 * Elimina la necesidad de bloques try/catch repetitivos en cada controlador.
 * Patrón formalizado a partir de los try/catch manuales de EasyTourney.
 *
 * @example
 * // Antes (EasyTourney):
 * exports.getUsers = async (req, res) => {
 *     try {
 *         const users = await User.find();
 *         res.json(users);
 *     } catch (err) {
 *         res.status(500).send('Error en el servidor');
 *     }
 * };
 *
 * // Después (CineTrack):
 * const catchAsync = require('../utils/catchAsync');
 * exports.getUsers = catchAsync(async (req, res, next) => {
 *     const users = await User.find();
 *     res.json(users);
 * });
 */

/**
 * Envuelve una función asíncrona de Express para capturar errores automáticamente.
 * @param {Function} fn - Función asíncrona (req, res, next) => Promise<void>
 * @returns {Function} Función Express que delega errores a next()
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;
