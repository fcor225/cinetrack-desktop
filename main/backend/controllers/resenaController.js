const { Op } = require('sequelize');
const Resena = require('../models/Resena');
const Pelicula = require('../models/Pelicula');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const awardXP = require('../utils/awardXP');
const { XP_REWARDS } = require('../utils/rankSystem');

/**
 * @module controllers/resenaController
 * @description CRUD de Reseñas para CineTrack.
 * Regla de negocio del UML: Solo se puede reseñar una película en estado "VISTA" o "FAVORITA".
 */

exports.crearResena = catchAsync(async (req, res, next) => {
    const { pelicula_id, texto, estrellas, contiene_spoilers } = req.body;
    if (!pelicula_id || !texto || !estrellas) return next(new AppError('pelicula_id, texto y estrellas son obligatorios.', 400));
    if (estrellas < 1 || estrellas > 5) return next(new AppError('Las estrellas deben estar entre 1 y 5.', 400));
    if (texto.length < 10) return next(new AppError('La reseña debe tener al menos 10 caracteres.', 400));

    // Verificar que la película existe y está en estado VISTA o FAVORITA
    const pelicula = await Pelicula.findOne({ where: { id_local: pelicula_id, usuario_id: req.user.id } });
    if (!pelicula) return next(new AppError('Película no encontrada en tu colección.', 404));
    if (!['VISTA', 'FAVORITA'].includes(pelicula.estado)) {
        return next(new AppError('Solo puedes reseñar películas marcadas como Vistas o Favoritas.', 400, 'INVALID_STATE'));
    }

    // Verificar que no exista ya una reseña de este usuario para esta película
    const existente = await Resena.findOne({ where: { autor_id: req.user.id, pelicula_id } });
    if (existente) return next(new AppError('Ya has escrito una reseña para esta película.', 400, 'DUPLICATE_REVIEW'));

    const resena = await Resena.create({ autor_id: req.user.id, pelicula_id, texto, estrellas, contiene_spoilers: contiene_spoilers || false });

    // +100 XP por escribir una reseña
    await awardXP(req.user.id, XP_REWARDS.ESCRIBIR_RESENA);

    res.status(201).json({ success: true, message: 'Reseña publicada', data: resena });
});

exports.getMisResenas = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await Resena.findAndCountAll({
        where: { autor_id: req.user.id },
        include: [{ model: Pelicula, as: 'pelicula', attributes: ['id_local', 'titulo', 'poster_path', 'tmdb_id', 'anio'] }],
        order: [['fecha', 'DESC']],
        limit: parseInt(limit), offset
    });
    res.status(200).json({ success: true, results: rows.length, pagination: { page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)), totalResults: count }, data: rows });
});

exports.getResenasDePelicula = catchAsync(async (req, res, next) => {
    const resenas = await Resena.findAll({
        where: { pelicula_id: req.params.peliculaId },
        include: [{ model: User, as: 'autor', attributes: ['id_usuario', 'nombre', 'foto'] }],
        order: [['fecha', 'DESC']]
    });
    res.status(200).json({ success: true, results: resenas.length, data: resenas });
});

exports.editarResena = catchAsync(async (req, res, next) => {
    const resena = await Resena.findOne({ where: { id_resena: req.params.id, autor_id: req.user.id } });
    if (!resena) return next(new AppError('Reseña no encontrada.', 404));
    const { texto, estrellas, contiene_spoilers } = req.body;
    const updates = {};
    if (texto) { if (texto.length < 10) return next(new AppError('Mínimo 10 caracteres.', 400)); updates.texto = texto; }
    if (estrellas) { if (estrellas < 1 || estrellas > 5) return next(new AppError('Estrellas: 1-5.', 400)); updates.estrellas = estrellas; }
    if (contiene_spoilers !== undefined) updates.contiene_spoilers = contiene_spoilers;
    await resena.update(updates);
    res.status(200).json({ success: true, data: resena });
});

exports.eliminarResena = catchAsync(async (req, res, next) => {
    const resena = await Resena.findOne({ where: { id_resena: req.params.id, autor_id: req.user.id } });
    if (!resena) return next(new AppError('Reseña no encontrada.', 404));
    await resena.destroy();
    res.status(200).json({ success: true, message: 'Reseña eliminada', data: null });
});
