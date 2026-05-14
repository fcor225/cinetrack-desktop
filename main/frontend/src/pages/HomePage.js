import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import MovieDashboard from '../components/tmdb/MovieDashboard';
import Spinner from '../components/common/Spinner';
import { toast } from '../components/common/Toast';
import TimeRouletteModal from '../components/layout/TimeRouletteModal';
import './HomePage.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w1280';

const HomePage = () => {
    // trending/popular se usan indirectamente vía el hero aleatorio
    // eslint-disable-next-line no-unused-vars
    const [trending, setTrending] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [popular, setPopular] = useState([]);
    const [hero, setHero] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (!isOnline) return;
        const load = async () => {
            try {
                const [t, p] = await Promise.all([tmdbService.getTrending('day'), tmdbService.getPopular()]);
                setTrending(t.data || []);
                setPopular(p.data || []);
                if (t.data?.length > 0) setHero(t.data[Math.floor(Math.random() * Math.min(5, t.data.length))]);
            } catch (err) { console.error('Error cargando datos:', err); }
            finally { setLoading(false); }
        };
        load();
    }, [isOnline]);

    const handleProtectedAction = (actionCallback) => {
        if (user) {
            actionCallback();
        } else {
            toast.error("Inicia sesión para poder interactuar.");
            navigate('/login');
        }
    };

    const handleSave = async (movie) => {
        handleProtectedAction(async () => {
            try {
                await movieService.guardar({
                    tmdb_id: movie.id, titulo: movie.title, titulo_original: movie.original_title,
                    poster_path: movie.poster_path, backdrop_path: movie.backdrop_path,
                    sinopsis: movie.overview, anio: parseInt(movie.release_date?.substring(0,4)) || null,
                    valoracion_tmdb: movie.vote_average, fecha_estreno: movie.release_date,
                    generos: movie.genre_ids
                });
                toast.success(`'${movie.title}' añadida a Pendientes`);
            } catch (err) {
                const msg = err.response?.data?.message || 'Error al guardar';
                toast.error(msg);
            }
        });
    };

    const handleOpenRoulette = () => {
        handleProtectedAction(() => {
            setIsRouletteOpen(true);
        });
    };

    if (!isOnline) {
        return (
            <div className="home-page container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                <h1 style={{ color: '#fff' }}>⚡ Modo Offline</h1>
                <p style={{ color: '#9ab', margin: '20px 0' }}>Estás navegando sin conexión. Ve a "Mi Colección" para ver tus películas guardadas.</p>
                <button className="btn btn--primary" onClick={() => navigate('/coleccion')}>Ir a Mi Colección</button>
            </div>
        );
    }

    if (loading) return <div className="container"><Spinner size="lg" text="Cargando escaparate..." /></div>;

    return (
        <div className="home-page">
            {hero && (
                <div className="hero" style={{ backgroundImage: `url(${TMDB_IMG}${hero.backdrop_path})` }}>
                    <div className="hero__overlay">
                        <div className="hero__content container animate-slideUp">
                            <h1 className="hero__title">{hero.title}</h1>
                            <p className="hero__overview">{hero.overview?.substring(0, 200)}...</p>
                            <div className="hero__meta">
                                <span className="hero__rating">⭐ {hero.vote_average?.toFixed(1)}</span>
                                <span>{hero.release_date?.substring(0,4)}</span>
                            </div>
                            <button className="btn btn--primary btn--lg" onClick={() => handleSave(hero)}>+ Añadir a Pendientes</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                {/* ── Banner: La Ruleta del Tiempo ── */}
                <div className="roulette-banner" onClick={handleOpenRoulette}>
                    <div className="roulette-banner__content">
                        <span className="roulette-banner__icon">⏳</span>
                        <div>
                            <h2 className="roulette-banner__title">¿No sabes qué ver?</h2>
                            <p className="roulette-banner__text">Usa la Ruleta del Tiempo para elegir una película de tus pendientes.</p>
                        </div>
                    </div>
                    <button className="btn roulette-banner__btn">Girar Ruleta 🎡</button>
                </div>

                <MovieDashboard />
            </div>

            <TimeRouletteModal isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} />
        </div>
    );
};
export default HomePage;
