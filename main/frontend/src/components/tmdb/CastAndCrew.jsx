import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import './CastAndCrew.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const CastAndCrew = ({ movieId }) => {
    const isOnline = useOnlineStatus();
    const [credits, setCredits] = useState({ cast: [], director: null });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOnline || !movieId) return;

        const fetchCredits = async () => {
            setIsLoading(true);
            try {
                const response = await tmdbService.getMovieCredits(movieId);
                const data = response.data || {};
                
                // Extraer el director
                const director = data.crew?.find(member => member.job === 'Director');
                // Limitar a los 10 primeros actores
                const cast = data.cast?.slice(0, 10) || [];
                
                setCredits({ cast, director });
            } catch (err) {
                console.error("Error fetching credits", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCredits();
    }, [movieId, isOnline]);

    if (!isOnline) {
        return <div className="offline-fallback">Detalles de reparto no disponibles offline.</div>;
    }

    if (isLoading) return <div className="loading-sm">Cargando reparto...</div>;
    if (credits.cast.length === 0) return null;

    return (
        <div className="cast-crew-container">
            {credits.director && (
                <div className="director-info">
                    <strong>Director:</strong> {credits.director.name}
                </div>
            )}
            
            <h3>Reparto Principal</h3>
            <div className="cast-grid">
                {credits.cast.map(actor => (
                    <div key={actor.id} className="cast-card">
                        {actor.profile_path ? (
                            <img src={`${TMDB_IMG}${actor.profile_path}`} alt={actor.name} />
                        ) : (
                            <div className="cast-no-photo">👤</div>
                        )}
                        <span className="cast-name">{actor.name}</span>
                        <span className="cast-char">{actor.character}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CastAndCrew;
