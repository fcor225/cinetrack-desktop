import apiClient from './apiClient';
import { setToken, setUserData, clearSession, getToken } from '../utils/storage';

/**
 * @module services/authService
 * @description Servicio de autenticación para CineTrack.
 * Evolución del authService de EasyTourney con mejoras:
 * 1. Usa apiClient aislado (no axios global)
 * 2. Deduplicación de peticiones concurrentes con promise cache
 * 3. Almacenamiento automático de token y datos de usuario
 * 4. JSDoc completo en cada método
 *
 * Todas las funciones delegan la inyección del token JWT al interceptor
 * de apiClient, eliminando la necesidad de getAuthHeaders() manual.
 */

/** @type {Promise|null} Cache de promesa para evitar requests duplicados al perfil */
let profilePromise = null;

/**
 * Registra un nuevo usuario en el sistema.
 * @param {Object} userData - Datos del nuevo usuario
 * @param {string} userData.username - Nombre de usuario (3-30 chars)
 * @param {string} userData.email - Correo electrónico
 * @param {string} userData.password - Contraseña (mín. 6 chars)
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

/**
 * Inicia sesión del usuario.
 * Almacena automáticamente el token JWT y los datos del usuario en localStorage.
 *
 * @param {Object} credentials - Credenciales de login
 * @param {string} credentials.email - Correo electrónico
 * @param {string} credentials.password - Contraseña
 * @param {boolean} [credentials.forceLogout=false] - Forzar cierre de sesión anterior
 * @returns {Promise<{success: boolean, data: {token: string, user: Object}}>}
 */
const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);

    if (response.data.success && response.data.data.token) {
        setToken(response.data.data.token);
        setUserData(response.data.data.user);
    }

    return response.data;
};

/**
 * Cierra la sesión del usuario.
 * Invalida el sessionToken en el backend y limpia localStorage.
 *
 * @returns {Promise<{success: boolean, message: string}>}
 */
const logout = async () => {
    try {
        // Solo intentar logout en backend si hay token
        if (getToken()) {
            await apiClient.post('/auth/logout');
        }
    } catch (err) {
        // Silenciar error — el usuario puede estar offline
        console.warn('Error al cerrar sesión en backend:', err.message);
    } finally {
        clearSession();
    }
};

/**
 * Obtiene el perfil del usuario autenticado.
 * Implementa deduplicación de peticiones concurrentes:
 * si se llama múltiples veces simultáneamente, reutiliza la misma promesa.
 *
 * @returns {Promise<Object>} Datos del perfil del usuario
 */
const getProfile = async () => {
    if (profilePromise) return profilePromise;

    profilePromise = (async () => {
        try {
            const response = await apiClient.get('/auth/profile');
            return response.data.data;
        } finally {
            // Liberar cache después de 1 segundo para permitir requests futuros
            setTimeout(() => {
                profilePromise = null;
            }, 1000);
        }
    })();

    return profilePromise;
};

/**
 * Actualiza el perfil del usuario autenticado.
 * @param {Object} userData - Campos a actualizar { username?, email?, foto? }
 * @returns {Promise<Object>} Datos actualizados del usuario
 */
const updateProfile = async (userData) => {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data.data;
};

/**
 * Cambia la contraseña del usuario autenticado.
 * @param {Object} passwords - Contraseñas
 * @param {string} passwords.passwordActual - Contraseña actual
 * @param {string} passwords.passwordNuevo - Nueva contraseña (mín. 6 chars)
 * @returns {Promise<{success: boolean, message: string}>}
 */
const changePassword = async (passwords) => {
    const response = await apiClient.put('/auth/change-password', passwords);
    return response.data;
};

/**
 * Solicita un token de recuperación de contraseña.
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise<{success: boolean, message: string, resetToken?: string}>}
 */
const forgotPassword = async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
};

/**
 * Restablece la contraseña usando un token de recuperación.
 * @param {string} token - Token de recuperación recibido por email
 * @param {string} password - Nueva contraseña (mín. 6 chars)
 * @returns {Promise<{success: boolean, message: string}>}
 */
const resetPassword = async (token, password) => {
    const response = await apiClient.post(`/auth/reset-password/${token}`, { password });
    return response.data;
};

/**
 * Obtiene el perfil de XP, rango y desafíos del usuario.
 * @returns {Promise<{ xp, rango, progreso, desafios }>}
 */
const getXpProfile = async () => {
    const response = await apiClient.get('/auth/xp');
    return response.data.data;
};

/**
 * Obtiene las misiones y logros dinámicos generados por Data Mining.
 * @returns {Promise<Array>}
 */
const getDynamicAchievements = async () => {
    const response = await apiClient.get('/auth/achievements/dynamic');
    return response.data.data;
};

const authService = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getXpProfile,
    getDynamicAchievements
};

export default authService;
