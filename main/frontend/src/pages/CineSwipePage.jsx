import React, { useState, useEffect, useRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import { toast } from '../components/common/Toast';
import './CineSwipePage.css';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

/**
 * @component CineSwipePage
 * @description Modo de descubrimiento "Tinder-style" para CineTrack.
 *
 * - Swipe Derecha / botón ❤️  → Guarda la película (estado PENDIENTE)
 * - Swipe Izquierda / botón ✕ → Descarta (no guarda nada)
 * - Cuando el mazo se agota, carga un nuevo lote de películas
 * - Si el usuario está offline, muestra un bloqueo informativo
 * - Botón "Deshacer" (⟲) para recuperar la última carta descartada
 */
const CineSwipePage = () => {
    const isOnline = useOnlineStatus();

    const [movies, setMovies] = useState([]);          // Mazo actual
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastDirection, setLastDirection] = useState(null);
    const [swipeCount, setSwipeCount] = useState({ saved: 0, skipped: 0 });

    // Refs a las APIs de TinderCard para el control programático
    const cardRefs = useRef([]);
    // Ref al índice actual para acceder en callbacks asinc sin stale closure
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // ── Carga inicial / recarga ──────────────────────────────────────────────
    const loadMovies = useCallback(async (isRefresh = false) => {
        isRefresh ? setLoadingMore(true) : setLoading(true);
        try {
            const res = await tmdbService.getDiscoverMovies();
            const data = res.data || [];
            // Invertir el array: TinderCard muestra el último elemento encima
            const deck = [...data].reverse();
            setMovies(deck);
            setCurrentIndex(deck.length - 1);
            cardRefs.current = deck.map(() => React.createRef());
        } catch (err) {
            toast.error('Error al cargar películas. Inténtalo de nuevo.');
            console.error('[CineSwipe] loadMovies error:', err);
        } finally {
            isRefresh ? setLoadingMore(false) : setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOnline) loadMovies();
    }, [isOnline, loadMovies]);

    // ── Lógica de swipe ──────────────────────────────────────────────────────
    /**
     * Callback de TinderCard al completar el gesto de deslizamiento.
     * @param {string} direction - 'left' | 'right' | 'up' | 'down'
     * @param {Object} movie     - Datos de la película
     * @param {number} index     - Índice en el array `movies`
     */
    const onSwipe = useCallback(async (direction, movie, index) => {
        setLastDirection(direction);
        setCurrentIndex(prev => prev - 1);

        if (direction === 'right') {
            await saveMovie(movie);
            setSwipeCount(prev => ({ ...prev, saved: prev.saved + 1 }));
        } else if (direction === 'left') {
            setSwipeCount(prev => ({ ...prev, skipped: prev.skipped + 1 }));
        }
    }, []); // eslint-disable-line

    /**
     * Guarda la película en la colección local con estado PENDIENTE.
     * @param {Object} movie - Película de TMDB
     */
    const saveMovie = async (movie) => {
        if (saving) return;
        setSaving(true);
        try {
            await movieService.guardar({
                tmdb_id: movie.id,
                titulo: movie.title,
                titulo_original: movie.original_title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                sinopsis: movie.overview,
                anio: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null,
                valoracion_tmdb: movie.vote_average,
                fecha_estreno: movie.release_date,
                generos: movie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean) || []
            });
            toast.success(`💾 "${movie.title}" guardada en Pendientes`);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg?.includes('Ya tienes')) {
                toast.info(`Ya tienes "${movie.title}" en tu colección`);
            } else {
                toast.error(`Error al guardar "${movie.title}"`);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Controles programáticos ──────────────────────────────────────────────
    /** Dispara el swipe izquierdo (descartar) en la carta actual */
    const handleDiscard = useCallback(async () => {
        const idx = currentIndexRef.current;
        if (idx < 0 || !cardRefs.current[idx]?.current) return;
        await cardRefs.current[idx].current.swipe('left');
    }, []);

    /** Dispara el swipe derecho (guardar) en la carta actual */
    const handleSave = useCallback(async () => {
        const idx = currentIndexRef.current;
        if (idx < 0 || !cardRefs.current[idx]?.current) return;
        await cardRefs.current[idx].current.swipe('right');
    }, []);

    /** Deshace el último swipe (solo si TinderCard lo soporta) */
    const handleUndo = useCallback(async () => {
        const idx = currentIndexRef.current;
        const nextIdx = idx + 1;
        if (nextIdx >= movies.length) return;
        if (!cardRefs.current[nextIdx]?.current) return;
        await cardRefs.current[nextIdx].current.restoreCard();
        setCurrentIndex(nextIdx);
        setLastDirection(null);
        toast.info('⟲ Carta recuperada');
    }, [movies.length]);

    const deckExhausted = !loading && currentIndex < 0;

    // ── Bloqueo offline ──────────────────────────────────────────────────────
    if (!isOnline) {
        return (
            <div className="cineswipe-offline">
                <div className="cineswipe-offline__icon">📡</div>
                <h2>Sin conexión a internet</h2>
                <p>Conéctate a internet para descubrir nuevas películas en la ruleta.</p>
            </div>
        );
    }

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="cineswipe-loading">
                <div className="cineswipe-loading__card">
                    <div className="cineswipe-loading__shimmer" />
                </div>
                <p>Cargando películas...</p>
            </div>
        );
    }

    return (
        <div className="cineswipe-page">
            {/* ── Header ── */}
            <header className="cineswipe-header">
                <h1 className="cineswipe-header__title">
                    <span className="cineswipe-header__icon">🎬</span> CineSwipe
                </h1>
                <div className="cineswipe-header__counters">
                    <span className="counter counter--skip">✕ {swipeCount.skipped}</span>
                    <span className="counter counter--save">❤️ {swipeCount.saved}</span>
                </div>
            </header>

            {/* ── Instrucciones ── */}
            <p className="cineswipe-hint">
                ← Desliza a la izquierda para descartar · Desliza a la derecha para guardar →
            </p>

            {/* ── Mazo de cartas ── */}
            <div className="cineswipe-deck">
                {deckExhausted ? (
                    /* Fin del mazo */
                    <div className="cineswipe-empty">
                        <div className="cineswipe-empty__icon">🎉</div>
                        <h2>¡Has visto todo!</h2>
                        <p>Guardadas: <strong>{swipeCount.saved}</strong> · Descartadas: <strong>{swipeCount.skipped}</strong></p>
                        <button
                            className="btn btn--primary btn--lg"
                            onClick={() => {
                                setSwipeCount({ saved: 0, skipped: 0 });
                                loadMovies(true);
                            }}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Cargando...' : '🔄 Descubrir Más'}
                        </button>
                    </div>
                ) : (
                    movies.map((movie, index) => (
                        <TinderCard
                            ref={cardRefs.current[index]}
                            key={movie.id}
                            className="swipe-card-wrapper"
                            onSwipe={(dir) => onSwipe(dir, movie, index)}
                            preventSwipe={['up', 'down']}
                            swipeRequirementType="position"
                            swipeThreshold={80}
                        >
                            <MovieCard movie={movie} isTop={index === currentIndex} />
                        </TinderCard>
                    ))
                )}
            </div>

            {/* ── Feedback de dirección ── */}
            {lastDirection && currentIndex >= 0 && (
                <div className={`swipe-feedback swipe-feedback--${lastDirection === 'right' ? 'save' : 'skip'}`}>
                    {lastDirection === 'right' ? '❤️ GUARDADA' : '✕ DESCARTADA'}
                </div>
            )}

            {/* ── Botones de acción ── */}
            {!deckExhausted && (
                <div className="cineswipe-controls">
                    <button
                        className="ctrl-btn ctrl-btn--skip"
                        onClick={handleDiscard}
                        title="Descartar (←)"
                        aria-label="Descartar"
                    >✕</button>

                    <button
                        className="ctrl-btn ctrl-btn--undo"
                        onClick={handleUndo}
                        title="Deshacer último swipe"
                        aria-label="Deshacer"
                    >⟲</button>

                    <button
                        className="ctrl-btn ctrl-btn--save"
                        onClick={handleSave}
                        disabled={saving}
                        title="Guardar (→)"
                        aria-label="Guardar"
                    >❤️</button>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Carta de película
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @component MovieCard
 * @description Tarjeta visual de una película dentro del mazo CineSwipe.
 * Muestra el póster a pantalla completa con un overlay de información.
 */
const MovieCard = React.memo(({ movie, isTop }) => {
    const posterUrl = movie.poster_path
        ? `${TMDB_POSTER}${movie.poster_path}`
        : `${TMDB_BACKDROP}${movie.backdrop_path}`;

    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
    const genreNames = (movie.genre_ids || [])
        .map(id => GENRE_MAP[id])
        .filter(Boolean)
        .slice(0, 3);

    return (
        <div
            className={`movie-card ${isTop ? 'movie-card--top' : ''}`}
            style={{ backgroundImage: `url(${posterUrl})` }}
            role="article"
            aria-label={`Película: ${movie.title}`}
        >
            {/* Rating badge */}
            <div className="movie-card__rating">
                <span className="movie-card__rating-star">⭐</span>
                <span>{rating}</span>
            </div>

            {/* Bottom info overlay */}
            <div className="movie-card__overlay">
                <h2 className="movie-card__title">{movie.title}</h2>
                <div className="movie-card__meta">
                    <span className="movie-card__year">{year}</span>
                    {genreNames.map(g => (
                        <span key={g} className="movie-card__genre-chip">{g}</span>
                    ))}
                </div>
                {movie.overview && (
                    <p className="movie-card__overview">
                        {movie.overview.length > 140
                            ? movie.overview.slice(0, 140) + '…'
                            : movie.overview}
                    </p>
                )}
            </div>

            {/* Indicadores de swipe en los bordes */}
            <div className="movie-card__like-label">❤️ GUARDAR</div>
            <div className="movie-card__nope-label">✕ PASAR</div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de IDs de géneros TMDB → nombres en español
// ─────────────────────────────────────────────────────────────────────────────
const GENRE_MAP = {
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
    80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
    14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
    9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción',
    10770: 'Película de TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Western'
};

export default CineSwipePage;
