const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
require('dotenv').config();

/**
 * @module index
 * @description Punto de entrada del servidor CineTrack.
 * Arquitectura Express + Socket.IO + SQLite (Sequelize).
 * Capas de seguridad: helmet, rate-limit.
 * Manejo centralizado de errores.
 */

// ═══════════════════════════════════════════════
// Cargar modelos (registro en Sequelize)
// ═══════════════════════════════════════════════
const User = require('./models/User');
const Pelicula = require('./models/Pelicula');
const { Lista, ListaPelicula } = require('./models/Lista');
const Resena = require('./models/Resena');

// ═══════════════════════════════════════════════
// Definir asociaciones entre modelos
// ═══════════════════════════════════════════════
User.hasMany(Pelicula, { foreignKey: 'usuario_id', as: 'peliculas' });
Pelicula.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

User.hasMany(Lista, { foreignKey: 'usuario_id', as: 'listas' });
Lista.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

Lista.belongsToMany(Pelicula, { through: ListaPelicula, foreignKey: 'lista_id', otherKey: 'pelicula_id', as: 'peliculas' });
Pelicula.belongsToMany(Lista, { through: ListaPelicula, foreignKey: 'pelicula_id', otherKey: 'lista_id', as: 'listas' });

User.hasMany(Resena, { foreignKey: 'autor_id', as: 'resenas' });
Resena.belongsTo(User, { foreignKey: 'autor_id', as: 'autor' });

Pelicula.hasMany(Resena, { foreignKey: 'pelicula_id', as: 'resenas' });
Resena.belongsTo(Pelicula, { foreignKey: 'pelicula_id', as: 'pelicula' });

// ═══════════════════════════════════════════════
// Cargar rutas
// ═══════════════════════════════════════════════
const authRoutes = require('./routes/authRoutes');
const tmdbRoutes = require('./routes/tmdbRoutes');
const peliculaRoutes = require('./routes/peliculaRoutes');
const listaRoutes = require('./routes/listaRoutes');
const resenaRoutes = require('./routes/resenaRoutes');
const backupRoutes = require('./routes/backupRoutes');
const botRoutes = require('./routes/botRoutes');

// ═══════════════════════════════════════════════
// Inicializar Express + HTTP Server + Socket.IO
// ═══════════════════════════════════════════════
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// ═══════════════════════════════════════════════
// Socket.IO — Eventos de conexión
// ═══════════════════════════════════════════════
io.on('connection', (socket) => {
    socket.on('joinUserRoom', (userId) => {
        if (userId) {
            socket.join('user_' + userId);
        }
    });

    socket.on('disconnect', () => {
        // Cleanup automático de Socket.IO
    });
});

app.set('socketio', io);

// ═══════════════════════════════════════════════
// Middlewares Globales — Seguridad
// ═══════════════════════════════════════════════

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000,
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP. Intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

app.use(express.json({ limit: '5mb' }));

// ═══════════════════════════════════════════════
// Middlewares Globales — Logging
// ═══════════════════════════════════════════════

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use((req, res, next) => {
    if (req.method !== 'GET' && process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
        if (req.body && Object.keys(req.body).length > 0) {
            const safebody = { ...req.body };
            if (safebody.password) safebody.password = '***';
            if (safebody.passwordActual) safebody.passwordActual = '***';
            if (safebody.passwordNuevo) safebody.passwordNuevo = '***';
            console.log('Body:', JSON.stringify(safebody, null, 2));
        }
    }
    next();
});

// ═══════════════════════════════════════════════
// Rutas de la API
// ═══════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/peliculas', peliculaRoutes);
app.use('/api/listas', listaRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/bot', botRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CineTrack API funcionando 🎬🚀',
        version: '1.0.0',
        database: 'SQLite',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ═══════════════════════════════════════════════
// Manejo de rutas no encontradas
// ═══════════════════════════════════════════════
app.use((req, res, next) => {
    next(new AppError(`Ruta ${req.originalUrl} no encontrada en este servidor.`, 404));
});

// ═══════════════════════════════════════════════
// Error Handler Global (debe ir ÚLTIMO)
// ═══════════════════════════════════════════════
app.use(globalErrorHandler);

// ═══════════════════════════════════════════════
// Conexión a BD + Arranque del servidor
// ═══════════════════════════════════════════════
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🎬 CineTrack API corriendo en http://localhost:${PORT}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💾 Base de datos: SQLite`);
    });
};

startServer();

// ═══════════════════════════════════════════════
// Manejo de errores no capturados
// ═══════════════════════════════════════════════
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION:', err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err.name, err.message);
    process.exit(1);
});

module.exports = { app, server };
