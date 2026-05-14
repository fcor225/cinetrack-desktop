import React from 'react';
import './Footer.css';

const Footer = () => (
    <footer className="footer">
        <div className="footer__inner container">
            <div className="footer__brand">
                <span className="footer__logo">🎬 CineTrack</span>
                <p className="footer__tagline">Tu colección cinematográfica personal</p>
            </div>
            <div className="footer__links">
                <div className="footer__col">
                    <h4>Explorar</h4>
                    <a href="/">Tendencias</a>
                    <a href="/coleccion">Mi Colección</a>
                    <a href="/listas">Mis Listas</a>
                </div>
                <div className="footer__col">
                    <h4>Recursos</h4>
                    <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
                    <a href="https://developer.themoviedb.org/" target="_blank" rel="noopener noreferrer">API Docs</a>
                </div>
            </div>
            <div className="footer__bottom">
                <p>&copy; {new Date().getFullYear()} CineTrack — Proyecto Integrado. Datos de <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.</p>
            </div>
        </div>
    </footer>
);
export default Footer;
