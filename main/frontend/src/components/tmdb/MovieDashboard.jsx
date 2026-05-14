import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import './MovieDashboard.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

const MovieDashboard = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [data, setData] = useState({ trending: [], nowPlaying: [], upcoming: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOnline) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const dashboardData = await tmdbService.getDashboardMovies();
                setData(dashboardData);
            } catch (err) {
                console.error("Error fetching dashboard", err);
                setError("Error al conectar con TMDB.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOnline]);

    if (!isOnline) {
        return (
            <div className="dashboard-offline">
                <h2>Estás desconectado</h2>
                <p>Revisa tu colección local o vuelve a conectarte para ver las tendencias globales.</p>
            </div>
        );
    }

    if (isLoading) return <div className="loading-dashboard">Cargando cartelera global...</div>;
    if (error) return <div className="error">{error}</div>;

    const renderCarousel = (title, movies) => (
        <section className="dashboard-section">
            <h3>{title}</h3>
            <div className="dashboard-carousel">
                {movies.map(movie => (
                    <div 
                        key={movie.id} 
                        className="dashboard-movie-card" 
                        onClick={() => navigate(`/pelicula/${movie.id}`)}
                    >
                        {movie.poster_path ? (
                            <img src={`${TMDB_IMG}${movie.poster_path}`} alt={movie.title} loading="lazy" />
                        ) : (
                            <div className="no-poster">🎬</div>
                        )}
                        <span className="movie-rating">★ {movie.vote_average?.toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="movie-dashboard">
            {renderCarousel("🔥 Tendencias Hoy", data.trending)}
            {renderCarousel("🍿 En Cartelera", data.nowPlaying)}
            {renderCarousel("📅 Próximos Estrenos", data.upcoming)}
        </div>
    );
};

export default MovieDashboard;
