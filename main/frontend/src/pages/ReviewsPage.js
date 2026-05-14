import React, { useState, useEffect } from 'react';
import reviewService from '../services/reviewService';
import StarRating from '../components/common/StarRating';
import Spinner from '../components/common/Spinner';
import { useNavigate } from 'react-router-dom';
import './ReviewsPage.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

const ReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try { const res = await reviewService.getMias(); setReviews(res.data || []); } catch {}
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <div className="container"><Spinner text="Cargando reseñas..." /></div>;

    return (
        <div className="container reviews-page">
            <h1>Mis Reseñas</h1>
            {reviews.length === 0 ? (
                <div className="reviews-page__empty"><p>Aún no has escrito ninguna reseña. Marca una película como Vista para poder reseñarla.</p></div>
            ) : (
                <div className="reviews-page__list">
                    {reviews.map(r => (
                        <div key={r.id_resena} className="reviews-page__item" onClick={() => r.pelicula?.tmdb_id && navigate(`/pelicula/${r.pelicula.tmdb_id}`)}>
                            <div className="reviews-page__poster">
                                {r.pelicula?.poster_path ? <img src={`${TMDB_IMG}${r.pelicula.poster_path}`} alt="" /> : <div className="reviews-page__poster-placeholder">🎬</div>}
                            </div>
                            <div className="reviews-page__content">
                                <div className="reviews-page__header">
                                    <h3>{r.pelicula?.titulo || 'Película'} {r.pelicula?.anio && <span>({r.pelicula.anio})</span>}</h3>
                                    <StarRating rating={r.estrellas} size="sm" />
                                </div>
                                {r.contiene_spoilers && <span className="badge badge--pendiente" style={{marginBottom: '4px'}}>⚠️ Spoilers</span>}
                                <p>{r.texto}</p>
                                <span className="reviews-page__date">{new Date(r.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default ReviewsPage;
