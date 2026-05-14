import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import './WatchProviders.css';

const WatchProviders = ({ movieId }) => {
    const isOnline = useOnlineStatus();
    const [providers, setProviders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOnline || !movieId) return;

        const fetchProviders = async () => {
            setIsLoading(true);
            try {
                const response = await tmdbService.getWatchProviders(movieId);
                // Filtramos por ES (España) o la región deseada
                const esData = response.data?.ES;
                if (esData && esData.flatrate) {
                    setProviders(esData.flatrate);
                } else {
                    setProviders([]);
                }
            } catch (err) {
                console.error("Error fetching watch providers", err);
                setError("No se pudieron cargar los proveedores.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviders();
    }, [movieId, isOnline]);

    if (!isOnline) {
        return <div className="offline-fallback">No disponible sin conexión.</div>;
    }

    if (isLoading) return <div className="loading">Cargando plataformas...</div>;
    if (error) return <div className="error">{error}</div>;
    if (providers.length === 0) return null; // No renderiza nada si no hay plataformas

    return (
        <div className="watch-providers-container">
            <h3>Disponible en Streaming</h3>
            <div className="providers-list">
                {providers.map(provider => (
                    <div key={provider.provider_id} className="provider-item" title={provider.provider_name}>
                        <img 
                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                            alt={provider.provider_name} 
                            className="provider-logo" 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WatchProviders;
