import { useState, useEffect } from 'react';

/**
 * Hook para monitorizar el estado de la conexión a Internet.
 * Utiliza la API del navegador 'navigator.onLine' y escucha los eventos 'online' y 'offline'.
 * 
 * @returns {boolean} true si hay conexión, false si está offline.
 */
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};
