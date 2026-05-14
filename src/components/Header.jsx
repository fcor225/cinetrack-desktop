import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <Link to="/" className="logo-title">
          CineTrack <span style={{color: 'var(--accent-green)'}}>●</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Buscar</Link>
          <Link to="/coleccion">Mi Colección</Link>
        </nav>
      </div>
    </header>
  );
}