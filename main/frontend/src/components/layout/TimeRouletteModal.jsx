import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import movieService from '../../services/movieService';
import tmdbService from '../../services/tmdbService';
import { toast } from '../../components/common/Toast';
import Spinner from '../common/Spinner';
import './TimeRouletteModal.css';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

const TimeRouletteModal = ({ isOpen, onClose }) => {
    const [minutes, setMinutes] = useState(120);
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, ROULETTE, RESULT, NO_MATCH
    const [currentMovie, setCurrentMovie] = useState(null);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleStart = async () => {
        if (!minutes || minutes < 30) {
            toast.error("Debes tener al menos 30 minutos libres 🎬");
            return;
        }

        setStatus('LOADING');
        try {
            // 1. Obtener todas las películas PENDIENTES
            const res = await movieService.getMias({ estado: 'PENDIENTE' });
            let pendientes = res.data || [];

            if (pendientes.length === 0) {
                setStatus('NO_MATCH');
                return;
            }

            // 2. Obtener duraciones faltantes desde TMDB (en paralelo)
            const moviesWithDuration = await Promise.all(pendientes.map(async (movie) => {
                let dur = movie.duracion;
                if (!dur) {
                    try {
                        const details = await tmdbService.getMovieDetails(movie.tmdb_id);
                        dur = details.data?.runtime || null;
                        // Nota: Idealmente actualizaríamos la DB local, pero para UX rápida lo usamos en memoria
                    } catch (e) {
                        dur = 120; // fallback genérico si falla TMDB
                    }
                }
                return { ...movie, duracion: dur };
            }));

            // 3. Filtrar las que encajan en el tiempo
            const validMovies = moviesWithDuration.filter(m => m.duracion && m.duracion <= minutes);

            if (validMovies.length === 0) {
                setStatus('NO_MATCH');
                return;
            }

            // 4. Iniciar Ruleta
            setStatus('ROULETTE');
            const winner = validMovies[Math.floor(Math.random() * validMovies.length)];
            
            let spins = 0;
            const maxSpins = 25; // Cantidad de saltos de la ruleta
            
            const spinRoulette = () => {
                const randomVisual = validMovies[Math.floor(Math.random() * validMovies.length)];
                setCurrentMovie(randomVisual);
                spins++;
                
                if (spins < maxSpins) {
                    // Ralentizar progresivamente la ruleta (efecto fricción)
                    const delay = 50 + (spins * spins * 0.5); 
                    setTimeout(spinRoulette, delay);
                } else {
                    // Fin de la ruleta
                    setCurrentMovie(winner);
                    setStatus('RESULT');
                }
            };
            
            spinRoulette();

        } catch (error) {
            console.error('[TimeRoulette] Error:', error);
            toast.error('Ocurrió un error mágico. Inténtalo de nuevo.');
            setStatus('IDLE');
        }
    };

    const handleReset = () => {
        setStatus('IDLE');
        setCurrentMovie(null);
    };

    return (
        <div className="roulette-overlay">
            <div className="roulette-modal">
                <button className="roulette-close" onClick={onClose}>✕</button>
                
                {status === 'IDLE' && (
                    <div className="roulette-content animate-slideUp">
                        <div className="roulette-icon">⏳</div>
                        <h2 className="roulette-title">La Ruleta del Tiempo</h2>
                        <p className="roulette-desc">Dinos cuánto tiempo libre tienes y elegiremos la película perfecta de tu lista de pendientes.</p>
                        
                        <div className="roulette-input-group">
                            <input 
                                type="number" 
                                className="roulette-input" 
                                value={minutes} 
                                onChange={(e) => setMinutes(Number(e.target.value))}
                                min="30" max="600"
                            />
                            <span className="roulette-unit">minutos</span>
                        </div>
                        
                        <button className="btn btn--primary btn--lg roulette-btn" onClick={handleStart}>
                            Girar la Ruleta 🎡
                        </button>
                    </div>
                )}

                {status === 'LOADING' && (
                    <div className="roulette-content">
                        <Spinner size="lg" text="Analizando tu colección y sincronizando el espacio-tiempo..." />
                    </div>
                )}

                {status === 'ROULETTE' && currentMovie && (
                    <div className="roulette-content">
                        <h2 className="roulette-title pulse-text">Decidiendo...</h2>
                        <div className="roulette-card-container">
                            <img 
                                src={currentMovie.poster_path ? `${TMDB_POSTER}${currentMovie.poster_path}` : 'https://via.placeholder.com/500x750?text=CineTrack'} 
                                alt={currentMovie.titulo} 
                                className="roulette-card spin-anim"
                            />
                        </div>
                    </div>
                )}

                {status === 'RESULT' && currentMovie && (
                    <div className="roulette-content animate-popIn">
                        <div className="roulette-winner-badge">¡Tenemos Ganadora! 🍿</div>
                        <div className="roulette-card-container winner">
                            <img 
                                src={currentMovie.poster_path ? `${TMDB_POSTER}${currentMovie.poster_path}` : 'https://via.placeholder.com/500x750?text=CineTrack'} 
                                alt={currentMovie.titulo} 
                                className="roulette-card"
                            />
                        </div>
                        <h3 className="roulette-movie-title">{currentMovie.titulo}</h3>
                        <p className="roulette-movie-meta">⏱️ {currentMovie.duracion} min</p>
                        
                        <div className="roulette-actions">
                            <button className="btn btn--primary" onClick={() => navigate(`/pelicula/${currentMovie.tmdb_id}`)}>
                                Ver Detalles
                            </button>
                            <button className="btn btn--secondary" onClick={handleReset}>
                                Tirar de nuevo
                            </button>
                        </div>
                    </div>
                )}

                {status === 'NO_MATCH' && (
                    <div className="roulette-content animate-slideUp">
                        <div className="roulette-icon">🏜️</div>
                        <h2 className="roulette-title">No hay coincidencias</h2>
                        <p className="roulette-desc">No tienes películas pendientes que duren {minutes} minutos o menos. ¡Intenta buscar algo más corto o añade más películas a tu colección!</p>
                        <button className="btn btn--primary roulette-btn" onClick={handleReset}>Volver</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeRouletteModal;
