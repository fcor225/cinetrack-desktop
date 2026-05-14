const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');
const axios = require('axios');
const { initDB, db } = require('./database.cjs');

// Tu API Key real de TMDB
const TMDB_API_KEY = '9d681f9d0dc8e125ab04ffc4a6992123';

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#14181c', // Color de fondo estilo Letterboxd
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // Conectamos el puente
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // En desarrollo carga de Vite o CRA, en prod cambiar según corresponda
  mainWindow.loadURL('http://localhost:3000'); // Asumiendo React en 3000

  // Evento para minimizar a System Tray en lugar de cerrar
  mainWindow.on('close', function (event) {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      event.returnValue = false;
    }
  });
}

function createTray() {
  // Crear icono vacío/por defecto o usar uno existente
  const iconPath = path.join(__dirname, 'icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    // Fallback: crear un icono nativo temporal (16x16 transparente)
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('CineTrack Desktop');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir CineTrack', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Salir', click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  initDB();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

// IPC para Mostrar Notificaciones Nativas
ipcMain.handle('mostrar-notificacion', (event, titulo, cuerpo) => {
  if (Notification.isSupported()) {
    new Notification({
      title: titulo,
      body: cuerpo,
      icon: path.join(__dirname, 'icon.png')
    }).show();
  }
});

// --- FUNCIONALIDAD 1: Buscar en TMDB (API) ---
ipcMain.handle('buscar-peliculas', async (event, query) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=es-ES`);
    return response.data.results; // Devuelve la lista de películas a React
  } catch (error) {
    console.error("Error buscando en TMDB:", error);
    return [];
  }
});

// --- FUNCIONALIDAD 2: CRUD LOCAL (SQLite) ---

// Create (Guardar)
ipcMain.handle('guardar-pelicula', (event, pelicula) => {
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO Peliculas_Guardadas (tmdb_id, titulo, poster_path, estado) VALUES (?, ?, ?, ?)');
    stmt.run(pelicula.id, pelicula.title, pelicula.poster_path, 'PENDIENTE');
    return { success: true, message: 'Película guardada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read (Leer Colección)
ipcMain.handle('obtener-coleccion', (event) => {
  try {
    const stmt = db.prepare('SELECT * FROM Peliculas_Guardadas ORDER BY id_local DESC');
    return stmt.all();
  } catch (error) {
    return [];
  }
});

// Update (Actualizar Estado a "VISTA")
ipcMain.handle('actualizar-estado', (event, id_local, nuevoEstado) => {
  try {
    const stmt = db.prepare('UPDATE Peliculas_Guardadas SET estado = ? WHERE id_local = ?');
    stmt.run(nuevoEstado, id_local);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete (Borrar Película)
ipcMain.handle('eliminar-pelicula', (event, id_local) => {
  try {
    const stmt = db.prepare('DELETE FROM Peliculas_Guardadas WHERE id_local = ?');
    stmt.run(id_local);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});