/**
 * @module utils/rankSystem
 * @description Sistema de Rangos competitivo "Overwatch Style" para CineTrack.
 *
 * Rangos ordenados de menor a mayor XP requerido:
 *   Bronce → Plata → Oro → Platino → Diamante → Maestro → Gran Maestro → Campeón
 *
 * @example
 * const { getRank, getProgress } = require('./rankSystem');
 * const rank = getRank(1600); // → { name: 'Oro', color: '#FFD700', icon: '🥇', ... }
 */

/** @typedef {{ name: string, minXP: number, maxXP: number|null, color: string, icon: string, gradient: string }} Rank */

/** @type {Rank[]} — Ordenados de menor a mayor */
const RANKS = [
    {
        name: 'Bronce',
        minXP: 0,
        maxXP: 499,
        color: '#cd7f32',
        icon: '🥉',
        gradient: 'linear-gradient(135deg, #cd7f32, #a0522d)'
    },
    {
        name: 'Plata',
        minXP: 500,
        maxXP: 1499,
        color: '#c0c0c0',
        icon: '🥈',
        gradient: 'linear-gradient(135deg, #c0c0c0, #808080)'
    },
    {
        name: 'Oro',
        minXP: 1500,
        maxXP: 2999,
        color: '#FFD700',
        icon: '🥇',
        gradient: 'linear-gradient(135deg, #FFD700, #FFA500)'
    },
    {
        name: 'Platino',
        minXP: 3000,
        maxXP: 4999,
        color: '#00BFFF',
        icon: '💎',
        gradient: 'linear-gradient(135deg, #00BFFF, #0080FF)'
    },
    {
        name: 'Diamante',
        minXP: 5000,
        maxXP: 7499,
        color: '#b9f2ff',
        icon: '🔷',
        gradient: 'linear-gradient(135deg, #b9f2ff, #00d8ff)'
    },
    {
        name: 'Maestro',
        minXP: 7500,
        maxXP: 10999,
        color: '#9b59b6',
        icon: '⚔️',
        gradient: 'linear-gradient(135deg, #9b59b6, #6c3483)'
    },
    {
        name: 'Gran Maestro',
        minXP: 11000,
        maxXP: 14999,
        color: '#e74c3c',
        icon: '🔥',
        gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)'
    },
    {
        name: 'Campeón',
        minXP: 15000,
        maxXP: null,
        color: '#f0e68c',
        icon: '👑',
        gradient: 'linear-gradient(135deg, #f0e68c, #FFD700, #FFA500)'
    }
];

/**
 * Devuelve el rango correspondiente a una cantidad de XP.
 * @param {number} xp - XP total del usuario
 * @returns {Rank} El rango actual
 */
const getRank = (xp = 0) => {
    // Recorrer en reversa para encontrar el rango más alto alcanzado
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXP) return RANKS[i];
    }
    return RANKS[0]; // Bronce por defecto
};

/**
 * Calcula el progreso (0–100) dentro del rango actual.
 * @param {number} xp - XP total del usuario
 * @returns {{ percent: number, xpInRank: number, xpForNext: number|null }}
 */
const getProgress = (xp = 0) => {
    const currentRank = getRank(xp);
    const nextRankIndex = RANKS.findIndex(r => r.name === currentRank.name) + 1;

    // Campeón: no hay siguiente rango
    if (!currentRank.maxXP) {
        return { percent: 100, xpInRank: xp - currentRank.minXP, xpForNext: null };
    }

    const nextRank = RANKS[nextRankIndex] || null;
    const xpInRank = xp - currentRank.minXP;
    const rangeSize = currentRank.maxXP - currentRank.minXP + 1;
    const percent = Math.min(100, Math.round((xpInRank / rangeSize) * 100));
    const xpForNext = nextRank ? nextRank.minXP - xp : null;

    return { percent, xpInRank, xpForNext };
};

/** XP ganado por cada acción */
const XP_REWARDS = {
    GUARDAR_PELICULA: 10,
    MARCAR_VISTA: 50,
    MARCAR_FAVORITA: 25,
    ESCRIBIR_RESENA: 100,
    CREAR_LISTA: 20,
    AGREGAR_A_LISTA: 5
};

module.exports = { RANKS, getRank, getProgress, XP_REWARDS };
