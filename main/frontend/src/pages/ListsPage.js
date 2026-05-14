import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import listService from '../services/listService';
import Spinner from '../components/common/Spinner';
import { toast } from '../components/common/Toast';
import './ListsPage.css';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

const ListsPage = () => {
    const navigate = useNavigate();
    const [listas, setListas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nombre: '', descripcion: '' });

    useEffect(() => { loadListas(); }, []);
    const loadListas = async () => { try { const r = await listService.getMias(); setListas(r.data || []); } catch {} finally { setLoading(false); } };

    const handleCreate = async (e) => {
        e.preventDefault();
        try { await listService.crear(form); toast.success('Lista creada'); setForm({ nombre: '', descripcion: '' }); setShowForm(false); loadListas(); }
        catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta lista?')) return;
        try { await listService.eliminar(id); toast.success('Lista eliminada'); loadListas(); } catch { toast.error('Error'); }
    };

    if (loading) return <div className="container"><Spinner text="Cargando listas..." /></div>;

    return (
        <div className="container lists-page">
            <div className="lists-page__header">
                <h1>Mis Listas</h1>
                <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>+ Nueva Lista</button>
            </div>
            {showForm && (
                <form className="lists-page__form" onSubmit={handleCreate}>
                    <input className="input-field" placeholder="Nombre de la lista" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                    <input className="input-field" placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} />
                    <div className="lists-page__form-actions"><button type="submit" className="btn btn--primary btn--sm">Crear</button><button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}>Cancelar</button></div>
                </form>
            )}
            {listas.length === 0 ? (
                <div className="lists-page__empty"><p>No tienes listas aún. ¡Crea una!</p></div>
            ) : (
                <div className="lists-page__grid">
                    {listas.map(lista => (
                        <div 
                            key={lista.id_lista} 
                            className="lists-page__card"
                            onClick={() => navigate(`/listas/${lista.id_lista}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="lists-page__card-posters">
                                {lista.peliculas?.slice(0, 4).map(p => p.poster_path ? <img key={p.id_local} src={`${TMDB_IMG}${p.poster_path}`} alt="" /> : <div key={p.id_local} className="lists-page__card-placeholder">🎬</div>)}
                                {(!lista.peliculas || lista.peliculas.length === 0) && <div className="lists-page__card-empty-posters">Sin películas</div>}
                            </div>
                            <div className="lists-page__card-info">
                                <h3>{lista.nombre}</h3>
                                <p>{lista.peliculas?.length || 0} películas</p>
                                {lista.descripcion && <p className="lists-page__card-desc">{lista.descripcion}</p>}
                            </div>
                            <button 
                                className="btn btn--ghost btn--sm lists-page__delete-btn" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(lista.id_lista);
                                }}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default ListsPage;
