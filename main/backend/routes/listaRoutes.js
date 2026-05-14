const express = require('express');
const router = express.Router();
const listaController = require('../controllers/listaController');
const auth = require('../middleware/auth');

router.get('/', auth, listaController.getMisListas);
router.get('/:id', auth, listaController.getLista);
router.post('/', auth, listaController.crearLista);
router.put('/:id', auth, listaController.actualizarLista);
router.delete('/:id', auth, listaController.eliminarLista);
router.post('/:id/peliculas', auth, listaController.agregarPelicula);
router.delete('/:id/peliculas/:peliculaId', auth, listaController.quitarPelicula);

module.exports = router;
