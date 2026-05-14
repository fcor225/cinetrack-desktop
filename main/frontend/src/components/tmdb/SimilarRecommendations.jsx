import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import './SimilarRecommendations.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

const SimilarRecommendations = ({ movieId }) => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOnline || !movieId) return;

        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                const response = await tmdbService.getRecommendations(movieId);
                // Nos quedamos con los 6 primeros resultados para no saturar la vista
                setRecommendations(response.data?.slice(0, 6) || []);
            } catch (err) {
                console.error("Error fetching recommendations", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [movieId, isOnline]);

    if (!isOnline || recommendations.length === 0) return null;

    if (isLoading) return <div className="loading-sm">Buscando similitudes...</div>;

    return (
        <div className="recommendations-container">
            <h3>Si te gustó esta, también te podría gustar...</h3>
            <div className="recommendations-grid">
                {recommendations.map(movie => (
                    <div 
                        key={movie.id} 
                        className="rec-card" 
                        title={movie.title}
                        onClick={() => navigate(`/pelicula/${movie.id}`)}
                    >
                        {movie.poster_path ? (
                            <img src={`${TMDB_IMG}${movie.poster_path}`} alt={movie.title} />
                        ) : (
                            <div className="rec-no-poster">🎬</div>
                        )}
                        <span className="rec-title">{movie.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimilarRecommendations;
