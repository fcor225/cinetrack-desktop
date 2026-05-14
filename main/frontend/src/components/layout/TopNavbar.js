import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './TopNavbar.css';

/**
 * @component TopNavbar
 * @description Barra superior horizontal con el logo de la marca.
 */
const TopNavbar = () => {
    return (
        <header className="top-navbar">
            <Link to="/" className="top-navbar__logo-link">
                <img src={logoImg} alt="CineTrack Logo" className="top-navbar__logo-img" />
                <span className="top-navbar__brand">CineTrack</span>
            </Link>
            
            <div className="top-navbar__spacer"></div>
            
            <div className="top-navbar__actions">
                {/* Aquí se podrían añadir notificaciones o perfil rápido en el futuro */}
            </div>
        </header>
    );
};

export default TopNavbar;
