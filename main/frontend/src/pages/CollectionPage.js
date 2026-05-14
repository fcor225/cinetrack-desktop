import React, { useState, useEffect, useCallback, useRef } from 'react';
import movieService from '../services/movieService';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import MovieGrid from '../components/common/MovieGrid';
import Spinner from '../components/common/Spinner';
import './CollectionPage.css';

const TABS = [
    { key: '', label: 'Todas', icon: '🎬' },
    { key: 'PENDIENTE', label: 'Pendientes', icon: '📋' },
    { key: 'VISTA', label: 'Vistas', icon: '👁️' },
    { key: 'FAVORITA', label: 'Favoritas', icon: '⭐' },
    { key: 'ARCHIVADA', label: 'Archivadas', icon: '📦' },
];

const SORT_OPTIONS = [
    { value: 'reciente', label: '🕒 Más recientes' },
    { value: 'titulo_asc', label: '🔤 Título A-Z' },
    { value: 'titulo_desc', label: '🔤 Título Z-A' },
    { value: 'nota_desc', label: '⭐ Mayor nota' },
    { value: 'nota_asc', label: '⭐ Menor nota' },
];

const PAGE_SIZE = 20;

/**
 * Aplica ordenación y filtro de género en el cliente
 * (los géneros están en el campo JSON de la película, el backend no filtra por ellos).
 * @param {Array} movies
 * @param {string} sortBy
 * @param {string} genreFilter
 */
const applyClientFilters = (movies, sortBy, genreFilter) => {
    let result = [...movies];

    if (genreFilter) {
        result = result.filter(m =>
            Array.isArray(m.generos) && m.generos.includes(genreFilter)
        );
    }

    switch (sortBy) {
        case 'titulo_asc': result.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')); break;
        case 'titulo_desc': result.sort((a, b) => b.titulo.localeCompare(a.titulo, 'es')); break;
        case 'nota_desc': result.sort((a, b) => (b.valoracion_tmdb || 0) - (a.valoracion_tmdb || 0)); break;
        case 'nota_asc': result.sort((a, b) => (a.valoracion_tmdb || 0) - (b.valoracion_tmdb || 0)); break;
        default: break; // reciente: orden del servidor (id DESC)
    }

    return result;
};

/**
 * Extrae lista única de géneros de un array de películas.
 * @param {Array} movies
 * @returns {string[]}
 */
const extractGenres = (movies) => {
    const genreSet = new Set();
    movies.forEach(m => {
        if (Array.isArray(m.generos)) m.generos.forEach(g => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
};

/**
 * @component CollectionPage
 * Colección del usuario con:
 *  - Filtros por estado (tabs)
 *  - Buscador (Ctrl+F para foco, Esc para limpiar)
 *  - Panel de filtros: género y ordenación
 *  - Infinite Scroll (IntersectionObserver)
 */
const CollectionPage = () => {
    const [tab, setTab] = useState('');
    const [allMovies, setAllMovies] = useState([]);   // todas las películas cargadas
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Filtros avanzados
    const [sortBy, setSortBy] = useState('reciente');
    const [genreFilter, setGenreFilter] = useState('');
    const [availableGenres, setAvailableGenres] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Paginación
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const searchRef = useRef(null);

    const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.1, rootMargin: '100px'
    });

    // ── Atajos de teclado ───────────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            // Ctrl+F → foco al buscador
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchRef.current?.focus();
            }
            // Esc → limpiar búsqueda o cerrar panel de filtros
            if (e.key === 'Escape') {
                if (showFilters) {
                    setShowFilters(false);
                } else if (search) {
                    setSearch('');
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [search, showFilters]);

    // ── Carga primera página ────────────────────────────────────────────────
    const loadFirstPage = useCallback(async () => {
        setLoading(true);
        setPage(1);
        setHasMore(true);
        setAllMovies([]);

        try {
            const params = { page: 1, limit: PAGE_SIZE };
            if (tab) params.estado = tab;
            if (search.trim()) params.search = search.trim();

            const res = await movieService.getMias(params);
            const data = res.data || [];
            const pagination = res.pagination || {};

            setAllMovies(data);
            setAvailableGenres(extractGenres(data));
            setHasMore(pagination.totalPages > 1);
        } catch { }
        finally { setLoading(false); }
    }, [tab, search]);

    // ── Carga páginas adicionales ───────────────────────────────────────────
    const loadNextPage = useCallback(async (nextPage) => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const params = { page: nextPage, limit: PAGE_SIZE };
            if (tab) params.estado = tab;
            if (search.trim()) params.search = search.trim();

            const res = await movieService.getMias(params);
            const newMovies = res.data || [];
            const pagination = res.pagination || {};

            setAllMovies(prev => {
                const combined = [...prev, ...newMovies];
                setAvailableGenres(extractGenres(combined));
                return combined;
            });
            setHasMore(nextPage < (pagination.totalPages || 1));
        } catch { }
        finally { setIsLoadingMore(false); }
    }, [tab, search, isLoadingMore, hasMore]);

    // ── Efectos ─────────────────────────────────────────────────────────────
    useEffect(() => { loadFirstPage(); }, [tab]); // eslint-disable-line

    useEffect(() => {
        const loadStats = async () => {
            try { const res = await movieService.getStats(); setStats(res.data || {}); } catch { }
        };
        loadStats();
    }, []);

    useEffect(() => {
        if (isIntersecting && hasMore && !isLoadingMore && !loading) {
            const next = page + 1;
            setPage(next);
            loadNextPage(next);
        }
    }, [isIntersecting]); // eslint-disable-line

    // ── Filtros aplicados al cliente ────────────────────────────────────────
    const displayedMovies = applyClientFilters(allMovies, sortBy, genreFilter);

    const handleTabChange = (key) => { setSearch(''); setGenreFilter(''); setTab(key); };
    const handleSearch = (e) => { e.preventDefault(); loadFirstPage(); };

    return (
        <div className="container collection-page">
            {/* ── Cabecera ── */}
            <div className="collection-page__header">
                <h1 className="collection-page__title">Mi Colección</h1>
                <div className="collection-page__stats">
                    <span>{stats.total || 0} películas</span>
                    <span>·</span>
                    <span>{stats.vistas || 0} vistas</span>
                    <span>·</span>
                    <span>{stats.resenas || 0} reseñas</span>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="collection-page__tabs">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`collection-page__tab ${tab === t.key ? 'collection-page__tab--active' : ''}`}
                        onClick={() => handleTabChange(t.key)}
                    >
                        <span>{t.icon}</span> {t.label}
                        {t.key === 'PENDIENTE' && stats.pendientes ? <span className="collection-page__tab-count">{stats.pendientes}</span> : null}
                        {t.key === 'VISTA' && stats.vistas ? <span className="collection-page__tab-count">{stats.vistas}</span> : null}
                        {t.key === 'FAVORITA' && stats.favoritas ? <span className="collection-page__tab-count">{stats.favoritas}</span> : null}
                    </button>
                ))}
            </div>

            {/* ── Buscador + Toggle Filtros ── */}
            <div className="collection-page__controls">
                <form className="collection-page__search" onSubmit={handleSearch}>
                    <input
                        ref={searchRef}
                        className="input-field"
                        type="text"
                        placeholder="Buscar... (Ctrl+F)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            type="button"
                            className="collection-page__clear-btn"
                            onClick={() => setSearch('')}
                            title="Limpiar (Esc)"
                        >✕</button>
                    )}
                </form>
                <button
                    className={`btn btn--ghost collection-page__filter-toggle ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(v => !v)}
                    title="Filtros avanzados"
                >
                    ⚙️ Filtros {showFilters ? '▲' : '▼'}
                </button>
            </div>

            {/* ── Panel de Filtros Avanzados ── */}
            {showFilters && (
                <div className="collection-page__filter-panel">
                    {/* Ordenación */}
                    <div className="filter-group">
                        <label className="filter-label">Ordenar por</label>
                        <div className="filter-options">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`filter-chip ${sortBy === opt.value ? 'filter-chip--active' : ''}`}
                                    onClick={() => setSortBy(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Géneros */}
                    {availableGenres.length > 0 && (
                        <div className="filter-group">
                            <label className="filter-label">Filtrar por Género</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-chip ${genreFilter === '' ? 'filter-chip--active' : ''}`}
                                    onClick={() => setGenreFilter('')}
                                >
                                    Todos
                                </button>
                                {availableGenres.map(g => (
                                    <button
                                        key={g}
                                        className={`filter-chip ${genreFilter === g ? 'filter-chip--active' : ''}`}
                                        onClick={() => setGenreFilter(g === genreFilter ? '' : g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Conteo de resultados filtrados ── */}
            {(genreFilter || sortBy !== 'reciente') && !loading && (
                <p className="collection-page__filter-result">
                    Mostrando {displayedMovies.length} de {allMovies.length} películas cargadas
                    {genreFilter && ` · Género: ${genreFilter}`}
                </p>
            )}

            {/* ── Grid de películas ── */}
            {loading
                ? <Spinner text="Cargando colección..." />
                : <MovieGrid movies={displayedMovies} showState={!tab} />
            }

            {isLoadingMore && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spinner text="Cargando más..." />
                </div>
            )}

            {/* Sentinel para Infinite Scroll */}
            {!loading && hasMore && (
                <div ref={sentinelRef} aria-hidden="true" style={{ height: '1px', marginBottom: '20px' }} />
            )}

            {!loading && !hasMore && allMovies.length > 0 && (
                <p className="collection-page__end-msg">Has llegado al final de tu colección 🎬</p>
            )}
        </div>
    );
};

export default CollectionPage;
