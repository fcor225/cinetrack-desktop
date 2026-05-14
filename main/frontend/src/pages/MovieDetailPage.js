import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import reviewService from '../services/reviewService';
import StarRating from '../components/common/StarRating';
import Spinner from '../components/common/Spinner';
import { toast } from '../components/common/Toast';
import './MovieDetailPage.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

const MovieDetailPage = () => {
    const { tmdbId } = useParams();
    const [movie, setMovie] = useState(null);
    const [saved, setSaved] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState({ texto: '', estrellas: 0, contiene_spoilers: false });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [details, checkRes] = await Promise.all([tmdbService.getMovieDetails(tmdbId), movieService.checkGuardada(tmdbId)]);
                setMovie(details.data);
                setSaved(checkRes.data?.pelicula || null);
                if (checkRes.data?.pelicula) {
                    const revRes = await reviewService.getDePelicula(checkRes.data.pelicula.id_local);
                    setReviews(revRes.data || []);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, [tmdbId]);

    const handleSave = async () => {
        try {
            const res = await movieService.guardar({ tmdb_id: movie.id, titulo: movie.title, titulo_original: movie.original_title, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, sinopsis: movie.overview, anio: parseInt(movie.release_date?.substring(0,4)) || null, valoracion_tmdb: movie.vote_average, fecha_estreno: movie.release_date, duracion: movie.runtime, generos: movie.genres?.map(g => g.name) });
            setSaved(res.data);
            toast.success('Película guardada en Pendientes');
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    const handleState = async (estado) => {
        try {
            const res = await movieService.cambiarEstado(saved.id_local, estado);
            setSaved(res.data);
            toast.success(`Estado: ${estado}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.estrellas || !reviewForm.texto) { toast.error('Completa estrellas y texto'); return; }
        setSubmitting(true);
        try {
            const res = await reviewService.crear({ pelicula_id: saved.id_local, ...reviewForm });
            setReviews(prev => [res.data, ...prev]);
            setReviewForm({ texto: '', estrellas: 0, contiene_spoilers: false });
            toast.success('Reseña publicada');
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="container"><Spinner size="lg" text="Cargando ficha técnica..." /></div>;
    if (!movie) return <div className="container"><p>Película no encontrada</p></div>;

    const backdrop = movie.backdrop_path ? `${TMDB_IMG}/w1280${movie.backdrop_path}` : null;
    const poster = movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : null;
    const directors = movie.credits?.crew?.filter(c => c.job === 'Director') || [];
    const cast = movie.credits?.cast?.slice(0, 8) || [];
    const canReview = saved && ['VISTA', 'FAVORITA'].includes(saved.estado);

    return (
        <div className="detail-page">
            {backdrop && <div className="detail-page__backdrop" style={{ backgroundImage: `url(${backdrop})` }}><div className="detail-page__backdrop-overlay"></div></div>}
            <div className="container detail-page__content">
                <div className="detail-page__poster">{poster ? <img src={poster} alt={movie.title} /> : <div className="detail-page__no-poster">🎬</div>}</div>
                <div className="detail-page__info">
                    <h1 className="detail-page__title">{movie.title} {movie.release_date && <span className="detail-page__year">({movie.release_date.substring(0,4)})</span>}</h1>
                    {movie.tagline && <p className="detail-page__tagline">"{movie.tagline}"</p>}
                    <div className="detail-page__meta">
                        <span className="detail-page__rating">⭐ {movie.vote_average?.toFixed(1)}</span>
                        {movie.runtime > 0 && <span>{Math.floor(movie.runtime/60)}h {movie.runtime%60}min</span>}
                        {movie.genres?.map(g => <span key={g.id} className="badge badge--vista">{g.name}</span>)}
                    </div>
                    <p className="detail-page__overview">{movie.overview}</p>
                    {directors.length > 0 && <p className="detail-page__director"><strong>Director:</strong> {directors.map(d => d.name).join(', ')}</p>}
                    <div className="detail-page__actions">
                        {!saved ? (
                            <button className="btn btn--primary btn--lg" onClick={handleSave}>+ Añadir a Pendientes</button>
                        ) : (
                            <>
                                <span className={`badge badge--${saved.estado?.toLowerCase()}`}>{saved.estado}</span>
                                {saved.estado === 'PENDIENTE' && <button className="btn btn--secondary" onClick={() => handleState('VISTA')}>👁️ Marcar Vista</button>}
                                {saved.estado === 'VISTA' && <><button className="btn btn--secondary" onClick={() => handleState('FAVORITA')}>⭐ Favorita</button><button className="btn btn--secondary" onClick={() => handleState('ARCHIVADA')}>📦 Archivar</button></>}
                                {saved.estado === 'FAVORITA' && <button className="btn btn--secondary" onClick={() => handleState('ARCHIVADA')}>📦 Archivar</button>}
                            </>
                        )}
                    </div>
                    {cast.length > 0 && (
                        <div className="detail-page__cast">
                            <h3>Reparto</h3>
                            <div className="detail-page__cast-grid">{cast.map(c => (
                                <div key={c.id} className="detail-page__cast-item">
                                    {c.profile_path ? <img src={`${TMDB_IMG}/w185${c.profile_path}`} alt={c.name} /> : <div className="detail-page__cast-placeholder">👤</div>}
                                    <span className="detail-page__cast-name">{c.name}</span>
                                    <span className="detail-page__cast-char">{c.character}</span>
                                </div>
                            ))}</div>
                        </div>
                    )}
                </div>
            </div>
            {canReview && (
                <div className="container detail-page__review-form">
                    <h3>Escribe tu reseña</h3>
                    <form onSubmit={handleReview}>
                        <StarRating rating={reviewForm.estrellas} interactive size="lg" onChange={(v) => setReviewForm({...reviewForm, estrellas: v})} />
                        <textarea className="input-field" rows="4" placeholder="¿Qué te pareció esta película? (mín. 10 caracteres)" value={reviewForm.texto} onChange={(e) => setReviewForm({...reviewForm, texto: e.target.value})} />
                        <label className="detail-page__spoiler-check"><input type="checkbox" checked={reviewForm.contiene_spoilers} onChange={(e) => setReviewForm({...reviewForm, contiene_spoilers: e.target.checked})} /> Contiene spoilers</label>
                        <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Publicando...' : 'Publicar Reseña'}</button>
                    </form>
                </div>
            )}
            {reviews.length > 0 && (
                <div className="container detail-page__reviews">
                    <h3>Reseñas ({reviews.length})</h3>
                    {reviews.map(r => (
                        <div key={r.id_resena} className="detail-page__review-item">
                            <div className="detail-page__review-header"><span className="detail-page__review-author">{r.autor?.nombre || 'Usuario'}</span><StarRating rating={r.estrellas} size="sm" /></div>
                            {r.contiene_spoilers && <span className="badge badge--pendiente">⚠️ Spoilers</span>}
                            <p>{r.texto}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default MovieDetailPage;
