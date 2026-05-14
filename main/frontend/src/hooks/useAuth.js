import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * @module hooks/useAuth
 * @description Custom hook para consumir el AuthContext con validación.
 * Lanza un error descriptivo si se usa fuera del AuthProvider.
 *
 * @example
 * import useAuth from '../hooks/useAuth';
 *
 * function ProfilePage() {
 *     const { user, logout, isLoading } = useAuth();
 *
 *     if (isLoading) return <p>Cargando...</p>;
 *     if (!user) return <Navigate to="/login" />;
 *
 *     return (
 *         <div>
 *             <h1>Hola, {user.username}</h1>
 *             <button onClick={logout}>Cerrar sesión</button>
 *         </div>
 *     );
 * }
 *
 * @returns {Object} Contexto de autenticación
 * @returns {Object|null} .user - Datos del usuario autenticado
 * @returns {boolean} .isLoading - Estado de carga durante verificación del token
 * @returns {Function} .login - Función de login (data) => void
 * @returns {Function} .logout - Función de logout () => Promise<void>
 * @throws {Error} Si se usa fuera de un AuthProvider
 */
const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth debe ser utilizado dentro de un <AuthProvider>. ' +
            'Asegúrate de que el componente esté envuelto en <AuthProvider> en el árbol de componentes.'
        );
    }

    return context;
};

export default useAuth;
