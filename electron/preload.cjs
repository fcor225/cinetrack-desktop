// electron/preload.cjs (Añade estas dos líneas)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  buscarPeliculas: (query) => ipcRenderer.invoke('buscar-peliculas', query),
  guardarPelicula: (pelicula) => ipcRenderer.invoke('guardar-pelicula', pelicula),
  obtenerColeccion: () => ipcRenderer.invoke('obtener-coleccion'),
  
  eliminarPelicula: (id_local) => ipcRenderer.invoke('eliminar-pelicula', id_local),
  actualizarEstado: (id_local, nuevoEstado) => ipcRenderer.invoke('actualizar-estado', id_local, nuevoEstado),
  
  mostrarNotificacion: (titulo, cuerpo) => ipcRenderer.invoke('mostrar-notificacion', titulo, cuerpo)
});