import axios from 'axios';
import config from '../config';
import { getToken, clearSession } from '../utils/storage';

/**
 * @module services/apiClient
 * @description Instancia de Axios dedicada para CineTrack con interceptores de
 * request y response. Evolución del enfoque de EasyTourney donde el interceptor
 * se registraba directamente en el módulo axios global.
 *
 * Mejoras sobre EasyTourney:
 * 1. Instancia aislada (no contamina axios global)
 * 2. Interceptor de REQUEST: inyecta x-auth-token automáticamente
 * 3. Interceptor de RESPONSE: captura 401 y dispara evento 'logout:unauthorized'
 * 4. Timeout configurable desde config.js
 * 5. Evento global para desacoplar apiClient de AuthContext
 *
 * @example
 * import apiClient from './apiClient';
 * const { data } = await apiClient.get('/auth/profile');
 * const { data } = await apiClient.post('/auth/login', { email, password });
 */

// ═══════════════════════════════════════════════
// Crear instancia dedicada de Axios
// ═══════════════════════════════════════════════

const apiClient = axios.create({
    baseURL: config.API_URL,
    timeout: config.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ═══════════════════════════════════════════════
// Interceptor de REQUEST — Inyección automática del token JWT
// ═══════════════════════════════════════════════

apiClient.interceptors.request.use(
    (requestConfig) => {
        const token = getToken();

        if (token) {
            requestConfig.headers['x-auth-token'] = token;
        }

        return requestConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════
// Interceptor de RESPONSE — Auto-logout en 401
// ═══════════════════════════════════════════════

/**
 * Set de rutas que NO deben disparar auto-logout al recibir 401.
 * (Por ejemplo, login fallido no debe cerrar sesión).
 * @type {Set<string>}
 */
const AUTH_WHITELIST = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
]);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Verificar que la petición NO sea de auth (login, register, etc.)
            const requestUrl = error.config?.url || '';
            const isAuthRoute = Array.from(AUTH_WHITELIST).some(
                (route) => requestUrl.includes(route)
            );

            if (!isAuthRoute) {
                // Limpiar sesión
                clearSession();

                // Disparar evento global para que AuthContext reaccione
                // Sin acoplamiento directo entre apiClient y AuthContext
                window.dispatchEvent(new CustomEvent('logout:unauthorized', {
                    detail: {
                        code: error.response.data?.code || 'UNAUTHORIZED',
                        message: error.response.data?.message || 'Sesión expirada'
                    }
                }));
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
