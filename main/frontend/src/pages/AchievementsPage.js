import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import Spinner from '../components/common/Spinner';
import './AchievementsPage.css';

/**
 * @component AchievementsPage
 * @description Vista de Logros y Sistema de Rangos "Overwatch Style".
 * Muestra: rango actual con su color competitivo, barra de progreso animada,
 * XP total y lista de desafíos con progreso individual.
 */
const AchievementsPage = () => {
    const [xpData, setXpData] = useState(null);
    const [dynamicAchievements, setDynamicAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [data, dyn] = await Promise.all([
                    authService.getXpProfile(),
                    authService.getDynamicAchievements()
                ]);
                setXpData(data);
                setDynamicAchievements(dyn);
            } catch (err) {
                console.error('Error cargando XP o Logros:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="container"><Spinner text="Cargando logros..." /></div>;
    if (!xpData) return <div className="container"><p>No se pudieron cargar los logros.</p></div>;

    const { xp, rango, progreso, desafios } = xpData;

    return (
        <div className="container achievements-page">
            <h1 className="achievements-page__title">🏅 Logros y Rangos</h1>

            {/* ── Tarjeta de Rango ── */}
            <div
                className="rank-card"
                style={{ background: rango.gradient }}
            >
                <div className="rank-card__icon">{rango.icon}</div>
                <div className="rank-card__info">
                    <span className="rank-card__name" style={{ color: rango.color }}>
                        {rango.nombre}
                    </span>
                    <span className="rank-card__xp">{xp.toLocaleString()} XP</span>
                </div>
                {progreso.xpForNext && (
                    <div className="rank-card__next">
                        <span>{progreso.xpForNext.toLocaleString()} XP para el siguiente rango</span>
                    </div>
                )}
            </div>

            {/* ── Barra de Progreso Animada ── */}
            <div className="rank-progress">
                <div className="rank-progress__labels">
                    <span>Progreso en {rango.nombre}</span>
                    <span className="rank-progress__percent">{progreso.percent}%</span>
                </div>
                <div className="rank-progress__bar-bg">
                    <div
                        className="rank-progress__bar-fill"
                        style={{
                            width: `${progreso.percent}%`,
                            background: rango.gradient
                        }}
                    />
                </div>
            </div>

            {/* ── XP por acción ── */}
            <div className="xp-rewards-grid">
                <div className="xp-reward-item">
                    <span className="xp-reward-icon">🎬</span>
                    <span className="xp-reward-action">Añadir película</span>
                    <span className="xp-reward-value">+10 XP</span>
                </div>
                <div className="xp-reward-item">
                    <span className="xp-reward-icon">👁️</span>
                    <span className="xp-reward-action">Marcar como Vista</span>
                    <span className="xp-reward-value">+50 XP</span>
                </div>
                <div className="xp-reward-item">
                    <span className="xp-reward-icon">⭐</span>
                    <span className="xp-reward-action">Marcar Favorita</span>
                    <span className="xp-reward-value">+25 XP</span>
                </div>
                <div className="xp-reward-item">
                    <span className="xp-reward-icon">✍️</span>
                    <span className="xp-reward-action">Escribir reseña</span>
                    <span className="xp-reward-value">+100 XP</span>
                </div>
            </div>

            {/* ── Desafíos ── */}
            <section className="challenges-section">
                <h2>🎯 Desafíos</h2>
                <div className="challenges-list">
                    {desafios.map(d => {
                        const pct = Math.min(100, Math.round((d.progreso / d.meta) * 100));
                        return (
                            <div
                                key={d.id}
                                className={`challenge-card ${d.completado ? 'challenge-card--done' : ''}`}
                            >
                                <div className="challenge-card__header">
                                    <span className="challenge-card__icon">{d.icono}</span>
                                    <div className="challenge-card__info">
                                        <strong className="challenge-card__name">{d.nombre}</strong>
                                        <span className="challenge-card__desc">{d.desc}</span>
                                    </div>
                                    <div className="challenge-card__reward">
                                        {d.completado
                                            ? <span className="challenge-done-badge">✅ Completado</span>
                                            : <span className="xp-pill">+{d.xpRecompensa} XP</span>
                                        }
                                    </div>
                                </div>
                                <div className="challenge-card__progress-bar-bg">
                                    <div
                                        className="challenge-card__progress-bar-fill"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="challenge-card__progress-text">
                                    {d.progreso} / {d.meta}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Misiones Dinámicas ── */}
            {dynamicAchievements.length > 0 && (
                <section className="challenges-section" style={{ marginTop: 'var(--space-3xl)' }}>
                    <h2>🔮 Misiones de Perfil</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                        Generadas automáticamente según tus hábitos de visionado.
                    </p>
                    <div className="challenges-list">
                        {dynamicAchievements.map(d => {
                            const pct = Math.min(100, Math.round((d.progress / d.target) * 100));
                            return (
                                <div
                                    key={d.id}
                                    className={`challenge-card ${d.completed ? 'challenge-card--done' : ''}`}
                                >
                                    <div className="challenge-card__header">
                                        <span className="challenge-card__icon">{d.icon}</span>
                                        <div className="challenge-card__info">
                                            <strong className="challenge-card__name">{d.title}</strong>
                                            <span className="challenge-card__desc">{d.description}</span>
                                        </div>
                                        <div className="challenge-card__reward">
                                            {d.completed
                                                ? <span className="challenge-done-badge">✅ Completado</span>
                                                : <span className="xp-pill">En progreso</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="challenge-card__progress-bar-bg">
                                        <div
                                            className="challenge-card__progress-bar-fill"
                                            style={{ width: `${pct}%`, background: d.completed ? 'var(--success-color)' : 'linear-gradient(90deg, #a855f7, #6366f1)' }}
                                        />
                                    </div>
                                    <div className="challenge-card__progress-text">
                                        {d.progress} / {d.target}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default AchievementsPage;
