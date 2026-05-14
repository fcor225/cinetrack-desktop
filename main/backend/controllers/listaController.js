const { Op } = require('sequelize');
const { Lista, ListaPelicula } = require('../models/Lista');
const Pelicula = require('../models/Pelicula');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/listaController
 * @description CRUD de Listas para CineTrack con relación N:M vía ListaPelicula.
 */

exports.crearLista = catchAsync(async (req, res, next) => {
    const { nombre, tipo = 'personalizada', descripcion, es_publica } = req.body;
    if (!nombre || !nombre.trim()) return next(new AppError('Nombre obligatorio.', 400));

    const existente = await Lista.findOne({ where: { usuario_id: req.user.id, nombre: nombre.trim() } });
    if (existente) return next(new AppError('Ya tienes una lista con ese nombre.', 400));

    const lista = await Lista.create({ usuario_id: req.user.id, nombre: nombre.trim(), tipo, descripcion: descripcion || null, es_publica: es_publica || false });
    res.status(201).json({ success: true, message: 'Lista creada', data: lista });
});

exports.getMisListas = catchAsync(async (req, res, next) => {
    const listas = await Lista.findAll({
        where: { usuario_id: req.user.id },
        include: [{ model: Pelicula, as: 'peliculas', attributes: ['id_local', 'titulo', 'poster_path'], through: { attributes: [] } }],
        order: [['id_lista', 'DESC']]
    });
    res.status(200).json({ success: true, results: listas.length, data: listas });
});

exports.getLista = catchAsync(async (req, res, next) => {
    const lista = await Lista.findOne({
        where: { id_lista: req.params.id, usuario_id: req.user.id },
        include: [{ model: Pelicula, as: 'peliculas', through: { attributes: ['fecha_agregada'] } }]
    });
    if (!lista) return next(new AppError('Lista no encontrada.', 404));
    res.status(200).json({ success: true, data: lista });
});

exports.actualizarLista = catchAsync(async (req, res, next) => {
    const lista = await Lista.findOne({ where: { id_lista: req.params.id, usuario_id: req.user.id } });
    if (!lista) return next(new AppError('Lista no encontrada.', 404));
    const { nombre, descripcion, es_publica } = req.body;
    const updates = {};
    if (nombre) updates.nombre = nombre.trim();
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (es_publica !== undefined) updates.es_publica = es_publica;
    await lista.update(updates);
    res.status(200).json({ success: true, data: lista });
});

exports.eliminarLista = catchAsync(async (req, res, next) => {
    const lista = await Lista.findOne({ where: { id_lista: req.params.id, usuario_id: req.user.id } });
    if (!lista) return next(new AppError('Lista no encontrada.', 404));
    await ListaPelicula.destroy({ where: { lista_id: lista.id_lista } });
    await lista.destroy();
    res.status(200).json({ success: true, message: 'Lista eliminada', data: null });
});

exports.agregarPelicula = catchAsync(async (req, res, next) => {
    const { pelicula_id } = req.body;
    if (!pelicula_id) return next(new AppError('pelicula_id obligatorio.', 400));
    const lista = await Lista.findOne({ where: { id_lista: req.params.id, usuario_id: req.user.id } });
    if (!lista) return next(new AppError('Lista no encontrada.', 404));
    const pelicula = await Pelicula.findOne({ where: { id_local: pelicula_id, usuario_id: req.user.id } });
    if (!pelicula) return next(new AppError('Película no encontrada en tu colección.', 404));
    const yaExiste = await ListaPelicula.findOne({ where: { lista_id: lista.id_lista, pelicula_id } });
    if (yaExiste) return next(new AppError('Ya está en la lista.', 400));
    await ListaPelicula.create({ lista_id: lista.id_lista, pelicula_id });
    res.status(201).json({ success: true, message: `'${pelicula.titulo}' añadida a '${lista.nombre}'` });
});

exports.quitarPelicula = catchAsync(async (req, res, next) => {
    const lista = await Lista.findOne({ where: { id_lista: req.params.id, usuario_id: req.user.id } });
    if (!lista) return next(new AppError('Lista no encontrada.', 404));
    const deleted = await ListaPelicula.destroy({ where: { lista_id: lista.id_lista, pelicula_id: req.params.peliculaId } });
    if (!deleted) return next(new AppError('La película no estaba en esta lista.', 404));
    res.status(200).json({ success: true, message: 'Película eliminada de la lista' });
});
