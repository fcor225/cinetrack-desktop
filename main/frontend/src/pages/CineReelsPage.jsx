import React, {
    useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import { toast } from '../components/common/Toast';
import './CineReelsPage.css';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

/**
 * Construye la URL de embed de YouTube con los parámetros correctos para autoplay mudo.
 * @param {string} videoKey - Key del vídeo de YouTube
 * @param {boolean} muted   - Si el vídeo debe estar silenciado
 * @returns {string}
 */
const buildEmbedUrl = (videoKey, muted) =>
    `https://www.youtube.com/embed/${videoKey}` +
    `?autoplay=1&mute=${muted ? 1 : 0}&controls=1&loop=1` +
    `&playlist=${videoKey}&playsinline=1&enablejsapi=1` +
    `&modestbranding=1&rel=0&showinfo=0`;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: un Reel individual
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @component ReelItem
 * @description Una sección de 100vh con iframe de YouTube incrustado y controles superpuestos.
 *
 * Diseño:
 *   - iframe centrado y escalado a pantalla completa (sin barras negras)
 *   - Overlay de gradiente oscuro para legibilidad
 *   - Info (título, año, rating, sinopsis) abajo-izquierda
 *   - Botones de acción (guardar, mute) abajo-derecha
 *
 * @param {Object}   props
 * @param {Object}   props.reel          - Datos del reel (película + videoKey)
 * @param {boolean}  props.isActive      - Si este reel está actualmente en pantalla
 * @param {boolean}  props.globalMuted   - Estado global de mute
 * @param {Function} props.onToggleMute  - Callback para alternar mute global
 * @param {boolean}  props.isLast        - Si es el último del feed (no mostrar hint)
 */
const ReelItem = React.memo(({ reel, isActive, globalMuted, onToggleMute, isLast }) => {
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSaveFeedback, setShowSaveFeedback] = useState(false);
    const iframeRef = useRef(null);

    /**
     * Manda un comando postMessage al iframe de YouTube activo.
     * Evita recargar el iframe al cambiar el estado de mute.
     * @param {'mute'|'unMute'} command
     */
    const sendYTCommand = useCallback((command) => {
        if (!iframeRef.current?.contentWindow) return;
        iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: command, args: [] }),
            '*'
        );
    }, []);

    // Sincronizar mute/unmute vía postMessage cuando cambia globalMuted
    useEffect(() => {
        if (!isActive) return;
        sendYTCommand(globalMuted ? 'mute' : 'unMute');
    }, [globalMuted, isActive, sendYTCommand]);

    const handleSave = async () => {
        if (saving || saved) return;
        setSaving(true);
        try {
            await movieService.guardar({
                tmdb_id: reel.id,
                titulo: reel.title,
                titulo_original: reel.original_title,
                poster_path: reel.poster_path,
                backdrop_path: reel.backdrop_path,
                sinopsis: reel.overview,
                anio: reel.release_date ? parseInt(reel.release_date.slice(0, 4)) : null,
                valoracion_tmdb: reel.vote_average,
                fecha_estreno: reel.release_date,
                generos: (reel.genre_ids || [])
                    .map(id => GENRE_MAP[id])
                    .filter(Boolean)
            });
            setSaved(true);
            setShowSaveFeedback(true);
            setTimeout(() => setShowSaveFeedback(false), 900);
        } catch (err) {
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('ya tienes') || err.response?.status === 409) {
                toast.info(`Ya tienes "${reel.title}" en tu colección`);
                setSaved(true);
            } else {
                toast.error(`Error al guardar "${reel.title}"`);
            }
        } finally {
            setSaving(false);
        }
    };

    const year = reel.release_date ? reel.release_date.slice(0, 4) : '—';
    const rating = reel.vote_average ? reel.vote_average.toFixed(1) : '—';

    // El src del iframe depende de si el reel está activo (rendimiento)
    // - Activo: reproducir con el estado de mute actual
    // - Inactivo: imagen de fondo del póster (no cargar iframe innecesariamente)
    const iframeSrc = useMemo(
        () => buildEmbedUrl(reel.videoKey, globalMuted),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [reel.videoKey] // Solo reconstruir al cambiar de reel (no al mutar, eso va por postMessage)
    );

    return (
        <section
            className="reel"
            aria-label={`Reel: ${reel.title}`}
        >
            {/* ── Fondo: iframe de YouTube o póster (si no activo) ── */}
            <div className="reel__iframe-wrapper">
                {isActive ? (
                    <iframe
                        ref={iframeRef}
                        className="reel__iframe"
                        src={iframeSrc}
                        title={`Tráiler de ${reel.title}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen={false}
                        frameBorder="0"
                    />
                ) : (
                    /* Imagen del póster para reels no activos (performance) */
                    <div
                        style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: reel.poster_path
                                ? `url(${TMDB_POSTER}${reel.poster_path})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(2px) brightness(0.4)'
                        }}
                    />
                )}
            </div>

            {/* ── Overlays de gradiente ── */}
            <div className="reel__overlay-top" />
            <div className="reel__overlay" />

            {/* ── Feedback de guardado ── */}
            {showSaveFeedback && (
                <div className="reel__save-feedback">
                    ✅ ¡Añadida a Pendientes!
                </div>
            )}

            {/* ── Info: título, año, rating, sinopsis ── */}
            <div className="reel__info">
                <h2 className="reel__title">{reel.title}</h2>
                <div className="reel__meta">
                    <span className="reel__year">{year}</span>
                    <span className="reel__rating">⭐ {rating}</span>
                </div>
                {reel.overview && (
                    <p className="reel__overview">{reel.overview}</p>
                )}
            </div>

            {/* ── Acciones: guardar + mute ── */}
            <div className="reel__actions">
                {/* Botón Guardar */}
                <button
                    className={`reel__action-btn reel__action-btn--save ${saved ? 'saved' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                    aria-label={saved ? 'Ya guardada' : 'Guardar película'}
                >
                    <span className="reel__action-icon">
                        {saved ? '✅' : saving ? '⏳' : '❤️'}
                    </span>
                    <span className="reel__action-label">
                        {saved ? 'Guardada' : 'Guardar'}
                    </span>
                </button>

                {/* Botón Mute/Unmute — solo visible en el reel activo */}
                {isActive && (
                    <button
                        className="reel__action-btn"
                        onClick={onToggleMute}
                        aria-label={globalMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                        <span className="reel__action-icon">
                            {globalMuted ? '🔇' : '🔊'}
                        </span>
                        <span className="reel__action-label">
                            {globalMuted ? 'Sonido' : 'Silencio'}
                        </span>
                    </button>
                )}
            </div>

            {/* ── Nombre del vídeo ── */}
            {reel.videoName && (
                <span className="reel__video-name">🎬 {reel.videoName}</span>
            )}

            {/* ── Indicador de scroll (solo si no es el último) ── */}
            {!isLast && (
                <div className="reel__scroll-hint" aria-hidden="true">
                    <span>▼</span>
                    <span>Desliza</span>
                </div>
            )}
        </section>
    );
});
ReelItem.displayName = 'ReelItem';

// ─────────────────────────────────────────────────────────────────────────────
// Página principal: CineReelsPage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @component CineReelsPage
 * @description Feed vertical estilo TikTok/Reels para descubrir tráilers de películas.
 *
 * Características:
 * - Scroll-snap: cada sección ocupa el 100% de la pantalla
 * - IntersectionObserver para detectar el reel activo (sin cálculos de scroll)
 * - Solo el reel visible renderiza el iframe de YouTube (rendimiento)
 * - Mute/Unmute vía postMessage (sin recargar iframe)
 * - Bloqueo offline con mensaje amigable
 * - Estado de carga con animación de barras musicales
 */
const CineReelsPage = () => {
    const isOnline = useOnlineStatus();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [globalMuted, setGlobalMuted] = useState(true); // Silenciado por defecto (autoplay policy)

    const reelRefs = useRef([]);  // Refs a cada sección .reel
    const feedRef = useRef(null); // Ref al contenedor scroll

    // ── Carga del feed ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOnline) { setLoading(false); return; }

        const load = async () => {
            setLoading(true);
            try {
                const data = await tmdbService.getCineReelsFeed();
                setReels(data);
            } catch (err) {
                console.error('[CineReels] Error cargando feed:', err);
                toast.error('Error al cargar los CineReels. Inténtalo más tarde.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isOnline]);

    // ── IntersectionObserver: detectar reel activo ───────────────────────────
    useEffect(() => {
        if (!reels.length) return;

        const observers = reelRefs.current.map((el, index) => {
            if (!el) return null;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    // Un reel está "activo" cuando es ≥60% visible
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                        setActiveIndex(index);
                    }
                },
                { threshold: 0.6 }
            );
            obs.observe(el);
            return obs;
        });

        return () => observers.forEach(obs => obs?.disconnect());
    }, [reels]);

    const handleToggleMute = useCallback(() => {
        setGlobalMuted(prev => !prev);
    }, []);

    // ── Estado: sin internet ─────────────────────────────────────────────────
    if (!isOnline) {
        return (
            <div className="cinereels-offline">
                <div className="cinereels-offline__icon">📡</div>
                <h2>Sin conexión a internet</h2>
                <p>Los CineReels requieren conexión a internet para reproducir los tráilers.</p>
            </div>
        );
    }

    // ── Estado: cargando ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="cinereels-loading">
                <div className="cinereels-loading__bars">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="cinereels-loading__bar" />
                    ))}
                </div>
                <p>Preparando CineReels...</p>
            </div>
        );
    }

    // ── Estado: sin resultados ───────────────────────────────────────────────
    if (!reels.length) {
        return (
            <div className="cinereels-offline">
                <div className="cinereels-offline__icon">🎬</div>
                <h2>Sin tráilers disponibles</h2>
                <p>No se encontraron tráilers para las películas en tendencia. Inténtalo más tarde.</p>
            </div>
        );
    }

    // ── Feed principal ───────────────────────────────────────────────────────
    return (
        <div className="cinereels-feed" ref={feedRef} role="feed" aria-label="CineReels">
            {reels.map((reel, index) => (
                <div
                    key={reel.id}
                    ref={el => { reelRefs.current[index] = el; }}
                >
                    <ReelItem
                        reel={reel}
                        isActive={index === activeIndex}
                        globalMuted={globalMuted}
                        onToggleMute={handleToggleMute}
                        isLast={index === reels.length - 1}
                    />
                </div>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de géneros TMDB → español (compartido con CineSwipe)
// ─────────────────────────────────────────────────────────────────────────────
const GENRE_MAP = {
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
    80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
    14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
    9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción',
    10770: 'Película de TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Western'
};

export default CineReelsPage;
