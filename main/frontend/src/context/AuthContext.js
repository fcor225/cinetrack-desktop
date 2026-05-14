import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import config from '../config';
import authService from '../services/authService';
import { getToken, getUserData, setUserData, clearSession } from '../utils/storage';

/**
 * @module context/AuthContext
 * @description Contexto de autenticación global para CineTrack.
 * Evolución del AuthContext de EasyTourney con mejoras:
 *
 * 1. useCallback en login/logout para estabilidad de referencias
 * 2. useRef para el socket (evita re-renders innecesarios)
 * 3. Escucha evento 'logout:unauthorized' del apiClient (desacoplado)
 * 4. Estado isLoading durante verificación inicial del token
 * 5. Socket.IO para expulsión en tiempo real (force_logout)
 * 6. Limpieza completa de efectos para evitar memory leaks
 *
 * @example
 * // En App.js:
 * import { AuthProvider } from './context/AuthContext';
 *
 * function App() {
 *     return (
 *         <AuthProvider>
 *             <RouterConfig />
 *         </AuthProvider>
 *     );
 * }
 *
 * // En cualquier componente:
 * import useAuth from '../hooks/useAuth';
 *
 * function Dashboard() {
 *     const { user, logout, isLoading } = useAuth();
 *     if (isLoading) return <Spinner />;
 *     return <h1>Hola, {user.username}</h1>;
 * }
 */

/** @type {React.Context} Contexto de autenticación */
export const AuthContext = createContext(null);

/**
 * Provider de autenticación que envuelve la aplicación.
 * Gestiona el estado global de sesión, conexión Socket.IO y verificación de token.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Provider con el contexto de auth
 */
export const AuthProvider = ({ children }) => {
    /** @type {[Object|null, Function]} Estado del usuario autenticado */
    const [user, setUser] = useState(null);

    /** @type {[boolean, Function]} Estado de carga durante verificación del token */
    const [isLoading, setIsLoading] = useState(true);

    /** @type {React.MutableRefObject<Socket|null>} Referencia al socket (evita re-renders) */
    const socketRef = useRef(null);

    /** @type {React.MutableRefObject<boolean>} Flag para evitar operaciones tras unmount */
    const isMountedRef = useRef(true);

    const navigate = useNavigate();

    // ═══════════════════════════════════════════
    // Efecto 1: Verificación inicial del token al cargar la app
    // ═══════════════════════════════════════════
    useEffect(() => {
        const loadUser = async () => {
            const token = getToken();
            const cachedUserData = getUserData();

            if (token && cachedUserData) {
                try {
                    // Restaurar estado inmediatamente con datos cacheados
                    // para evitar flash de pantalla de login
                    setUser({ token, ...cachedUserData });

                    // Desbloquear render si hay datos suficientes cacheados
                    if (cachedUserData.email) {
                        setIsLoading(false);
                    }

                    // Sincronizar con perfil fresco del backend
                    const freshData = await authService.getProfile();
                    if (freshData && isMountedRef.current) {
                        freshData.id = freshData._id || freshData.id;
                        setUserData(freshData);
                        setUser({ token, ...freshData });
                    }
                } catch (err) {
                    console.error('Error al sincronizar perfil:', err);
                    // Si el error NO es 401, mantener sesión local
                    // El interceptor de apiClient maneja el 401 automáticamente
                } finally {
                    if (isMountedRef.current) {
                        setIsLoading(false);
                    }
                }
            } else {
                setIsLoading(false);
            }
        };

        loadUser();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // ═══════════════════════════════════════════
    // Efecto 2: Conexión Socket.IO para notificaciones y force_logout
    // ═══════════════════════════════════════════
    useEffect(() => {
        // Conectar solo si hay usuario autenticado
        if (user && user.id) {
            // Evitar conexiones duplicadas
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            const socket = io(config.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            // Unirse a sala privada del usuario
            socket.emit('joinUserRoom', user.id);

            // Escuchar expulsión en tiempo real (login desde otro dispositivo o admin delete)
            socket.on('force_logout', () => {
                console.warn('⚠️ Sesión cerrada remotamente');
                clearSession();
                setUser(null);
                if (isMountedRef.current) {
                    window.location.href = '/login';
                }
            });

            socketRef.current = socket;
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id]); // Solo reconectar si cambia el ID del usuario

    // ═══════════════════════════════════════════
    // Efecto 3: Escuchar evento global de auto-logout del apiClient
    // ═══════════════════════════════════════════
    useEffect(() => {
        const handleUnauthorized = (event) => {
            console.warn('🔒 Auto-logout por 401:', event.detail?.message);
            setUser(null);
            if (isMountedRef.current) {
                navigate('/login');
            }
        };

        window.addEventListener('logout:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('logout:unauthorized', handleUnauthorized);
        };
    }, [navigate]);

    // ═══════════════════════════════════════════
    // Acciones de autenticación (estabilizadas con useCallback)
    // ═══════════════════════════════════════════

    /**
     * Inicia sesión del usuario.
     * Actualiza el estado y redirige al dashboard.
     * @param {Object} data - Respuesta del login: { token, user }
     */
    const login = useCallback((data) => {
        setUser({ token: data.token, ...data.user });
        navigate('/');
    }, [navigate]);

    /**
     * Cierra la sesión del usuario.
     * Invalida sesión en backend, limpia localStorage y redirige a login.
     */
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (err) {
            // Silenciar — el usuario puede estar offline
        }
        setUser(null);
        navigate('/login');
    }, [navigate]);

    // ═══════════════════════════════════════════
    // Valor del contexto
    // ═══════════════════════════════════════════

    /** @type {Object} Valor expuesto por el contexto */
    const contextValue = {
        /** @type {Object|null} Datos del usuario autenticado (null si no hay sesión) */
        user,
        /** @type {boolean} true mientras se verifica el token al cargar la app */
        isLoading,
        /** @type {Function} Función de login: (data) => void */
        login,
        /** @type {Function} Función de logout: () => Promise<void> */
        logout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
