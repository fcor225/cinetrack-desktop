const express = require('express');
const router = express.Router();
const resenaController = require('../controllers/resenaController');
const auth = require('../middleware/auth');

router.get('/', auth, resenaController.getMisResenas);
router.get('/pelicula/:peliculaId', auth, resenaController.getResenasDePelicula);
router.post('/', auth, resenaController.crearResena);
router.put('/:id', auth, resenaController.editarResena);
router.delete('/:id', auth, resenaController.eliminarResena);

module.exports = router;
