import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import { toast } from '../components/common/Toast';
import './LoginPage.css';

const LoginPage = () => {
    const { login } = useAuth();
    const [form, setForm] = useState({ nombre: '', password: '', forceLogout: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.login(form);
            if (res.success) { login(res.data); toast.success('¡Bienvenido de vuelta!'); }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al iniciar sesión';
            const code = err.response?.data?.code;
            if (code === 'ACTIVE_SESSION') {
                setError('Ya hay una sesión activa. ¿Cerrarla?');
                setForm(prev => ({ ...prev, forceLogout: true }));
            } else { setError(msg); }
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__backdrop"></div>
            <div className="auth-page__card animate-slideUp">
                <div className="auth-page__header">
                    <h1 className="auth-page__logo">🎬 CineTrack</h1>
                    <p className="auth-page__subtitle">Inicia sesión en tu cuenta</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-page__form">
                    {error && <div className="auth-page__error">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="login-nombre">Nombre de usuario</label>
                        <input id="login-nombre" className="input-field" type="text" placeholder="Tu nombre de usuario" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="login-password">Contraseña</label>
                        <input id="login-password" className="input-field" type="password" placeholder="Tu contraseña" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
                        {loading ? 'Entrando...' : form.forceLogout ? 'Cerrar otra sesión e iniciar' : 'Iniciar Sesión'}
                    </button>
                </form>
                <p className="auth-page__footer-text">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
            </div>
        </div>
    );
};
export default LoginPage;
