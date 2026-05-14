const { Op } = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/authController
 * @description Controlador de autenticación para CineTrack (Sequelize + SQLite).
 * Hereda la complejidad de EasyTourney (register, login con sessionToken,
 * logout, perfil, cambio de contraseña, reset) usando catchAsync.
 */

/**
 * Registra un nuevo usuario en el sistema.
 *
 * @route POST /api/auth/register
 * @param {import('express').Request} req - Body: { nombre, email, password }
 * @param {import('express').Response} res - 201: { success, message, data }
 * @param {import('express').NextFunction} next
 */
exports.register = catchAsync(async (req, res, next) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !password) {
        return next(new AppError('Nombre de usuario y contraseña son obligatorios.', 400));
    }

    if (password.length < 6) {
        return next(new AppError('La contraseña debe tener al menos 6 caracteres.', 400));
    }

    // Verificar nombre duplicado
    const existingName = await User.findOne({ where: { nombre } });
    if (existingName) {
        return next(new AppError('El nombre de usuario ya está en uso.', 400));
    }

    // Verificar email duplicado (si se proporciona)
    if (email) {
        const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existingEmail) {
            return next(new AppError('Este correo electrónico ya está registrado.', 400));
        }
    }

    // Hashear password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await User.create({
        nombre,
        email: email ? email.toLowerCase() : null,
        password: hashedPassword
    });

    res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
            id: user.id_usuario,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        }
    });
});

/**
 * Inicia sesión del usuario. Genera JWT con sessionToken para control de sesiones concurrentes.
 *
 * @route POST /api/auth/login
 * @param {import('express').Request} req - Body: { nombre, password, forceLogout? }
 * @param {import('express').Response} res - 200: { success, data: { token, user } }
 * @param {import('express').NextFunction} next
 */
exports.login = catchAsync(async (req, res, next) => {
    const { nombre, password, forceLogout } = req.body;

    if (!nombre || !password) {
        return next(new AppError('Nombre de usuario y contraseña son obligatorios.', 400));
    }

    // Buscar usuario
    const user = await User.findOne({ where: { nombre } });

    if (!user) {
        return next(new AppError('Credenciales inválidas.', 400));
    }

    // Verificar password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new AppError('Credenciales inválidas.', 400));
    }

    // Detección de sesión activa concurrente (patrón EasyTourney)
    if (user.session_token && !forceLogout) {
        return next(new AppError(
            'Ya hay una sesión iniciada en otro lugar. Envía forceLogout: true para cerrar la sesión anterior.',
            409,
            'ACTIVE_SESSION'
        ));
    }

    // Forzar logout remoto vía Socket.IO si hay sesión previa
    if (user.session_token && forceLogout) {
        const io = req.app.get('socketio');
        if (io) {
            io.to('user_' + user.id_usuario).emit('force_logout');
        }
    }

    // Generar nuevo sessionToken
    const sessionToken = crypto.randomBytes(16).toString('hex');
    await user.update({ session_token: sessionToken });

    // Crear payload JWT
    const payload = {
        user: {
            id: user.id_usuario,
            rol: user.rol,
            sessionToken: sessionToken
        }
    };

    // Firmar JWT
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN) || 86400;
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    res.status(200).json({
        success: true,
        data: {
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                foto: user.foto
            }
        }
    });
});

/**
 * Cierra la sesión del usuario invalidando el sessionToken en la BD.
 *
 * @route POST /api/auth/logout
 * @access Privado
 */
exports.logout = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        return next(new AppError('Usuario no encontrado.', 404));
    }

    await user.update({ session_token: null });

    res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

/**
 * Obtiene el perfil del usuario autenticado.
 *
 * @route GET /api/auth/profile
 * @access Privado
 */
exports.getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'session_token', 'reset_password_token', 'reset_password_expires'] }
    });

    if (!user) {
        return next(new AppError('Usuario no encontrado.', 404));
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * Actualiza el perfil del usuario autenticado.
 *
 * @route PUT /api/auth/profile
 * @access Privado
 * @param {import('express').Request} req - Body: { nombre?, email?, foto? }
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { nombre, email, foto } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
        return next(new AppError('Usuario no encontrado.', 404));
    }

    // Validar colisiones de nombre
    if (nombre && nombre !== user.nombre) {
        const existing = await User.findOne({
            where: { nombre, id_usuario: { [Op.ne]: req.user.id } }
        });
        if (existing) {
            return next(new AppError('El nombre de usuario ya está en uso.', 400));
        }
    }

    // Validar colisiones de email
    if (email && email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new AppError('Por favor, introduce un correo electrónico válido.', 400));
        }
        const existing = await User.findOne({
            where: { email: email.toLowerCase(), id_usuario: { [Op.ne]: req.user.id } }
        });
        if (existing) {
            return next(new AppError('El correo electrónico ya está en uso.', 400));
        }
    }

    // Actualizar campos
    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (email) updates.email = email.toLowerCase();
    if (foto !== undefined) updates.foto = foto;

    await user.update(updates);

    res.status(200).json({
        success: true,
        data: {
            id: user.id_usuario,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            foto: user.foto
        }
    });
});

/**
 * Cambia la contraseña del usuario autenticado.
 *
 * @route PUT /api/auth/change-password
 * @access Privado
 * @param {import('express').Request} req - Body: { passwordActual, passwordNuevo }
 */
exports.changePassword = catchAsync(async (req, res, next) => {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
        return next(new AppError('Se requiere la contraseña actual y la nueva.', 400));
    }

    if (passwordNuevo.length < 6) {
        return next(new AppError('La nueva contraseña debe tener al menos 6 caracteres.', 400));
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        return next(new AppError('Usuario no encontrado.', 404));
    }

    const isMatch = await bcrypt.compare(passwordActual, user.password);
    if (!isMatch) {
        return next(new AppError('La contraseña actual es incorrecta.', 400));
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(passwordNuevo, salt);
    await user.update({ password: hashedPassword });

    res.status(200).json({
        success: true,
        message: 'Contraseña actualizada correctamente'
    });
});

/**
 * Solicita un token de restablecimiento de contraseña.
 *
 * @route POST /api/auth/forgot-password
 * @access Público
 * @param {import('express').Request} req - Body: { email }
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('El correo electrónico es obligatorio.', 400));
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
        return next(new AppError('No existe ningún usuario con ese correo electrónico.', 404));
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({
        reset_password_token: resetToken,
        reset_password_expires: new Date(Date.now() + 3600000) // 1 hora
    });

    const response = {
        success: true,
        message: 'Token de recuperación generado. En producción se enviaría por email.'
    };

    if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken;
        response.resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    }

    res.status(200).json(response);
});

/**
 * Restablece la contraseña usando un token de reset válido.
 *
 * @route POST /api/auth/reset-password/:token
 * @access Público
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({
        where: {
            reset_password_token: req.params.token,
            reset_password_expires: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        return next(new AppError(
            'El token de recuperación es inválido o ha expirado.',
            400,
            'RESET_TOKEN_INVALID'
        ));
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
        return next(new AppError('La nueva contraseña debe tener al menos 6 caracteres.', 400));
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await user.update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null
    });

    res.status(200).json({
        success: true,
        message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// XP y Sistema de Rangos
// ─────────────────────────────────────────────────────────────────────────────
const { getRank, getProgress } = require('../utils/rankSystem');
const Pelicula = require('../models/Pelicula');
const Resena = require('../models/Resena');

/**
 * Devuelve el perfil de XP/Rangos del usuario autenticado.
 * Incluye desafíos con su progreso calculado en tiempo real.
 *
 * @route GET /api/auth/xp
 * @access Privado
 */
exports.getXpProfile = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id_usuario', 'nombre', 'xp']
    });
    if (!user) return next(new AppError('Usuario no encontrado.', 404));

    const xp = user.xp || 0;
    const rank = getRank(xp);
    const progress = getProgress(xp);

    // Estadísticas en tiempo real para los desafíos
    const [vistas, favoritas, resenas] = await Promise.all([
        Pelicula.count({ where: { usuario_id: req.user.id, estado: 'VISTA' } }),
        Pelicula.count({ where: { usuario_id: req.user.id, estado: 'FAVORITA' } }),
        Resena.count({ where: { autor_id: req.user.id } })
    ]);

    const desafios = [
        { id: 1, nombre: 'Cinéfilo Novato',    desc: 'Marca 5 películas como Vistas',       meta: 5,   progreso: vistas,    completado: vistas >= 5,    xpRecompensa: 50,  icono: '🎬' },
        { id: 2, nombre: 'Cinéfilo Dedicado',  desc: 'Marca 20 películas como Vistas',      meta: 20,  progreso: vistas,    completado: vistas >= 20,   xpRecompensa: 150, icono: '📽️' },
        { id: 3, nombre: 'Cinéfilo Experto',   desc: 'Marca 50 películas como Vistas',      meta: 50,  progreso: vistas,    completado: vistas >= 50,   xpRecompensa: 400, icono: '🏆' },
        { id: 4, nombre: 'Crítico Amateur',    desc: 'Escribe tu primera reseña',           meta: 1,   progreso: resenas,   completado: resenas >= 1,   xpRecompensa: 100, icono: '✍️' },
        { id: 5, nombre: 'Crítico Experto',    desc: 'Escribe 10 reseñas',                  meta: 10,  progreso: resenas,   completado: resenas >= 10,  xpRecompensa: 500, icono: '📝' },
        { id: 6, nombre: 'Coleccionista',      desc: 'Ten 5 películas Favoritas',           meta: 5,   progreso: favoritas, completado: favoritas >= 5,  xpRecompensa: 200, icono: '⭐' },
        { id: 7, nombre: 'Gran Coleccionista', desc: 'Ten 20 películas Favoritas',          meta: 20,  progreso: favoritas, completado: favoritas >= 20, xpRecompensa: 600, icono: '💫' }
    ];

    res.status(200).json({
        success: true,
        data: {
            xp,
            rango: {
                nombre: rank.name,
                color: rank.color,
                icon: rank.icon,
                gradient: rank.gradient
            },
            progreso: progress,
            desafios
        }
    });
});

const { calculateDynamicAchievements } = require('../utils/achievementEngine');

/**
 * @route GET /api/auth/achievements/dynamic
 * @desc  Devuelve las misiones y logros dinámicos generados por Data Mining
 * @access Autenticado
 */
exports.getDynamicAchievements = catchAsync(async (req, res, next) => {
    const achievements = await calculateDynamicAchievements(req.user.id);
    res.status(200).json({
        success: true,
        data: achievements
    });
});
