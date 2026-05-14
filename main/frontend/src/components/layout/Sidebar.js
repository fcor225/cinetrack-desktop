import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Sidebar.css';

const NAV_ITEMS = [
    { to: '/',          icon: '🏠', label: 'Inicio',       end: true },
    { to: '/buscar',    icon: '🔍', label: 'Buscar'                   },
    { to: '/coleccion', icon: '🎬', label: 'Mi Colección', auth: true },
    { to: '/listas',    icon: '📋', label: 'Mis Listas',   auth: true },
    { to: '/resenas',   icon: '✍️', label: 'Reseñas',      auth: true },
    { to: '/logros',    icon: '🏅', label: 'Logros',       auth: true },
    { to: '/cineswipe', icon: '🃏', label: 'CineSwipe',    auth: true, highlight: true },
    { to: '/cinereels', icon: '🎥', label: 'CineReels',    auth: true, highlight: true },
];

/**
 * @component Sidebar
 * @description Menú lateral colapsable. Siempre visible:
 *  - Usuario autenticado: muestra todos los enlaces + perfil + logout
 *  - Usuario no autenticado: muestra Inicio, Buscar + botones Login/Register
 */
const Sidebar = ({ expanded, onToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim().length >= 2) {
            navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            if (window.innerWidth < 768) onToggle();
        }
    };

    const visibleItems = NAV_ITEMS.filter(item => !item.auth || !!user);

    return (
        <>
            {/* Backdrop mobile */}
            {expanded && (
                <div className="sidebar-backdrop" onClick={onToggle} aria-hidden="true" />
            )}

            <aside className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`} aria-label="Navegación principal">
                <button
                    className="sidebar__floating-toggle"
                    onClick={onToggle}
                    aria-label={expanded ? 'Cerrar menú' : 'Abrir menú'}
                >
                    <div className={`sidebar__hamburger ${expanded ? 'sidebar__hamburger--open' : ''}`}>
                        <span /><span /><span />
                    </div>
                </button>
                {/* Header eliminado — ahora el toggle está en el lateral */}

                {/* ── Buscador (expandido) ── */}
                {expanded && (
                    <div className="sidebar__search-wrap">
                        <form className="sidebar__search" onSubmit={handleSearch}>
                            <span className="sidebar__search-icon">🔍</span>
                            <input
                                className="sidebar__search-input"
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoComplete="off"
                            />
                        </form>
                    </div>
                )}

                {/* ── Navegación ── */}
                <nav className="sidebar__nav">
                    {visibleItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''} ${item.highlight ? 'sidebar__link--highlight' : ''}`
                            }
                            title={!expanded ? item.label : undefined}
                            onClick={() => window.innerWidth < 768 && onToggle()}
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            {expanded && <span className="sidebar__link-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* ── Footer ── */}
                <div className="sidebar__footer">
                    {user ? (
                        /* Usuario autenticado: perfil + logout */
                        <>
                            <NavLink
                                to="/perfil"
                                className={({ isActive }) =>
                                    `sidebar__user ${isActive ? 'sidebar__link--active' : ''}`
                                }
                                title={!expanded ? (user.nombre || user.username) : undefined}
                                onClick={() => window.innerWidth < 768 && onToggle()}
                            >
                                <div className="sidebar__avatar">
                                    {(user.nombre || user.username || '?').charAt(0).toUpperCase()}
                                </div>
                                {expanded && (
                                    <div className="sidebar__user-info">
                                        <span className="sidebar__user-name">{user.nombre || user.username}</span>
                                        <span className="sidebar__user-role">Mi Perfil</span>
                                    </div>
                                )}
                            </NavLink>
                            <button
                                className="sidebar__logout"
                                onClick={logout}
                                title="Cerrar sesión"
                            >
                                <span className="sidebar__link-icon">🚪</span>
                                {expanded && <span className="sidebar__link-label">Salir</span>}
                            </button>
                        </>
                    ) : (
                        /* Usuario NO autenticado: login + registro */
                        <>
                            <Link
                                to="/login"
                                className="sidebar__link sidebar__link--auth"
                                title={!expanded ? 'Iniciar sesión' : undefined}
                                onClick={() => window.innerWidth < 768 && onToggle()}
                            >
                                <span className="sidebar__link-icon">🔑</span>
                                {expanded && <span className="sidebar__link-label">Iniciar Sesión</span>}
                            </Link>
                            <Link
                                to="/register"
                                className="sidebar__link sidebar__link--register"
                                title={!expanded ? 'Registrarse' : undefined}
                                onClick={() => window.innerWidth < 768 && onToggle()}
                            >
                                <span className="sidebar__link-icon">✨</span>
                                {expanded && <span className="sidebar__link-label">Registrarse</span>}
                            </Link>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
