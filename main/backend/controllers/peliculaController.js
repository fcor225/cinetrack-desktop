const { Op } = require('sequelize');
const Pelicula = require('../models/Pelicula');
const Resena = require('../models/Resena');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const awardXP = require('../utils/awardXP');
const { XP_REWARDS } = require('../utils/rankSystem');

/**
 * @module controllers/peliculaController
 * @description Controlador de películas guardadas en CineTrack.
 * Implementa el UML de estados del proyecto:
 *   NoGuardada → Pendiente → Vista (habilita reseñar) → Archivada/Eliminada
 *
 * Todas las operaciones están scoped al usuario autenticado (req.user.id).
 */

/** Transiciones de estado válidas según el UML */
const TRANSICIONES_VALIDAS = {
    'PENDIENTE': ['VISTA', 'ELIMINADA'],
    'VISTA': ['ARCHIVADA', 'ELIMINADA', 'FAVORITA'],
    'FAVORITA': ['VISTA', 'ARCHIVADA', 'ELIMINADA'],
    'ARCHIVADA': ['ELIMINADA'],
    'ELIMINADA': []  // Estado terminal
};

/**
 * Guarda una película desde TMDB a la colección local del usuario.
 * Estado inicial: PENDIENTE (según UML).
 *
 * @route POST /api/peliculas
 * @body { tmdb_id, titulo, titulo_original?, poster_path?, backdrop_path?, sinopsis?, anio?, valoracion_tmdb?, fecha_estreno?, duracion?, generos? }
 */
exports.guardarPelicula = catchAsync(async (req, res, next) => {
    const { tmdb_id, titulo } = req.body;

    if (!tmdb_id || !titulo) {
        return next(new AppError('tmdb_id y titulo son obligatorios.', 400));
    }

    // Verificar si el usuario ya guardó esta película
    const existente = await Pelicula.findOne({
        where: { tmdb_id, usuario_id: req.user.id }
    });

    if (existente) {
        return next(new AppError('Ya tienes esta película en tu colección.', 400, 'DUPLICATE_MOVIE'));
    }

    const pelicula = await Pelicula.create({
        ...req.body,
        usuario_id: req.user.id,
        estado: 'PENDIENTE'
    });

    // +10 XP por añadir una película
    await awardXP(req.user.id, XP_REWARDS.GUARDAR_PELICULA);

    res.status(201).json({
        success: true,
        message: 'Película guardada en Pendientes',
        data: pelicula
    });
});

/**
 * Cambia el estado de una película según las transiciones válidas del UML.
 *
 * @route PATCH /api/peliculas/:id/estado
 * @body { estado: 'VISTA' | 'ARCHIVADA' | 'ELIMINADA' | 'FAVORITA' }
 */
exports.cambiarEstado = catchAsync(async (req, res, next) => {
    const { estado: nuevoEstado } = req.body;

    if (!nuevoEstado) {
        return next(new AppError('El nuevo estado es obligatorio.', 400));
    }

    const pelicula = await Pelicula.findOne({
        where: { id_local: req.params.id, usuario_id: req.user.id }
    });

    if (!pelicula) {
        return next(new AppError('Película no encontrada en tu colección.', 404));
    }

    // Validar transición según UML de estados
    const transicionesPermitidas = TRANSICIONES_VALIDAS[pelicula.estado];
    if (!transicionesPermitidas || !transicionesPermitidas.includes(nuevoEstado)) {
        return next(new AppError(
            `Transición no permitida: ${pelicula.estado} → ${nuevoEstado}. ` +
            `Transiciones válidas desde '${pelicula.estado}': ${(transicionesPermitidas || []).join(', ') || 'ninguna'}.`,
            400,
            'INVALID_TRANSITION'
        ));
    }

    const updates = { estado: nuevoEstado };
    if (nuevoEstado === 'VISTA') {
        updates.fecha_visionado = new Date();
    }

    await pelicula.update(updates);

    // XP por transiciones clave
    if (nuevoEstado === 'VISTA') await awardXP(req.user.id, XP_REWARDS.MARCAR_VISTA);
    if (nuevoEstado === 'FAVORITA') await awardXP(req.user.id, XP_REWARDS.MARCAR_FAVORITA);

    res.status(200).json({
        success: true,
        message: `Estado cambiado a ${nuevoEstado}`,
        data: pelicula
    });
});

/**
 * Obtiene todas las películas guardadas del usuario, con filtro opcional por estado.
 *
 * @route GET /api/peliculas?estado=VISTA&page=1&limit=20
 */
exports.getMisPeliculas = catchAsync(async (req, res, next) => {
    const { estado, page = 1, limit = 20, search } = req.query;
    const where = { usuario_id: req.user.id };

    if (estado) {
        where.estado = estado;
    } else {
        // Excluir eliminadas por defecto
        where.estado = { [Op.ne]: 'ELIMINADA' };
    }

    if (search) {
        where.titulo = { [Op.like]: `%${search}%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Pelicula.findAndCountAll({
        where,
        order: [['id_local', 'DESC']],
        limit: parseInt(limit),
        offset
    });

    res.status(200).json({
        success: true,
        results: rows.length,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalResults: count
        },
        data: rows
    });
});

/**
 * Obtiene una película guardada por ID (con sus reseñas).
 *
 * @route GET /api/peliculas/:id
 */
exports.getPelicula = catchAsync(async (req, res, next) => {
    const pelicula = await Pelicula.findOne({
        where: { id_local: req.params.id, usuario_id: req.user.id },
        include: [{ model: Resena, as: 'resenas' }]
    });

    if (!pelicula) {
        return next(new AppError('Película no encontrada en tu colección.', 404));
    }

    res.status(200).json({
        success: true,
        data: pelicula
    });
});

/**
 * Elimina una película de la colección del usuario (hard delete).
 *
 * @route DELETE /api/peliculas/:id
 */
exports.eliminarPelicula = catchAsync(async (req, res, next) => {
    const pelicula = await Pelicula.findOne({
        where: { id_local: req.params.id, usuario_id: req.user.id }
    });

    if (!pelicula) {
        return next(new AppError('Película no encontrada.', 404));
    }

    await pelicula.destroy();

    res.status(200).json({
        success: true,
        message: 'Película eliminada de tu colección',
        data: null
    });
});

/**
 * Obtiene estadísticas de la colección del usuario.
 *
 * @route GET /api/peliculas/stats
 */
exports.getEstadisticas = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const [total, pendientes, vistas, favoritas, archivadas] = await Promise.all([
        Pelicula.count({ where: { usuario_id: userId, estado: { [Op.ne]: 'ELIMINADA' } } }),
        Pelicula.count({ where: { usuario_id: userId, estado: 'PENDIENTE' } }),
        Pelicula.count({ where: { usuario_id: userId, estado: 'VISTA' } }),
        Pelicula.count({ where: { usuario_id: userId, estado: 'FAVORITA' } }),
        Pelicula.count({ where: { usuario_id: userId, estado: 'ARCHIVADA' } })
    ]);

    const totalResenas = await Resena.count({ where: { autor_id: userId } });

    // ── Tiempo total de visionado y géneros más vistos ──────────────────────
    /** @type {import('../models/Pelicula')[]} */
    const peliculasVistas = await Pelicula.findAll({
        where: {
            usuario_id: userId,
            estado: { [Op.in]: ['VISTA', 'FAVORITA'] }
        },
        attributes: ['duracion', 'generos']
    });

    // Suma de minutos de todas las películas vistas/favoritas
    const tiempoTotalMinutos = peliculasVistas.reduce((acc, p) => {
        return acc + (p.duracion || 0);
    }, 0);

    // Mapa de frecuencia de géneros
    /** @type {Record<string, number>} */
    const generoCount = {};
    peliculasVistas.forEach(p => {
        const generos = p.generos; // getter del modelo ya parsea el JSON
        if (Array.isArray(generos)) {
            generos.forEach(g => {
                generoCount[g] = (generoCount[g] || 0) + 1;
            });
        }
    });

    // Convertir a array ordenado y tomar los 8 más frecuentes
    const topGeneros = Object.entries(generoCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([nombre, valor]) => ({ nombre, valor }));

    res.status(200).json({
        success: true,
        data: {
            total,
            pendientes,
            vistas,
            favoritas,
            archivadas,
            resenas: totalResenas,
            tiempoTotalMinutos,
            topGeneros
        }
    });
});

/**
 * Verifica si una película (por tmdb_id) ya está guardada en la colección del usuario.
 *
 * @route GET /api/peliculas/check/:tmdbId
 */
exports.checkGuardada = catchAsync(async (req, res, next) => {
    const pelicula = await Pelicula.findOne({
        where: { tmdb_id: req.params.tmdbId, usuario_id: req.user.id }
    });

    res.status(200).json({
        success: true,
        data: {
            guardada: !!pelicula,
            pelicula: pelicula || null
        }
    });
});

/**
 * Obtiene los datos del historial de visionado para el Cine-Calendario (Heatmap).
 * Devuelve un conteo de películas vistas agrupadas por fecha.
 * 
 * @route GET /api/peliculas/heatmap
 */
exports.getHeatmapData = catchAsync(async (req, res, next) => {
    // Buscar todas las películas con fecha de visionado
    const peliculasVistas = await Pelicula.findAll({
        where: {
            usuario_id: req.user.id,
            fecha_visionado: { [Op.ne]: null }
        },
        attributes: ['fecha_visionado']
    });

    // Agrupar por fecha (YYYY-MM-DD)
    const conteoPorFecha = {};
    peliculasVistas.forEach(p => {
        if (!p.fecha_visionado) return;
        const dateStr = new Date(p.fecha_visionado).toISOString().split('T')[0];
        conteoPorFecha[dateStr] = (conteoPorFecha[dateStr] || 0) + 1;
    });

    // Formatear como array de objetos { date, count } para react-calendar-heatmap
    const data = Object.keys(conteoPorFecha).map(date => ({
        date: date,
        count: conteoPorFecha[date]
    }));

    res.status(200).json({
        success: true,
        data
    });
});
