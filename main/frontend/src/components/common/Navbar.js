import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import SearchBar from '../common/SearchBar';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar" id="main-navbar">
            <div className="navbar__inner container">
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-icon">🎬</span>
                    <span className="navbar__logo-text">CineTrack</span>
                </Link>

                <SearchBar />

                <div className="navbar__links">
                    {user ? (
                        <>
                            <NavLink to="/" className="navbar__link" end>Inicio</NavLink>
                            <NavLink to="/coleccion" className="navbar__link">Mi Colección</NavLink>
                            <NavLink to="/listas" className="navbar__link">Listas</NavLink>
                            <NavLink to="/resenas" className="navbar__link">Reseñas</NavLink>
                            <NavLink to="/logros" className="navbar__link">🏅 Logros</NavLink>
                            <NavLink to="/cineswipe" className="navbar__link navbar__link--highlight">🃏 CineSwipe</NavLink>
                            <NavLink to="/cinereels" className="navbar__link navbar__link--highlight">🎥 CineReels</NavLink>
                            <div className="navbar__user" onClick={() => setMenuOpen(!menuOpen)}>
                                <div className="navbar__avatar">{user.nombre?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}</div>
                                {menuOpen && (
                                    <div className="navbar__dropdown">
                                        <Link to="/perfil" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>👤 Mi Perfil</Link>
                                        <Link to="/logros" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>🏅 Logros</Link>
                                        <Link to="/cineswipe" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>🃏 CineSwipe</Link>
                                        <Link to="/cinereels" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>🎥 CineReels</Link>
                                        <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={() => { setMenuOpen(false); logout(); }}>🚪 Cerrar Sesión</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn--ghost">Iniciar Sesión</Link>
                            <Link to="/register" className="btn btn--primary btn--sm">Registrarse</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
export default Navbar;
