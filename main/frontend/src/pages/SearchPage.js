import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import MovieGrid from '../components/common/MovieGrid';
import Spinner from '../components/common/Spinner';
import { toast } from '../components/common/Toast';
import './SearchPage.css';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        if (query.length >= 2) { setPage(1); doSearch(query, 1); }
    }, [query]);

    const doSearch = async (q, p) => {
        setLoading(true);
        try {
            const res = await tmdbService.search(q, p);
            setResults(res.data || []);
            setTotalPages(res.pagination?.totalPages || 0);
        } catch { toast.error('Error en la búsqueda'); }
        finally { setLoading(false); }
    };

    const handleSave = async (movie) => {
        try {
            await movieService.guardar({ tmdb_id: movie.id, titulo: movie.title, titulo_original: movie.original_title, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, sinopsis: movie.overview, anio: parseInt(movie.release_date?.substring(0,4)) || null, valoracion_tmdb: movie.vote_average, fecha_estreno: movie.release_date, generos: movie.genre_ids });
            toast.success(`'${movie.title}' añadida a Pendientes`);
        } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    };

    const handlePage = (newPage) => { setPage(newPage); doSearch(query, newPage); window.scrollTo(0, 0); };

    return (
        <div className="search-page">
            <div className="search-page__inner">
                <h1 className="section-title">Resultados para "{query}"</h1>
                {loading ? <Spinner size="lg" text="Buscando..." /> : (
                    <>
                        <MovieGrid movies={results} onSave={handleSave} />
                        {totalPages > 1 && (
                            <div className="search-page__pagination">
                                <button className="btn btn--secondary" disabled={page <= 1} onClick={() => handlePage(page - 1)}>← Anterior</button>
                                <span className="search-page__page-info">Página {page} de {totalPages}</span>
                                <button className="btn btn--secondary" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>Siguiente →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
export default SearchPage;
