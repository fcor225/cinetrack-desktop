import React from 'react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

const MovieGrid = ({ movies, showState, onSave, savedIds = [] }) => {
    if (!movies || movies.length === 0) {
        return (
            <div className="movie-grid__empty">
                <span className="movie-grid__empty-icon">🎬</span>
                <p>No se encontraron películas</p>
            </div>
        );
    }
    return (
        <div className="movie-grid">
            {movies.map((movie, i) => (
                <MovieCard
                    key={movie.id || movie.id_local || i}
                    movie={movie}
                    showState={showState}
                    onSave={onSave}
                    saved={savedIds.includes(movie.id || movie.tmdb_id)}
                />
            ))}
        </div>
    );
};

export default MovieGrid;
