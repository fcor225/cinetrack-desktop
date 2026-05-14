const express = require('express');
const router = express.Router();
const peliculaController = require('../controllers/peliculaController');
const auth = require('../middleware/auth');

/** @route GET /api/peliculas/stats — Estadísticas (ANTES de :id) */
router.get('/stats', auth, peliculaController.getEstadisticas);

/** @route GET /api/peliculas/heatmap — Datos para el Cine-Calendario */
router.get('/heatmap', auth, peliculaController.getHeatmapData);

/** @route GET /api/peliculas/check/:tmdbId — Verificar si ya está guardada */
router.get('/check/:tmdbId', auth, peliculaController.checkGuardada);

/** @route GET /api/peliculas — Mis películas guardadas */
router.get('/', auth, peliculaController.getMisPeliculas);

/** @route GET /api/peliculas/:id — Detalle de película guardada */
router.get('/:id', auth, peliculaController.getPelicula);

/** @route POST /api/peliculas — Guardar película desde TMDB */
router.post('/', auth, peliculaController.guardarPelicula);

/** @route PATCH /api/peliculas/:id/estado — Cambiar estado */
router.patch('/:id/estado', auth, peliculaController.cambiarEstado);

/** @route DELETE /api/peliculas/:id — Eliminar película */
router.delete('/:id', auth, peliculaController.eliminarPelicula);

module.exports = router;
