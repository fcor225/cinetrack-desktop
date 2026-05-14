import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

const MovieCard = ({ movie, showState, onSave, onStateChange, saved }) => {
    const navigate = useNavigate();
    const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
    const year = movie.release_date?.substring(0, 4) || movie.anio || '';
    const rating = movie.vote_average?.toFixed(1) || movie.valoracion_tmdb?.toFixed(1) || '';
    const tmdbId = movie.tmdb_id || movie.id;

    const handleClick = () => navigate(`/pelicula/${tmdbId}`);

    return (
        <div className="movie-card animate-fadeIn" onClick={handleClick}>
            <div className="movie-card__poster">
                {posterUrl ? (
                    <img src={posterUrl} alt={movie.titulo || movie.title} loading="lazy" />
                ) : (
                    <div className="movie-card__no-poster">🎬</div>
                )}
                <div className="movie-card__overlay">
                    {rating && <span className="movie-card__rating">⭐ {rating}</span>}
                    {!saved && onSave && (
                        <button className="btn btn--primary btn--sm movie-card__save" onClick={(e) => { e.stopPropagation(); onSave(movie); }}>
                            + Guardar
                        </button>
                    )}
                    {saved && <span className="movie-card__saved-badge">✓ Guardada</span>}
                </div>
            </div>
            <div className="movie-card__info">
                <h3 className="movie-card__title">{movie.titulo || movie.title}</h3>
                <div className="movie-card__meta">
                    {year && <span>{year}</span>}
                    {showState && movie.estado && (
                        <span className={`badge badge--${movie.estado.toLowerCase()}`}>{movie.estado}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
