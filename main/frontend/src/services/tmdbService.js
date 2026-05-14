import apiClient from './apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// CACHÉ LOCAL EN MEMORIA (Tarea 1)
// Almacena { data, timestamp } por clave. TTL: 5 minutos (300 000 ms).
// ─────────────────────────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Devuelve los datos cacheados si existen y no han expirado.
 * @param {string} key - Clave de caché
 * @returns {*|null} Datos cacheados o null si no existe / expiró
 */
const getFromCache = (key) => {
    if (!_cache.has(key)) return null;
    const { data, timestamp } = _cache.get(key);
    if (Date.now() - timestamp < CACHE_TTL_MS) return data;
    _cache.delete(key); // Elimina entrada expirada
    return null;
};

/**
 * Guarda datos en la caché con la marca de tiempo actual.
 * @param {string} key - Clave de caché
 * @param {*} data - Datos a guardar
 */
const saveToCache = (key, data) => {
    _cache.set(key, { data, timestamp: Date.now() });
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO TMDB
// ─────────────────────────────────────────────────────────────────────────────
const tmdbService = {
    search: async (query, page = 1) => {
        const r = await apiClient.get(`/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`);
        return r.data;
    },

    /**
     * Tendencias del día/semana — CACHEADO 5 min.
     */
    getTrending: async (timeWindow = 'day') => {
        const cacheKey = `trending_${timeWindow}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.debug(`[Cache HIT] getTrending(${timeWindow})`);
            return cached;
        }
        const r = await apiClient.get(`/tmdb/trending/${timeWindow}`);
        saveToCache(cacheKey, r.data);
        return r.data;
    },

    getMovieDetails: async (tmdbId) => {
        const r = await apiClient.get(`/tmdb/movie/${tmdbId}`);
        return r.data;
    },

    /**
     * Películas populares — CACHEADO 5 min por página.
     */
    getPopular: async (page = 1) => {
        const cacheKey = `popular_p${page}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.debug(`[Cache HIT] getPopular(page=${page})`);
            return cached;
        }
        const r = await apiClient.get(`/tmdb/popular?page=${page}`);
        saveToCache(cacheKey, r.data);
        return r.data;
    },

    getNowPlaying: async (page = 1) => {
        const r = await apiClient.get(`/tmdb/now-playing?page=${page}`);
        return r.data;
    },

    getWatchProviders: async (movieId) => {
        const r = await apiClient.get(`/tmdb/movie/${movieId}/watch/providers`);
        return r.data;
    },

    /**
     * Dashboard (trending + nowPlaying + upcoming) — CACHEADO 5 min como bloque.
     */
    getDashboardMovies: async () => {
        const cacheKey = 'dashboard_movies';
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.debug('[Cache HIT] getDashboardMovies');
            return cached;
        }

        // Ejecutamos las tres peticiones en paralelo
        const [trending, nowPlaying, upcoming] = await Promise.all([
            apiClient.get('/tmdb/trending/day'),
            apiClient.get('/tmdb/now-playing'),
            apiClient.get('/tmdb/upcoming')
        ]);

        const result = {
            trending: trending.data.data,
            nowPlaying: nowPlaying.data.data,
            upcoming: upcoming.data.data
        };
        saveToCache(cacheKey, result);
        return result;
    },

    getRecommendations: async (movieId) => {
        const r = await apiClient.get(`/tmdb/movie/${movieId}/recommendations`);
        return r.data;
    },

    getMovieCredits: async (movieId) => {
        const r = await apiClient.get(`/tmdb/movie/${movieId}/credits`);
        return r.data;
    },

    getMovieVideos: async (movieId) => {
        const r = await apiClient.get(`/tmdb/movie/${movieId}/videos`);
        return r.data;
    },

    /**
     * Descubre películas para el modo CineSwipe usando /discover/movie de TMDB.
     * El backend usa una página aleatoria si no se especifica (infinita variedad).
     * NO se cachea intencionalmente para que cada sesión sea fresca y diferente.
     *
     * @param {number} [page] - Página a solicitar (omitir para aleatoriedad)
     * @returns {Promise<{ data: Array, pagination: Object }>}
     */
    getDiscoverMovies: async (page) => {
        const url = page ? `/tmdb/discover?page=${page}` : '/tmdb/discover';
        const r = await apiClient.get(url);
        return r.data;
    },

    /**
     * Genera el feed de CineReels: películas en tendencia + su mejor tráiler de YouTube.
     * Usa Promise.allSettled para tolerar fallos individuales sin romper el feed.
     * Excluye películas sin vídeo disponible.
     *
     * Prioridad de vídeo: Trailer > Teaser > Clip (solo YouTube)
     *
     * @param {number} [page=1] - No usado directamente (trending no pagina igual),
     *   reservado para futuras extensiones con /discover.
     * @returns {Promise<Array<{id, title, overview, poster_path, backdrop_path,
     *   vote_average, release_date, genre_ids, videoKey, videoName}>>}
     */
    getCineReelsFeed: async () => {
        // 1. Obtener películas en tendencia de la semana (ya cacheadas 5min si se llamaron antes)
        const trendingRes = await apiClient.get('/tmdb/trending/week');
        const movies = (trendingRes.data.data || []).slice(0, 12); // Top 12 para rendimiento

        // 2. Obtener vídeos de todas las películas en paralelo
        const videoResults = await Promise.allSettled(
            movies.map(movie => apiClient.get(`/tmdb/movie/${movie.id}/videos`))
        );

        // 3. Aplanar: unir película con su mejor vídeo
        const reels = [];
        videoResults.forEach((result, i) => {
            if (result.status !== 'fulfilled') return;

            const videos = result.value.data.data || [];
            // Solo YouTube, prioridad: Trailer > Teaser > Clip
            const ytVideos = videos.filter(v => v.site === 'YouTube');
            const video =
                ytVideos.find(v => v.type === 'Trailer') ||
                ytVideos.find(v => v.type === 'Teaser')  ||
                ytVideos.find(v => v.type === 'Clip');

            if (video) {
                reels.push({
                    ...movies[i],
                    videoKey: video.key,
                    videoName: video.name
                });
            }
        });

        return reels;
    }
};

export default tmdbService;
