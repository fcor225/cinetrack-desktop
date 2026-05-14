const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/baseController
 * @description Factory de controladores CRUD genéricos para CineTrack (Sequelize + SQLite).
 * Genera handlers estándar (getAll, getOne, create, update, delete) para
 * cualquier modelo de Sequelize, eliminando código repetitivo.
 *
 * @example
 * const factory = require('./baseController');
 * const Pelicula = require('../models/Pelicula');
 *
 * exports.getAllPeliculas = factory.getAll(Pelicula);
 * exports.getPelicula = factory.getOne(Pelicula, { include: ['Resenas'] });
 * exports.createPelicula = factory.createOne(Pelicula);
 * exports.updatePelicula = factory.updateOne(Pelicula);
 * exports.deletePelicula = factory.deleteOne(Pelicula);
 */

/**
 * Genera un handler para eliminar un registro por ID.
 *
 * @param {import('sequelize').ModelStatic} Model - Modelo de Sequelize
 * @param {string} [primaryKey='id'] - Nombre de la columna primary key
 * @returns {Function} Handler Express
 * @throws {AppError} 404 - Si no se encuentra el registro
 */
exports.deleteOne = (Model, primaryKey = 'id') =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByPk(req.params.id);

        if (!doc) {
            return next(new AppError(
                `No se encontró el registro con ID: ${req.params.id}`,
                404
            ));
        }

        await doc.destroy();

        res.status(200).json({
            success: true,
            message: 'Registro eliminado correctamente',
            data: null
        });
    });

/**
 * Genera un handler para actualizar un registro por ID.
 *
 * @param {import('sequelize').ModelStatic} Model - Modelo de Sequelize
 * @returns {Function} Handler Express
 * @throws {AppError} 404 - Si no se encuentra el registro
 */
exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByPk(req.params.id);

        if (!doc) {
            return next(new AppError(
                `No se encontró el registro con ID: ${req.params.id}`,
                404
            ));
        }

        await doc.update(req.body);

        res.status(200).json({
            success: true,
            data: doc
        });
    });

/**
 * Genera un handler para crear un nuevo registro.
 *
 * @param {import('sequelize').ModelStatic} Model - Modelo de Sequelize
 * @returns {Function} Handler Express
 */
exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            success: true,
            data: doc
        });
    });

/**
 * Genera un handler para obtener un registro por ID con include (eager loading) opcional.
 *
 * @param {import('sequelize').ModelStatic} Model - Modelo de Sequelize
 * @param {Object} [options] - Opciones adicionales
 * @param {Array} [options.include] - Asociaciones a incluir (eager loading)
 * @returns {Function} Handler Express
 * @throws {AppError} 404 - Si no se encuentra el registro
 */
exports.getOne = (Model, options = {}) =>
    catchAsync(async (req, res, next) => {
        const queryOptions = {};

        if (options.include) {
            queryOptions.include = options.include;
        }

        const doc = await Model.findByPk(req.params.id, queryOptions);

        if (!doc) {
            return next(new AppError(
                `No se encontró el registro con ID: ${req.params.id}`,
                404
            ));
        }

        res.status(200).json({
            success: true,
            data: doc
        });
    });

/**
 * Genera un handler para obtener todos los registros con filtrado,
 * ordenamiento, selección de campos y paginación.
 *
 * Query params soportados:
 * - sort: Campo de ordenamiento (prefijo '-' para descendente)
 * - fields: Campos a incluir (separados por coma)
 * - page: Número de página (default: 1)
 * - limit: Registros por página (default: 25, max: 100)
 * - search: Término de búsqueda en campos de texto
 *
 * @param {import('sequelize').ModelStatic} Model - Modelo de Sequelize
 * @param {Object} [options] - Opciones adicionales
 * @param {string[]} [options.searchFields] - Campos en los que buscar con ?search=
 * @returns {Function} Handler Express
 */
exports.getAll = (Model, options = {}) =>
    catchAsync(async (req, res, next) => {
        const queryOptions = { where: {} };

        // 1) Filtrado por campos del modelo
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // Filtrado simple por igualdad
        Object.keys(queryObj).forEach((key) => {
            queryOptions.where[key] = queryObj[key];
        });

        // 2) Búsqueda por texto
        if (req.query.search && options.searchFields) {
            const searchConditions = options.searchFields.map((field) => ({
                [field]: { [Op.like]: `%${req.query.search}%` }
            }));
            queryOptions.where[Op.or] = searchConditions;
        }

        // 3) Ordenamiento
        if (req.query.sort) {
            const sortFields = req.query.sort.split(',').map((field) => {
                if (field.startsWith('-')) {
                    return [field.substring(1), 'DESC'];
                }
                return [field, 'ASC'];
            });
            queryOptions.order = sortFields;
        } else {
            // Intentar ordenar por created_at o por PK
            queryOptions.order = [['rowid', 'DESC']];
        }

        // 4) Selección de campos
        if (req.query.fields) {
            queryOptions.attributes = req.query.fields.split(',');
        }

        // 5) Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);
        const offset = (page - 1) * limit;

        queryOptions.limit = limit;
        queryOptions.offset = offset;

        // 6) Ejecutar query + contar total
        const { rows: docs, count: total } = await Model.findAndCountAll(queryOptions);

        res.status(200).json({
            success: true,
            results: docs.length,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalResults: total
            },
            data: docs
        });
    });
