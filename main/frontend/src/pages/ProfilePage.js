import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import useAuth from '../hooks/useAuth';
import movieService from '../services/movieService';
import authService from '../services/authService';
import { toast } from '../components/common/Toast';
import CineCalendar from '../components/common/CineCalendar';
import './ProfilePage.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

/**
 * Paleta de colores para el PieChart de géneros.
 * Se asignan en orden cíclico a cada segmento.
 */
const GENRE_COLORS = [
    '#e50914', '#f5c518', '#00d8ff', '#a855f7',
    '#22d3ee', '#f97316', '#84cc16', '#ec4899'
];

/**
 * Formatea una cantidad de minutos en "X días, Y horas, Z min".
 * @param {number} minutos - Total de minutos
 * @returns {string} Texto formateado
 */
const formatearTiempo = (minutos) => {
    if (!minutos || minutos === 0) return '0 min';
    const dias = Math.floor(minutos / (60 * 24));
    const horas = Math.floor((minutos % (60 * 24)) / 60);
    const mins = minutos % 60;
    const partes = [];
    if (dias > 0) partes.push(`${dias}d`);
    if (horas > 0) partes.push(`${horas}h`);
    if (mins > 0) partes.push(`${mins}min`);
    return partes.join(' ');
};

/**
 * @component ProfilePage
 * Página de perfil con:
 *  - Stats resumidas (total, vistas, favoritas, reseñas)
 *  - Tiempo total de visionado formateado
 *  - PieChart de géneros favoritos (Recharts)
 *  - Exportar / Importar backup JSON
 *  - Edición de perfil
 *  - Top 4 Favoritas
 */
const ProfilePage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({});
    const [topFour, setTopFour] = useState([]);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nombre: '', email: '' });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Ref al input file oculto para importación
    const fileInputRef = useRef(null);
    // Ref a la sección Top 4 para captura con html2canvas
    const top4Ref = useRef(null);

    /**
     * Genera y descarga una imagen PNG del Top 4 de favoritas
     * usando html2canvas.
     */
    const handleShareTop4 = async () => {
        if (!top4Ref.current) return;
        try {
            const canvas = await html2canvas(top4Ref.current, {
                backgroundColor: '#141414',
                scale: 2,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `cinetrack_top4_${user?.nombre || 'perfil'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Imagen descargada 📸');
        } catch {
            toast.error('Error al generar la imagen');
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [s, m] = await Promise.all([
                    movieService.getStats(),
                    movieService.getMias({ estado: 'FAVORITA', limit: 4 })
                ]);
                setStats(s.data || {});
                setTopFour(m.data || []);
            } catch { }
        };
        load();
        if (user) setForm({ nombre: user.nombre || user.username || '', email: user.email || '' });
    }, [user]);

    /** Guarda cambios del formulario de perfil */
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await authService.updateProfile(form);
            toast.success('Perfil actualizado');
            setEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al actualizar el perfil');
        }
    };

    // ── Backup: Exportar ────────────────────────────────────────────────────
    /** Fuerza la descarga del JSON de backup generado por el backend. */
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await movieService.exportar();
            toast.success('Backup exportado correctamente 💾');
        } catch (err) {
            toast.error('Error al exportar los datos');
        } finally {
            setIsExporting(false);
        }
    };

    // ── Backup: Importar ────────────────────────────────────────────────────
    /** Abre el selector de archivo nativo del SO. */
    const handleImportClick = () => fileInputRef.current?.click();

    /**
     * Lee el archivo JSON seleccionado, lo parsea y lo envía al backend.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Resetear el input para que se pueda reimportar el mismo archivo
        e.target.value = '';

        setIsImporting(true);
        try {
            const text = await file.text();
            const payload = JSON.parse(text);

            if (!payload.peliculas) {
                return toast.error('Archivo de backup no válido (sin campo "peliculas")');
            }

            const res = await movieService.importar(payload);
            toast.success(res.message || 'Backup importado correctamente ✅');

            // Recargar stats tras la importación
            const s = await movieService.getStats();
            setStats(s.data || {});
        } catch (err) {
            if (err instanceof SyntaxError) {
                toast.error('El archivo no es un JSON válido');
            } else {
                toast.error(err.response?.data?.message || 'Error al importar los datos');
            }
        } finally {
            setIsImporting(false);
        }
    };

    // Datos para el PieChart de géneros
    const genreData = stats.topGeneros || [];

    return (
        <div className="container profile-page">
            {/* ── Cabecera de perfil ── */}
            <div className="profile-page__header">
                <div className="profile-page__avatar">
                    {user?.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="profile-page__info">
                    <h1>{user?.nombre || user?.username}</h1>
                    {user?.email && <p className="profile-page__email">{user.email}</p>}
                    <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => setEditing(!editing)}
                    >
                        {editing ? 'Cancelar' : '✏️ Editar perfil'}
                    </button>
                </div>
            </div>

            {/* ── Formulario de edición ── */}
            {editing && (
                <form className="profile-page__edit-form" onSubmit={handleSave}>
                    <div className="input-group">
                        <label>Nombre</label>
                        <input
                            className="input-field"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            className="input-field"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn--primary btn--sm">Guardar</button>
                </form>
            )}

            {/* ── Stats numéricas ── */}
            <div className="profile-page__stats-grid">
                <div className="profile-page__stat">
                    <span className="profile-page__stat-value">{stats.total || 0}</span>
                    <span className="profile-page__stat-label">Películas</span>
                </div>
                <div className="profile-page__stat">
                    <span className="profile-page__stat-value">{stats.vistas || 0}</span>
                    <span className="profile-page__stat-label">Vistas</span>
                </div>
                <div className="profile-page__stat">
                    <span className="profile-page__stat-value">{stats.favoritas || 0}</span>
                    <span className="profile-page__stat-label">Favoritas</span>
                </div>
                <div className="profile-page__stat">
                    <span className="profile-page__stat-value">{stats.resenas || 0}</span>
                    <span className="profile-page__stat-label">Reseñas</span>
                </div>
            </div>

            {/* ── Tiempo total de visionado ── */}
            {stats.tiempoTotalMinutos > 0 && (
                <div className="profile-page__watch-time">
                    <span className="watch-time__icon">⏱️</span>
                    <div>
                        <span className="watch-time__value">
                            {formatearTiempo(stats.tiempoTotalMinutos)}
                        </span>
                        <span className="watch-time__label">de películas vistas</span>
                    </div>
                </div>
            )}

            {/* ── PieChart de géneros favoritos (Recharts) ── */}
            {genreData.length > 0 && (
                <section className="profile-page__genres">
                    <h2>🎭 Géneros Favoritos</h2>
                    <div className="genres-chart-wrapper">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={genreData}
                                    dataKey="valor"
                                    nameKey="nombre"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={110}
                                    innerRadius={55}
                                    paddingAngle={3}
                                    label={({ nombre, percent }) =>
                                        `${nombre} ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {genreData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [`${value} películas`, name]}
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Legend
                                    formatter={(value) => (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* ── Cine-Calendario (Heatmap) ── */}
            <CineCalendar />

            {/* ── Backup: Exportar / Importar ── */}
            <section className="profile-page__backup">
                <h2>💾 Copia de Seguridad</h2>
                <p className="profile-page__backup-desc">
                    Exporta toda tu colección de películas y reseñas, o restaura una copia anterior.
                </p>
                <div className="profile-page__backup-actions">
                    <button
                        className="btn btn--primary"
                        onClick={handleExport}
                        disabled={isExporting}
                        id="btn-export-backup"
                    >
                        {isExporting ? 'Exportando...' : '⬇️ Exportar Datos'}
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={handleImportClick}
                        disabled={isImporting}
                        id="btn-import-backup"
                    >
                        {isImporting ? 'Importando...' : '⬆️ Importar Datos'}
                    </button>
                    {/* Input file oculto — se activa al pulsar el botón "Importar" */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        aria-hidden="true"
                    />
                </div>
            </section>

            {/* ── Top 4 Favoritas ── */}
            {topFour.length > 0 && (
                <div className="profile-page__top4" ref={top4Ref}>
                    <div className="profile-page__top4-header">
                        <h2>⭐ Top 4 Favoritas</h2>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleShareTop4}
                            title="Descargar como imagen"
                        >
                            📸 Compartir Top 4
                        </button>
                    </div>
                    <div className="profile-page__top4-grid">
                        {topFour.map(m => (
                            <div key={m.id_local} className="profile-page__top4-item">
                                {m.poster_path
                                    ? <img src={`${TMDB_IMG}${m.poster_path}`} alt={m.titulo} crossOrigin="anonymous" />
                                    : <div className="profile-page__top4-placeholder">🎬</div>
                                }
                                <span>{m.titulo}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
