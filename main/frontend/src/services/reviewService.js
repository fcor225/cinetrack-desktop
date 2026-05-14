import apiClient from './apiClient';

const reviewService = {
    getMias: async (params = {}) => { const r = await apiClient.get('/resenas', { params }); return r.data; },
    getDePelicula: async (peliculaId) => { const r = await apiClient.get(`/resenas/pelicula/${peliculaId}`); return r.data; },
    crear: async (data) => { const r = await apiClient.post('/resenas', data); return r.data; },
    editar: async (id, data) => { const r = await apiClient.put(`/resenas/${id}`, data); return r.data; },
    eliminar: async (id) => { const r = await apiClient.delete(`/resenas/${id}`); return r.data; },
};
export default reviewService;
