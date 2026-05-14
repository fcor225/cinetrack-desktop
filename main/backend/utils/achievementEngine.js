const Pelicula = require('../models/Pelicula');
const { Op } = require('sequelize');

const TMDB_GENRES = {
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia',
    27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance',
    878: 'Ciencia Ficción', 10770: 'Película de TV', 53: 'Suspense',
    10752: 'Bélica', 37: 'Western'
};

/**
 * @module utils/achievementEngine
 * @description Motor de autogeneración de misiones y logros dinámicos
 * analizando los patrones de visionado del usuario (Data Mining ligero).
 */

const calculateDynamicAchievements = async (userId) => {
    // Solo analizamos películas marcadas como VISTA (o FAVORITA, que también cuenta como vista)
    const peliculasVistas = await Pelicula.findAll({
        where: {
            usuario_id: userId,
            estado: { [Op.in]: ['VISTA', 'FAVORITA', 'ARCHIVADA'] }
        }
    });

    const totalVistas = peliculasVistas.length;
    const achievements = [];

    // 1. Misión Base de Coleccionista
    achievements.push({
        id: 'collector_1',
        title: 'Cinéfilo Novato',
        description: 'Visualiza 10 películas en total.',
        progress: totalVistas,
        target: 10,
        completed: totalVistas >= 10,
        icon: '🎬'
    });

    achievements.push({
        id: 'collector_2',
        title: 'Devorador de Cine',
        description: 'Visualiza 50 películas en total.',
        progress: totalVistas,
        target: 50,
        completed: totalVistas >= 50,
        icon: '🍿'
    });

    // 2. Agrupación por Géneros
    const genreCounts = {};
    peliculasVistas.forEach(p => {
        const generos = p.generos || []; // JSON array de IDs
        generos.forEach(gId => {
            const genreName = TMDB_GENRES[gId] || `Género ${gId}`;
            genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
        });
    });

    // Crear logros dinámicos para los géneros que el usuario más ve
    Object.keys(genreCounts).forEach(genre => {
        const count = genreCounts[genre];
        // Solo generamos la misión si ha visto al menos 1 película de este género
        if (count >= 1) {
            let target = 5;
            let title = `Especialista en ${genre}`;
            let icon = '🎖️';

            if (count >= 5) { target = 15; title = `Maestro de ${genre}`; icon = '👑'; }
            if (count >= 15) { target = 50; title = `Dios del ${genre}`; icon = '🌌'; }

            achievements.push({
                id: `genre_${genre}`,
                title: title,
                description: `Has visto ${count} películas de ${genre}. ¡Llega a ${target} para el logro!`,
                progress: count,
                target: target,
                completed: count >= target,
                icon: icon,
                category: 'Género'
            });
        }
    });

    // 3. Agrupación por Década (Patrones de lanzamiento)
    const decadeCounts = {};
    peliculasVistas.forEach(p => {
        if (p.anio) {
            const decade = Math.floor(p.anio / 10) * 10;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }
    });

    if (decadeCounts[1980] >= 1) {
        achievements.push({
            id: 'decade_80s',
            title: 'Viajero de los 80s',
            description: `Has visto ${decadeCounts[1980]} pelis de los 80s. ¡Llega a 10!`,
            progress: decadeCounts[1980],
            target: 10,
            completed: decadeCounts[1980] >= 10,
            icon: '📼',
            category: 'Época'
        });
    }

    // 4. (Futuro) Agrupación por Director / Actor
    // Nota arquitectónica: Para cumplir con el requerimiento de director/actor, 
    // se requeriría guardar esos metadatos en la tabla Peliculas_Guardadas en el futuro.
    // Como mock-up para demostrar el algoritmo relacional:
    const mockDirectorCounts = { 'Christopher Nolan': 3 }; // Simulado
    Object.keys(mockDirectorCounts).forEach(dir => {
        const dCount = mockDirectorCounts[dir];
        achievements.push({
            id: `director_nolan`,
            title: `Fanático de ${dir}`,
            description: `Has visto ${dCount} películas de ${dir}, mira 5 más para el logro de Director.`,
            progress: dCount,
            target: 8,
            completed: dCount >= 8,
            icon: '🎥',
            category: 'Director',
            isMock: true // Indica que necesita integración de base de datos futura
        });
    });

    // Ordenar logros: primero los incompletos ordenados por progreso relativo, luego los completados
    return achievements.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const aProgress = a.progress / a.target;
        const bProgress = b.progress / b.target;
        return bProgress - aProgress; // Mayor progreso primero
    });
};

module.exports = { calculateDynamicAchievements };
