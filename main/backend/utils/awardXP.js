/**
 * @module utils/awardXP
 * @description Utilidad para otorgar XP a un usuario de forma atómica.
 * Se llama desde los controladores después de cada acción exitosa.
 * Los errores se loguean silenciosamente para no interrumpir el flujo principal.
 *
 * @example
 * const awardXP = require('../utils/awardXP');
 * const { XP_REWARDS } = require('../utils/rankSystem');
 * await awardXP(req.user.id, XP_REWARDS.MARCAR_VISTA);
 */
const User = require('../models/User');
const { getRank, XP_REWARDS } = require('./rankSystem');

/**
 * Suma XP al usuario e indica si subió de rango.
 * @param {number} userId - ID del usuario
 * @param {number} amount - Cantidad de XP a sumar
 * @returns {Promise<{ newXP: number, rankUp: boolean, newRank: string }|null>}
 */
const awardXP = async (userId, amount) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) return null;

        const oldRank = getRank(user.xp || 0);
        
        // Actualización atómica usando increment para evitar race conditions
        await user.increment('xp', { by: amount });
        
        // Recargar el usuario para obtener el nuevo XP real de la base de datos
        await user.reload();
        
        const newXP = user.xp;
        const newRank = getRank(newXP);

        return {
            newXP,
            rankUp: newRank.name !== oldRank.name,
            newRank: newRank.name,
            oldRank: oldRank.name
        };
    } catch (err) {
        // El XP nunca debe romper el flujo principal
        console.error('[awardXP] Error al otorgar XP:', err.message);
        return null;
    }
};

module.exports = awardXP;
module.exports.XP_REWARDS = XP_REWARDS;
