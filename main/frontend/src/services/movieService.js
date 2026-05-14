import apiClient from './apiClient';

const movieService = {
    guardar: async (data) => { const r = await apiClient.post('/peliculas', data); return r.data; },
    getMias: async (params = {}) => { const r = await apiClient.get('/peliculas', { params }); return r.data; },
    getOne: async (id) => { const r = await apiClient.get(`/peliculas/${id}`); return r.data; },
    cambiarEstado: async (id, estado) => { const r = await apiClient.patch(`/peliculas/${id}/estado`, { estado }); return r.data; },
    eliminar: async (id) => { const r = await apiClient.delete(`/peliculas/${id}`); return r.data; },
    getStats: async () => { const r = await apiClient.get('/peliculas/stats'); return r.data; },
    getHeatmapData: async () => { const r = await apiClient.get('/peliculas/heatmap'); return r.data; },
    checkGuardada: async (tmdbId) => { const r = await apiClient.get(`/peliculas/check/${tmdbId}`); return r.data; },

    /**
     * Descarga la copia de seguridad completa del usuario como archivo .json.
     * Crea un <a> temporal y lo pulsa para forzar la descarga en el navegador.
     */
    exportar: async () => {
        const r = await apiClient.get('/backup/export', { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([r.data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinetrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Envía el contenido de un archivo JSON de backup al backend para restaurarlo.
     * @param {Object} backupPayload - Contenido parseado del archivo JSON exportado
     */
    importar: async (backupPayload) => {
        const r = await apiClient.post('/backup/import', backupPayload);
        return r.data;
    }
};

export default movieService;
