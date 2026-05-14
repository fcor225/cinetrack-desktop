const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/tmdbController
 * @description Proxy seguro a The Movie Database (TMDB) API v3.
 * El frontend NUNCA recibe ni expone la API key — todas las peticiones
 * pasan por este controlador que añade la key server-side.
 *
 * Endpoints proxy:
 * - GET /api/tmdb/search?query=Titanic&page=1
 * - GET /api/tmdb/trending/:timeWindow (day|week)
 * - GET /api/tmdb/movie/:tmdbId (ficha completa)
 * - GET /api/tmdb/popular?page=1
 * - GET /api/tmdb/now-playing?page=1
 */

const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_TOKEN = () => process.env.TMDB_ACCESS_TOKEN;

/**
 * Helper para hacer peticiones a TMDB con Bearer token (v4).
 * @param {string} endpoint - Endpoint relativo (sin base URL)
 * @param {Object} [params={}] - Query params adicionales
 * @returns {Promise<Object>} Respuesta de TMDB
 */
const tmdbRequest = async (endpoint, params = {}) => {
    const token = TMDB_TOKEN();
    if (!token) {
        throw new AppError('Token de TMDB no configurado. Revisa TMDB_ACCESS_TOKEN en tu archivo .env', 500, 'TMDB_CONFIG_ERROR');
    }

    const response = await axios.get(`${TMDB_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        params: {
            language: 'es-ES',
            ...params
        },
        timeout: 10000
    });

    return response.data;
};

/**
 * Busca películas en TMDB por título.
 * @route GET /api/tmdb/search?query=Titanic&page=1
 */
exports.searchMovies = catchAsync(async (req, res, next) => {
    const { query, page = 1 } = req.query;

    if (!query || query.trim().length < 2) {
        return next(new AppError('El término de búsqueda debe tener al menos 2 caracteres.', 400));
    }

    const data = await tmdbRequest('/search/movie', {
        query: query.trim(),
        page: parseInt(page),
        include_adult: false
    });

    res.status(200).json({
        success: true,
        results: data.results?.length || 0,
        pagination: {
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results
        },
        data: data.results || []
    });
});

/**
 * Obtiene películas en tendencia (día o semana).
 * @route GET /api/tmdb/trending/:timeWindow
 * @param {string} timeWindow - 'day' o 'week'
 */
exports.getTrending = catchAsync(async (req, res, next) => {
    const { timeWindow } = req.params;

    if (!['day', 'week'].includes(timeWindow)) {
        return next(new AppError("timeWindow debe ser 'day' o 'week'.", 400));
    }

    const data = await tmdbRequest(`/trending/movie/${timeWindow}`);

    res.status(200).json({
        success: true,
        results: data.results?.length || 0,
        data: data.results || []
    });
});

/**
 * Obtiene la ficha técnica completa de una película (con cast, crew, trailers).
 * @route GET /api/tmdb/movie/:tmdbId
 */
exports.getMovieDetails = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;

    if (!tmdbId || isNaN(tmdbId)) {
        return next(new AppError('ID de película inválido.', 400));
    }

    const data = await tmdbRequest(`/movie/${tmdbId}`, {
        append_to_response: 'credits,videos,similar'
    });

    res.status(200).json({
        success: true,
        data
    });
});

/**
 * Obtiene las reseñas públicas de una película (Comunidad TMDB).
 * @route GET /api/tmdb/movie/:tmdbId/reviews
 */
exports.getMovieReviews = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;

    if (!tmdbId || isNaN(tmdbId)) {
        return next(new AppError('ID de película inválido.', 400));
    }

    const data = await tmdbRequest(`/movie/${tmdbId}/reviews`, {
        language: 'en-US', // Las reseñas suelen estar en inglés mayoritariamente
        page: 1
    });

    res.status(200).json({
        success: true,
        results: data.results?.length || 0,
        data: data.results || []
    });
});

/**
 * Obtiene películas populares.
 * @route GET /api/tmdb/popular?page=1
 */
exports.getPopular = catchAsync(async (req, res, next) => {
    const { page = 1 } = req.query;

    const data = await tmdbRequest('/movie/popular', { page: parseInt(page) });

    res.status(200).json({
        success: true,
        results: data.results?.length || 0,
        pagination: {
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results
        },
        data: data.results || []
    });
});

/**
 * Obtiene películas en cartelera.
 * @route GET /api/tmdb/now-playing?page=1
 */
exports.getNowPlaying = catchAsync(async (req, res, next) => {
    const { page = 1 } = req.query;

    const data = await tmdbRequest('/movie/now_playing', { page: parseInt(page) });

    res.status(200).json({
        success: true,
        results: data.results?.length || 0,
        pagination: {
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results
        },
        data: data.results || []
    });
});

/**
 * Obtiene proveedores de streaming (Watch Providers)
 * @route GET /api/tmdb/movie/:tmdbId/watch/providers
 */
exports.getWatchProviders = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;
    const data = await tmdbRequest(`/movie/${tmdbId}/watch/providers`);
    res.status(200).json({ success: true, data: data.results || {} });
});

/**
 * Obtiene próximos estrenos (Upcoming)
 * @route GET /api/tmdb/upcoming
 */
exports.getUpcoming = catchAsync(async (req, res, next) => {
    const data = await tmdbRequest('/movie/upcoming', { page: req.query.page || 1 });
    res.status(200).json({ success: true, data: data.results || [] });
});

/**
 * Obtiene recomendaciones similares
 * @route GET /api/tmdb/movie/:tmdbId/recommendations
 */
exports.getRecommendations = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;
    const data = await tmdbRequest(`/movie/${tmdbId}/recommendations`);
    res.status(200).json({ success: true, data: data.results || [] });
});

/**
 * Obtiene el reparto y equipo (Credits)
 * @route GET /api/tmdb/movie/:tmdbId/credits
 */
exports.getCredits = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;
    const data = await tmdbRequest(`/movie/${tmdbId}/credits`);
    res.status(200).json({ success: true, data });
});

/**
 * Obtiene los videos (Trailers, teasers)
 * @route GET /api/tmdb/movie/:tmdbId/videos
 */
exports.getVideos = catchAsync(async (req, res, next) => {
    const { tmdbId } = req.params;
    const data = await tmdbRequest(`/movie/${tmdbId}/videos`);
    res.status(200).json({ success: true, data: data.results || [] });
});

/**
 * Descubre películas aleatorias para el modo CineSwipe.
 * Usa /discover/movie de TMDB con sort_by=popularity.desc y filtra
 * server-side las que no tienen poster_path para garantizar calidad visual.
 *
 * @route GET /api/tmdb/discover?page=1
 * @query {number} [page=1] - Página de resultados (TMDB tiene ~500 páginas)
 */
exports.getDiscover = catchAsync(async (req, res, next) => {
    // Usar una página aleatoria entre 1 y 100 si no se especifica
    // para dar sensación de descubrimiento infinito
    const page = parseInt(req.query.page) || Math.floor(Math.random() * 100) + 1;

    const data = await tmdbRequest('/discover/movie', {
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: false,
        page,
        'vote_count.gte': 50,       // mínimo 50 votos para garantizar calidad
        'vote_average.gte': 5.0     // nota mínima 5/10
    });

    // Filtrar server-side: solo películas con póster y título
    const filtered = (data.results || []).filter(
        m => m.poster_path && m.title && m.id
    );

    res.status(200).json({
        success: true,
        results: filtered.length,
        pagination: {
            page: data.page,
            totalPages: Math.min(data.total_pages, 100),
            totalResults: data.total_results
        },
        data: filtered
    });
});

