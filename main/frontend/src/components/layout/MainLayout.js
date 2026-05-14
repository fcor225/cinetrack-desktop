import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import Footer from '../common/Footer';
import ChatWidget from '../common/ChatWidget';
import './MainLayout.css';

const FULLSCREEN_ROUTES = ['/cineswipe', '/cinereels'];

/**
 * @component MainLayout
 * @description Shell principal con sidebar lateral siempre visible.
 * El sidebar muestra links de auth (login/register) para invitados
 * y la navegación completa para usuarios autenticados.
 */
const MainLayout = () => {
    const location = useLocation();
    const [expanded, setExpanded] = useState(false);
    const isFullscreen = FULLSCREEN_ROUTES.some(r => location.pathname.startsWith(r));

    // Cerrar sidebar al navegar en mobile
    useEffect(() => {
        if (window.innerWidth < 768) setExpanded(false);
    }, [location.pathname]);

    // Bloquear scroll del body en mobile cuando sidebar abierto
    useEffect(() => {
        if (window.innerWidth < 768) {
            document.body.style.overflow = expanded ? 'hidden' : '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [expanded]);

    return (
        <div className={`app-layout ${expanded ? 'app-layout--expanded' : ''}`}>
            {/* Barra superior con Logo y Toggle */}
            <TopNavbar onToggle={() => setExpanded(p => !p)} expanded={expanded} />

            {/* Sidebar — Empieza debajo del Navbar (ajustado por CSS) */}
            <Sidebar expanded={expanded} onToggle={() => setExpanded(p => !p)} />

            {/* Contenido principal */}
            <main className={`page-wrapper ${isFullscreen ? 'page-wrapper--fullscreen' : ''}`}>
                <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Outlet />
                </div>
                {!isFullscreen && <Footer />}
            </main>

            {/* IA Bot global */}
            <ChatWidget />
        </div>
    );
};

export default MainLayout;
