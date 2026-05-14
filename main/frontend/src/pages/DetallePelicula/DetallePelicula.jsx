import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import tmdbService from '../../services/tmdbService';
import movieService from '../../services/movieService';
import reviewService from '../../services/reviewService';
import StarRating from '../../components/common/StarRating';
import Spinner from '../../components/common/Spinner';
import { toast } from '../../components/common/Toast';
import TrailerPlayer from '../../components/tmdb/TrailerPlayer';
import CastAndCrew from '../../components/tmdb/CastAndCrew';
import WatchProviders from '../../components/tmdb/WatchProviders';
import SimilarRecommendations from '../../components/tmdb/SimilarRecommendations';
import CommunityReviews from '../../components/CommunityReviews';
import AddToListModal from '../../components/common/AddToListModal';
import './DetallePelicula.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

/**
 * Componente: DetallePelicula
 * Implementa el Sistema Híbrido de Reseñas (Local/Offline + Remoto/Online)
 * Y muestra toda la información real de la película.
 */
const DetallePelicula = () => {
    const { tmdbId } = useParams();
    const isOnline = useOnlineStatus();
    
    const [movie, setMovie] = useState(null);
    const [saved, setSaved] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showListModal, setShowListModal] = useState(false);
    
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Estado - Mi Opinión (Local)
    const [localReviews, setLocalReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ texto: '', estrellas: 0, contiene_spoilers: false });
    const [isSavingLocal, setIsSavingLocal] = useState(false);
    
    useEffect(() => {
        const loadMovieData = async () => {
            try {
                // Cargar detalles de TMDB (vía backend proxy) y estado de la BD local
                // Si el usuario no está logueado, movieService.checkGuardada fallará o devolverá vacío. 
                // Lo manejamos capturando el error para que al menos cargue TMDB.
                let checkRes = { data: null };
                try {
                    if (user) {
                        checkRes = await movieService.checkGuardada(tmdbId);
                    }
                } catch (e) { console.warn("No logged in or check failed", e); }

                const details = await tmdbService.getMovieDetails(tmdbId);
                
                setMovie(details.data);
                setSaved(checkRes.data?.pelicula || null);
                
                // Si la película ya está guardada localmente, cargar reseñas locales
                if (checkRes.data?.pelicula) {
                    const revRes = await reviewService.getDePelicula(checkRes.data.pelicula.id_local);
                    setLocalReviews(revRes.data || []);
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        loadMovieData();
    }, [tmdbId, user]);

    const handleProtectedAction = (actionCallback) => {
        if (user) {
            actionCallback();
        } else {
            toast.error("Inicia sesión para guardar o interactuar.");
            navigate('/login');
        }
    };

    /**
     * OPTIMISTIC UI — handleSave (Tarea 2)
     * Crea un objeto provisional en el estado local ANTES de que responda el backend.
     * Si la petición falla, revierte al estado anterior y muestra el error.
     */
    const handleSave = async () => {
        handleProtectedAction(async () => {
            // Snapshot del estado previo para rollback
            const previousSaved = saved;

            // Actualización optimista: provisional con estado PENDIENTE
            const optimisticSaved = {
                id_local: null, // aún no asignado por el servidor
                tmdb_id: movie.id,
                titulo: movie.title,
                poster_path: movie.poster_path,
                estado: 'PENDIENTE',
                _isOptimistic: true // bandera interna para identificar entradas provisionales
            };
            setSaved(optimisticSaved);
            toast.success('Película guardada en Pendientes');

            try {
                const res = await movieService.guardar({
                    tmdb_id: movie.id,
                    titulo: movie.title,
                    titulo_original: movie.original_title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    sinopsis: movie.overview,
                    anio: parseInt(movie.release_date?.substring(0, 4)) || null,
                    valoracion_tmdb: movie.vote_average,
                    fecha_estreno: movie.release_date,
                    duracion: movie.runtime,
                    generos: movie.genres?.map(g => g.name)
                });
                // Reemplazamos el provisional con los datos reales del servidor
                setSaved(res.data);
            } catch (err) {
                // ROLLBACK: revertimos al estado previo
                setSaved(previousSaved);
                toast.error(err.response?.data?.message || 'Error al guardar la película');
            }
        });
    };

    /**
     * OPTIMISTIC UI — handleState (Tarea 2)
     * Actualiza el estado de la película en la UI de forma inmediata.
     * Si el backend rechaza la operación, revierte al estado anterior.
     */
    const handleState = async (estado) => {
        handleProtectedAction(async () => {
            // Snapshot del estado previo para rollback
            const previousSaved = saved;

            // Actualización optimista: cambia el estado visualmente al instante
            setSaved(prev => ({ ...prev, estado }));
            toast.success(`Estado cambiado a: ${estado}`);

            try {
                const res = await movieService.cambiarEstado(saved.id_local, estado);
                // Sincronizamos con la respuesta real del servidor
                setSaved(res.data);
            } catch (err) {
                // ROLLBACK: revertimos al estado anterior
                setSaved(previousSaved);
                toast.error(err.response?.data?.message || 'Error al cambiar el estado');
            }
        });
    };

    const handleSaveLocalReview = async (e) => {
        e.preventDefault();
        handleProtectedAction(async () => {
            if (!reviewForm.estrellas || !reviewForm.texto) {
                return toast.error('Completa estrellas y texto');
            }
            setIsSavingLocal(true);
            try {
                // Guarda la reseña usando la API local conectada a SQLite
                const res = await reviewService.crear({ pelicula_id: saved.id_local, ...reviewForm });
                setLocalReviews(prev => [res.data, ...prev]);
                setReviewForm({ texto: '', estrellas: 0, contiene_spoilers: false });
                toast.success('Reseña guardada en tu colección local');
            } catch (err) { 
                toast.error(err.response?.data?.message || 'Error guardando reseña'); 
            } finally { 
                setIsSavingLocal(false); 
            }
        });
    };

    if (loading) return <div className="container"><Spinner size="lg" text="Cargando ficha de la película..." /></div>;
    if (!movie) return <div className="container"><p>Película no encontrada</p></div>;

    const backdrop = movie.backdrop_path ? `${TMDB_IMG}/w1280${movie.backdrop_path}` : null;
    const poster = movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : null;
    const directors = movie.credits?.crew?.filter(c => c.job === 'Director') || [];
    // eslint-disable-next-line no-unused-vars
    const cast = movie.credits?.cast?.slice(0, 8) || [];

    // Regla de negocio: Solo se puede reseñar si está en VISTA o FAVORITA
    const canReview = saved && ['VISTA', 'FAVORITA'].includes(saved.estado);

    return (
        <div className="detalle-pelicula">
            {/* Cabecera visual (Backdrop) */}
            {backdrop && (
                <div className="detalle-page__backdrop" style={{ backgroundImage: `url(${backdrop})` }}>
                    <div className="detalle-page__backdrop-overlay"></div>
                </div>
            )}
            
            <div className="container detalle-page__content">
                <div className="detalle-page__poster">
                    {poster ? <img src={poster} alt={movie.title} /> : <div className="detalle-page__no-poster">🎬</div>}
                </div>
                
                <div className="detalle-page__info">
                    <header className="detalle-header">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <h1>{movie.title} {movie.release_date && <span className="detalle-page__year">({movie.release_date.substring(0,4)})</span>}</h1>
                            {!isOnline && <span className="badge-offline" style={{alignSelf: 'flex-start'}}>⚡ Modo Offline</span>}
                        </div>
                    </header>
                    
                    {movie.tagline && <p className="detalle-page__tagline">"{movie.tagline}"</p>}
                    
                    <div className="detalle-page__meta">
                        <span className="detalle-page__rating">⭐ {movie.vote_average?.toFixed(1)}</span>
                        {movie.runtime > 0 && <span>{Math.floor(movie.runtime/60)}h {movie.runtime%60}min</span>}
                        {movie.genres?.map(g => <span key={g.id} className="badge badge--vista">{g.name}</span>)}
                    </div>
                    
                    <p className="detalle-page__overview">{movie.overview}</p>
                    {directors.length > 0 && <p className="detalle-page__director"><strong>Director:</strong> {directors.map(d => d.name).join(', ')}</p>}
                    
                    {/* Controles de Estado de la Película */}
                    <div className="detalle-page__actions">
                        {!saved ? (
                            <button className="btn btn--primary btn--lg" onClick={handleSave}>+ Añadir a Pendientes</button>
                        ) : (
                            <>
                                <span className={`badge badge--${saved.estado?.toLowerCase()}`}>{saved.estado}</span>
                                {saved.estado === 'PENDIENTE' && <button className="btn btn--secondary" onClick={() => handleState('VISTA')}>👁️ Marcar Vista</button>}
                                {saved.estado === 'VISTA' && (
                                    <>
                                        <button className="btn btn--secondary" onClick={() => handleState('FAVORITA')}>⭐ Favorita</button>
                                        <button className="btn btn--secondary" onClick={() => handleState('ARCHIVADA')}>📦 Archivar</button>
                                    </>
                                )}
                                {saved.estado === 'FAVORITA' && <button className="btn btn--secondary" onClick={() => handleState('ARCHIVADA')}>📦 Archivar</button>}
                                {/* Botón Añadir a Lista — solo si ya está guardada con id real */}
                                {saved.id_local && !saved._isOptimistic && (
                                    <button
                                        className="btn btn--ghost"
                                        onClick={() => setShowListModal(true)}
                                        title="Añadir a una lista personalizada"
                                    >
                                        📋 Añadir a Lista
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Modal: Añadir a Lista */}
                    {showListModal && saved?.id_local && (
                        <AddToListModal
                            peliculaId={saved.id_local}
                            peliculaTitulo={movie?.title}
                            onClose={() => setShowListModal(false)}
                        />
                    )}

                    <WatchProviders movieId={tmdbId} />
                    <CastAndCrew movieId={tmdbId} />
                </div>
            </div>

            <div className="container">
                <TrailerPlayer movieId={tmdbId} />
                <SimilarRecommendations movieId={tmdbId} />
            </div>

            {/* SISTEMA HÍBRIDO DE RESEÑAS */}
            <div className="container reviews-layout">
                {/* SECCIÓN LOCAL: Siempre funciona (offline-first) */}
                <section className="review-section local-section">
                    <h2 className="section-title">Mi Opinión</h2>
                    
                    {canReview ? (
                        <div className="local-review-card">
                            <form onSubmit={handleSaveLocalReview}>
                                <div className="rating-container">
                                    <span className="rating-label">Tu valoración:</span>
                                    <StarRating rating={reviewForm.estrellas} interactive size="md" onChange={(v) => setReviewForm({...reviewForm, estrellas: v})} />
                                </div>
                                <textarea 
                                    className="review-textarea"
                                    placeholder="¿Qué te pareció la película? Escribe tu reseña aquí..."
                                    value={reviewForm.texto}
                                    onChange={(e) => setReviewForm({...reviewForm, texto: e.target.value})}
                                />
                                <div style={{marginTop: '10px'}}>
                                    <label className="detalle-page__spoiler-check">
                                        <input type="checkbox" checked={reviewForm.contiene_spoilers} onChange={(e) => setReviewForm({...reviewForm, contiene_spoilers: e.target.checked})} /> 
                                        <span>Contiene spoilers</span>
                                    </label>
                                </div>
                                <div className="action-bar">
                                    <button type="submit" className="btn-save" disabled={isSavingLocal}>
                                        {isSavingLocal ? 'Guardando...' : 'Guardar Reseña Local'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="offline-message" style={{padding: '20px', textAlign: 'left', marginTop: '0'}}>
                            <p>Debes añadir la película y marcarla como <strong>Vista</strong> o <strong>Favorita</strong> para poder escribir tu reseña.</p>
                        </div>
                    )}

                    {/* Mostrar las reseñas locales guardadas */}
                    {localReviews.length > 0 && (
                        <div style={{marginTop: '30px'}}>
                            <h3 style={{marginBottom: '15px', color: '#9ab', fontSize: '1rem'}}>Tus reseñas en CineTrack</h3>
                            {localReviews.map(r => (
                                <div key={r.id_resena} className="community-review-card" style={{marginBottom: '15px', borderColor: '#00e054'}}>
                                    <div className="reviewer-header">
                                        <div className="reviewer-info">
                                            <strong style={{color: '#00e054'}}>{r.autor?.nombre || 'Tú'}</strong>
                                            <span className="community-rating" style={{marginLeft: '10px'}}>
                                                <StarRating rating={r.estrellas} size="sm" />
                                            </span>
                                        </div>
                                    </div>
                                    {r.contiene_spoilers && <span className="badge badge--pendiente" style={{marginBottom: '10px', display: 'inline-block'}}>⚠️ Spoilers</span>}
                                    <div className="review-content">
                                        <p style={{color: '#fff'}}>{r.texto}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* SECCIÓN COMUNIDAD: Depende de la red y usa Trakt.tv */}
                {/* userMovieState se usa en CommunityReviews para la lógica inteligente de spoilers (Tarea 3) */}
                <section className="review-section community-section">
                    <CommunityReviews tmdbId={tmdbId} userMovieState={saved?.estado} />
                </section>
            </div>
        </div>
    );
};

export default DetallePelicula;
