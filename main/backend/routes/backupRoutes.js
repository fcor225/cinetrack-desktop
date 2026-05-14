const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const auth = require('../middleware/auth');

/**
 * @route GET /api/backup/export
 * @desc  Exporta toda la colección del usuario como fichero JSON
 * @access Autenticado
 */
router.get('/export', auth, backupController.exportar);

/**
 * @route POST /api/backup/import
 * @desc  Importa (restaura) una copia de seguridad JSON
 * @access Autenticado
 */
router.post('/import', auth, backupController.importar);

module.exports = router;
