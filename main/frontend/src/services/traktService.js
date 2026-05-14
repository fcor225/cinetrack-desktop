import axios from 'axios';

const TRAKT_API_URL = 'https://api.trakt.tv';
// Usamos REACT_APP_ porque estamos en un entorno Create React App, 
// a diferencia de VITE_ que es para entornos Vite.
const TRAKT_CLIENT_ID = process.env.REACT_APP_TRAKT_CLIENT_ID || 'TU_TRAKT_CLIENT_ID_AQUI';

const traktApiClient = axios.create({
    baseURL: TRAKT_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_CLIENT_ID
    }
});

/**
 * Servicio para interactuar con la API de Trakt.tv
 */
export const traktService = {
    /**
     * Obtiene los comentarios de una película buscando primero su correspondencia por TMDB ID.
     * @param {number|string} tmdbId El ID de la película en TMDB
     * @returns {Promise<Array>} Lista de comentarios ordenados por likes
     */
    getMovieCommentsByTmdbId: async (tmdbId) => {
        try {
            // 1. Buscar la película en Trakt usando el TMDB ID
            const searchResponse = await traktApiClient.get(`/search/tmdb/${tmdbId}?type=movie`);
            
            // Verificamos si Trakt encontró la película
            if (!searchResponse.data || searchResponse.data.length === 0) {
                console.warn(`No se encontró la película con TMDB ID ${tmdbId} en Trakt.`);
                return []; 
            }
            
            // Extraer el ID interno de Trakt de la respuesta
            const traktId = searchResponse.data[0].movie.ids.trakt;
            
            // 2. Obtener los comentarios ordenados por likes (los más populares)
            const commentsResponse = await traktApiClient.get(`/movies/${traktId}/comments/likes`);
            
            return commentsResponse.data || [];
        } catch (error) {
            console.error('[Trakt API] Error fetching comments:', error);
            throw error; // Propagamos el error para manejarlo en el componente
        }
    }
};
