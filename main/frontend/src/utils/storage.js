import config from '../config';

/**
 * @module utils/storage
 * @description Abstracción de localStorage para CineTrack.
 * Heredado de EasyTourney (getStoredItem/setStoredItem/removeStoredItem)
 * con fallback seguro para entornos sin localStorage (SSR, testing).
 *
 * Centraliza el acceso al almacenamiento local para facilitar
 * el cambio a otro mecanismo (sessionStorage, cookies) en el futuro.
 */

/**
 * Verifica si localStorage está disponible en el entorno actual.
 * @returns {boolean} true si localStorage está disponible
 */
const isStorageAvailable = () => {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
};

/** @type {boolean} Cache del resultado de disponibilidad */
const storageAvailable = isStorageAvailable();

/**
 * Obtiene un valor del almacenamiento local.
 * @param {string} key - Clave a buscar
 * @returns {string|null} Valor almacenado o null si no existe
 */
export const getStoredItem = (key) => {
    if (!storageAvailable) return null;
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`Error al leer '${key}' de localStorage:`, e);
        return null;
    }
};

/**
 * Almacena un valor en el almacenamiento local.
 * @param {string} key - Clave de almacenamiento
 * @param {string} value - Valor a almacenar
 * @returns {boolean} true si se almacenó correctamente
 */
export const setStoredItem = (key, value) => {
    if (!storageAvailable) return false;
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`Error al escribir '${key}' en localStorage:`, e);
        return false;
    }
};

/**
 * Elimina un valor del almacenamiento local.
 * @param {string} key - Clave a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
export const removeStoredItem = (key) => {
    if (!storageAvailable) return false;
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn(`Error al eliminar '${key}' de localStorage:`, e);
        return false;
    }
};

/**
 * Obtiene el token JWT almacenado.
 * @returns {string|null} Token JWT o null
 */
export const getToken = () => getStoredItem(config.TOKEN_KEY);

/**
 * Almacena el token JWT.
 * @param {string} token - Token JWT a almacenar
 */
export const setToken = (token) => setStoredItem(config.TOKEN_KEY, token);

/**
 * Elimina el token JWT del almacenamiento.
 */
export const removeToken = () => removeStoredItem(config.TOKEN_KEY);

/**
 * Obtiene los datos del usuario almacenados.
 * @returns {Object|null} Datos del usuario parseados o null
 */
export const getUserData = () => {
    const data = getStoredItem(config.USER_DATA_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn('Error al parsear datos de usuario de localStorage:', e);
        return null;
    }
};

/**
 * Almacena los datos del usuario.
 * @param {Object} userData - Datos del usuario a almacenar
 */
export const setUserData = (userData) => {
    setStoredItem(config.USER_DATA_KEY, JSON.stringify(userData));
};

/**
 * Elimina los datos del usuario del almacenamiento.
 */
export const removeUserData = () => removeStoredItem(config.USER_DATA_KEY);

/**
 * Limpia todos los datos de sesión (token + usuario).
 * Usado en logout y auto-logout por 401.
 */
export const clearSession = () => {
    removeToken();
    removeUserData();
};
