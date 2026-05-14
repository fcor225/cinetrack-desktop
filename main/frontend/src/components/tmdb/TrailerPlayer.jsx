import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import './TrailerPlayer.css';

const TrailerPlayer = ({ movieId }) => {
    const isOnline = useOnlineStatus();
    const [trailerKey, setTrailerKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOnline || !movieId) return;

        const fetchVideos = async () => {
            setIsLoading(true);
            try {
                const response = await tmdbService.getMovieVideos(movieId);
                const videos = response.data || [];
                
                // Buscar el primer trailer oficial en YouTube
                const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube");
                if (trailer) {
                    setTrailerKey(trailer.key);
                }
            } catch (err) {
                console.error("Error fetching videos", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, [movieId, isOnline]);

    // Si está offline, carga, o no hay trailer, no renderizamos nada (return null)
    if (!isOnline || isLoading || !trailerKey) return null;

    return (
        <div className="trailer-container">
            <h3>Tráiler Oficial</h3>
            <div className="video-responsive">
                <iframe
                    width="853"
                    height="480"
                    src={`https://www.youtube.com/embed/${trailerKey}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Embedded youtube"
                />
            </div>
        </div>
    );
};

export default TrailerPlayer;
