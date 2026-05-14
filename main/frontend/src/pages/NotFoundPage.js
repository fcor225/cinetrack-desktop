import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '6rem', marginBottom: '1rem' }}>🎬</span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>404</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>Esta escena no existe en nuestro guión</p>
        <Link to="/" className="btn btn--primary btn--lg">Volver al inicio</Link>
    </div>
);
export default NotFoundPage;
