/**
 * @module config
 * @description Configuración centralizada del frontend de CineTrack.
 * Todas las URLs y constantes se leen de variables de entorno (REACT_APP_*).
 * Si no están definidas, se usan valores por defecto de desarrollo.
 */

const config = {
    /** @type {string} URL base del API backend (sin trailing slash) */
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',

    /** @type {string} URL de conexión Socket.IO */
    SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',

    /** @type {string} URL base para imágenes de TMDB */
    TMDB_IMAGE_BASE: process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p',

    /** @type {string} Tamaño de poster por defecto */
    TMDB_POSTER_SIZE: 'w500',

    /** @type {string} Tamaño de backdrop por defecto */
    TMDB_BACKDROP_SIZE: 'w1280',

    /** @type {number} Timeout para peticiones HTTP en ms */
    REQUEST_TIMEOUT: 15000,

    /** @type {string} Clave en localStorage para el token JWT */
    TOKEN_KEY: 'cinetrack_token',

    /** @type {string} Clave en localStorage para datos del usuario */
    USER_DATA_KEY: 'cinetrack_user'
};

export default config;
