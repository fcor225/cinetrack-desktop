import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { traktService } from '../services/traktService';
import './CommunityReviews.css';

const CommunityReviews = ({ tmdbId, userMovieState }) => {
    const isOnline = useOnlineStatus();
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tarea 3: Lógica Inteligente de Spoilers
    // Si el usuario ya vio o marcó la película como Favorita, revelamos los spoilers automáticamente.
    const autoRevealSpoilers = userMovieState === 'VISTA' || userMovieState === 'FAVORITA';

    // Estado para llevar el control de qué spoilers se han revelado
    const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

    useEffect(() => {
        if (!isOnline || !tmdbId) return;

        const fetchComments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await traktService.getMovieCommentsByTmdbId(tmdbId);
                const topComments = data.slice(0, 10);
                setComments(topComments);

                // Tarea 3: Si el usuario ya vio la película, pre-revelar todos los spoilers
                if (autoRevealSpoilers) {
                    const spoilerIds = new Set(
                        topComments.filter(c => c.spoiler).map(c => c.id)
                    );
                    setRevealedSpoilers(spoilerIds);
                }
            } catch (err) {
                console.error("Error al cargar comentarios de Trakt", err);
                setError("No se pudieron cargar los comentarios de la comunidad.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchComments();
    }, [tmdbId, isOnline, autoRevealSpoilers]);

    const toggleSpoiler = (commentId) => {
        setRevealedSpoilers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // 1. Verificación Offline (Resiliencia)
    if (!isOnline) {
        return (
            <div className="trakt-offline-message">
                <span className="offline-icon">📡</span>
                <p>Conéctate a internet para ver las reseñas de la comunidad de Trakt.tv.</p>
            </div>
        );
    }

    // 2. Estados asíncronos
    if (isLoading) {
        return <div className="trakt-loading">Cargando comentarios de Trakt.tv...</div>;
    }

    if (error) {
        return <div className="trakt-error">{error}</div>;
    }

    if (comments.length === 0) {
        return <div className="trakt-empty">No hay comentarios en Trakt.tv para esta película aún.</div>;
    }

    return (
        <div className="community-reviews-container">
            <h2 className="trakt-section-title">Comunidad (Trakt.tv)</h2>
            <div className="trakt-comments-list">
                {comments.map((traktComment) => {
                    const isSpoiler = traktComment.spoiler;
                    const isRevealed = revealedSpoilers.has(traktComment.id);
                    const user = traktComment.user || { username: 'Anónimo' };

                    return (
                        <article key={traktComment.id} className="trakt-comment-card">
                            <div className="trakt-comment-header">
                                <div className="trakt-avatar">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="trakt-user-info">
                                    <strong>{user.username}</strong>
                                    {user.vip && <span className="trakt-vip-badge">VIP</span>}
                                </div>
                                <div className="trakt-likes">
                                    ❤️ {traktComment.likes || 0}
                                </div>
                            </div>
                            
                            <div className="trakt-comment-content">
                                {isSpoiler && !isRevealed ? (
                                    <div className="trakt-spoiler-warning">
                                        <span className="spoiler-icon">⚠️</span>
                                        <p>Este comentario contiene spoilers.</p>
                                        <button 
                                            className="btn-reveal-spoiler" 
                                            onClick={() => toggleSpoiler(traktComment.id)}
                                        >
                                            Ver Spoiler
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p>{traktComment.comment}</p>
                                        {isSpoiler && (
                                            <button 
                                                className="btn-hide-spoiler" 
                                                onClick={() => toggleSpoiler(traktComment.id)}
                                            >
                                                Ocultar Spoiler
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default CommunityReviews;
