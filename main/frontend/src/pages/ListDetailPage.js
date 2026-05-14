import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import listService from '../services/listService';
import MovieGrid from '../components/common/MovieGrid';
import Spinner from '../components/common/Spinner';
import { toast } from '../components/common/Toast';
import './ListDetailPage.css';

/**
 * @component ListDetailPage
 * @description Muestra el contenido detallado de una lista personalizada.
 */
const ListDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lista, setLista] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const r = await listService.getOne(id);
                setLista(r.data);
            } catch (err) {
                toast.error('Error al cargar la lista');
                navigate('/listas');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    const handleRemoveMovie = async (peliculaId) => {
        if (!window.confirm('¿Quitar esta película de la lista?')) return;
        try {
            await listService.quitarPelicula(lista.id_lista, peliculaId);
            setLista(prev => ({
                ...prev,
                peliculas: prev.peliculas.filter(p => p.id_local !== peliculaId)
            }));
            toast.success('Película quitada de la lista');
        } catch {
            toast.error('Error al quitar la película');
        }
    };

    if (loading) return <div className="container"><Spinner text="Cargando contenido de la lista..." /></div>;
    if (!lista) return null;

    return (
        <div className="container list-detail-page">
            <div className="list-detail-page__header">
                <div className="list-detail-page__info">
                    <button className="list-detail-page__back-btn" onClick={() => navigate('/listas')}>
                        ← Volver a mis listas
                    </button>
                    <h1>{lista.nombre}</h1>
                    {lista.descripcion && <p className="list-detail-page__desc">{lista.descripcion}</p>}
                    <span className="badge badge--vista">{lista.peliculas?.length || 0} películas</span>
                </div>
            </div>

            <div className="list-detail-page__content">
                {lista.peliculas?.length === 0 ? (
                    <div className="list-detail-page__empty">
                        <p>Esta lista está vacía. Añade películas desde sus fichas de detalle.</p>
                    </div>
                ) : (
                    <MovieGrid 
                        movies={lista.peliculas} 
                        showState={true}
                    />
                )}
            </div>
        </div>
    );
};

export default ListDetailPage;
