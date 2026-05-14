import React, { useState, useEffect } from 'react';
import listService from '../../services/listService';
import { toast } from './Toast';
import './AddToListModal.css';

/**
 * @component AddToListModal
 * @description Modal para añadir una película guardada a una lista personalizada.
 * Se muestra desde DetallePelicula cuando la película ya tiene id_local (está guardada).
 *
 * @param {Object}   props
 * @param {number}   props.peliculaId    - id_local de la película guardada
 * @param {string}   props.peliculaTitulo - Título para mostrar en el modal
 * @param {Function} props.onClose       - Callback para cerrar el modal
 */
const AddToListModal = ({ peliculaId, peliculaTitulo, onClose }) => {
    const [listas, setListas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newListName, setNewListName] = useState('');

    // Cerrar con Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        const load = async () => {
            try {
                const r = await listService.getMias();
                setListas(r.data || []);
            } catch { } finally { setLoading(false); }
        };
        load();
    }, []);

    const handleAdd = async (listaId, listaNombre) => {
        setAdding(listaId);
        try {
            await listService.agregarPelicula(listaId, peliculaId);
            toast.success(`Añadida a "${listaNombre}" ✅`);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al añadir a la lista');
        } finally {
            setAdding(null);
        }
    };

    const handleCreateAndAdd = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        try {
            const r = await listService.crear({ nombre: newListName.trim() });
            const nuevaLista = r.data;
            toast.success(`Lista "${nuevaLista.nombre}" creada`);
            await handleAdd(nuevaLista.id_lista, nuevaLista.nombre);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al crear la lista');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="add-list-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-list-modal__header">
                    <h3>📋 Añadir a Lista</h3>
                    <button className="add-list-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>
                <p className="add-list-modal__subtitle">
                    Elige una lista para añadir <strong>{peliculaTitulo}</strong>
                </p>

                {loading ? (
                    <p className="add-list-modal__loading">Cargando listas...</p>
                ) : listas.length === 0 ? (
                    <p className="add-list-modal__empty">No tienes listas. Crea una primera.</p>
                ) : (
                    <ul className="add-list-modal__list">
                        {listas.map(lista => (
                            <li key={lista.id_lista}>
                                <button
                                    className="add-list-modal__item"
                                    onClick={() => handleAdd(lista.id_lista, lista.nombre)}
                                    disabled={adding === lista.id_lista}
                                >
                                    <span className="add-list-modal__item-name">📁 {lista.nombre}</span>
                                    <span className="add-list-modal__item-count">
                                        {lista.peliculas?.length || 0} películas
                                    </span>
                                    {adding === lista.id_lista && <span>...</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Crear nueva lista y añadir directamente */}
                {!showCreateForm ? (
                    <button
                        className="btn btn--ghost btn--sm add-list-modal__create-btn"
                        onClick={() => setShowCreateForm(true)}
                    >
                        + Crear nueva lista
                    </button>
                ) : (
                    <form className="add-list-modal__create-form" onSubmit={handleCreateAndAdd}>
                        <input
                            className="input-field"
                            placeholder="Nombre de la nueva lista"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn--primary btn--sm">Crear y Añadir</button>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowCreateForm(false)}>Cancelar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddToListModal;
