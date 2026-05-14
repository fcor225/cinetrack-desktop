/**
 * Servicio para interactuar con la base de datos local (SQLite) a través de Electron IPC.
 * Asume que el Preload script expone los métodos en `window.api`.
 */
export const localDbService = {
    /**
     * Obtiene la reseña local de una película.
     * @param {number} movieId ID de la película
     * @returns {Promise<Object|null>}
     */
    getReview: async (movieId) => {
        try {
            if (window.api && window.api.getReview) {
                return await window.api.getReview(movieId);
            }
            // Fallback para desarrollo en navegador si no está Electron
            console.warn('[LocalDB] window.api no disponible. Entorno no-Electron.');
            return null;
        } catch (error) {
            console.error('[LocalDB] Error al obtener reseña local:', error);
            throw error;
        }
    },

    /**
     * Guarda o actualiza la reseña local.
     * @param {Object} reviewData Datos de la reseña { movieId, text, rating }
     * @returns {Promise<Object>}
     */
    saveReview: async (reviewData) => {
        try {
            if (window.api && window.api.saveReview) {
                return await window.api.saveReview(reviewData);
            }
            console.warn('[LocalDB] window.api no disponible. Simulando guardado exitoso.');
            return { success: true, data: reviewData };
        } catch (error) {
            console.error('[LocalDB] Error al guardar reseña local:', error);
            throw error;
        }
    }
};
