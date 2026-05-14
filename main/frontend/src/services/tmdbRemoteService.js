import apiClient from './apiClient';

/**
 * Servicio para interactuar con la API remota de TMDB a través de nuestro proxy seguro.
 */
export const tmdbService = {
    /**
     * Obtiene las reseñas públicas de una película (Proxy TMDB).
     * @param {number} movieId ID de la película en TMDB
     * @returns {Promise<Array>} Lista de reseñas
     */
    getMovieReviews: async (movieId) => {
        try {
            const response = await apiClient.get(`/tmdb/movie/${movieId}/reviews`);
            return response.data.data || [];
        } catch (error) {
            console.error('[TMDB API Proxy] Error obteniendo reseñas:', error);
            throw error;
        }
    }
};
