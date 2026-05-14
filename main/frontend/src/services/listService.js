import apiClient from './apiClient';

const listService = {
    getMias: async () => { const r = await apiClient.get('/listas'); return r.data; },
    getOne: async (id) => { const r = await apiClient.get(`/listas/${id}`); return r.data; },
    crear: async (data) => { const r = await apiClient.post('/listas', data); return r.data; },
    actualizar: async (id, data) => { const r = await apiClient.put(`/listas/${id}`, data); return r.data; },
    eliminar: async (id) => { const r = await apiClient.delete(`/listas/${id}`); return r.data; },
    agregarPelicula: async (listaId, peliculaId) => { const r = await apiClient.post(`/listas/${listaId}/peliculas`, { pelicula_id: peliculaId }); return r.data; },
    quitarPelicula: async (listaId, peliculaId) => { const r = await apiClient.delete(`/listas/${listaId}/peliculas/${peliculaId}`); return r.data; },
};
export default listService;
