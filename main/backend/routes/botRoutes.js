const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const auth = require('../middleware/auth');

/**
 * @route POST /api/bot/chat
 * @desc  Envía un mensaje al CineBot y recibe respuesta
 * @access Autenticado
 */
router.post('/chat', auth, botController.chat);

module.exports = router;
