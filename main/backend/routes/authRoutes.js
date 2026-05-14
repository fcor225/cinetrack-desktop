const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

/**
 * @module routes/authRoutes
 * @description Rutas de autenticación para CineTrack.
 * Estructura de endpoints heredada de EasyTourney con mejoras.
 *
 * Rutas públicas:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password/:token
 *
 * Rutas protegidas (requieren JWT):
 * - POST /api/auth/logout
 * - GET  /api/auth/profile
 * - PUT  /api/auth/profile
 * - PUT  /api/auth/change-password
 */

// ═══════════════════════════════════════════════
// Rutas Públicas
// ═══════════════════════════════════════════════

/** @route POST /api/auth/register - Registro de nuevo usuario */
router.post('/register', authController.register);

/** @route POST /api/auth/login - Inicio de sesión */
router.post('/login', authController.login);

/** @route POST /api/auth/forgot-password - Solicitar reset de contraseña */
router.post('/forgot-password', authController.forgotPassword);

/** @route POST /api/auth/reset-password/:token - Ejecutar reset de contraseña */
router.post('/reset-password/:token', authController.resetPassword);

// ═══════════════════════════════════════════════
// Rutas Protegidas (requieren autenticación JWT)
// ═══════════════════════════════════════════════

/** @route POST /api/auth/logout - Cerrar sesión */
router.post('/logout', auth, authController.logout);

/** @route GET /api/auth/profile - Obtener perfil del usuario autenticado */
router.get('/profile', auth, authController.getProfile);

/** @route PUT /api/auth/profile - Actualizar perfil del usuario autenticado */
router.put('/profile', auth, authController.updateProfile);

/** @route PUT /api/auth/change-password - Cambiar contraseña */
router.put('/change-password', auth, authController.changePassword);

/**
 * @route GET /api/auth/xp
 * @desc  Devuelve XP, rango actual, progreso y XP para el siguiente rango
 * @access Autenticado
 */
router.get('/xp', auth, authController.getXpProfile);

/**
 * @route GET /api/auth/achievements/dynamic
 * @desc  Devuelve misiones autogeneradas analizando la BD
 * @access Autenticado
 */
router.get('/achievements/dynamic', auth, authController.getDynamicAchievements);

module.exports = router;
