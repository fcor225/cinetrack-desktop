import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { toast } from '../components/common/Toast';
import './LoginPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        setLoading(true);
        try {
            const res = await authService.register({ nombre: form.nombre, email: form.email || undefined, password: form.password });
            if (res.success) { toast.success('¡Cuenta creada! Inicia sesión.'); navigate('/login'); }
        } catch (err) { setError(err.response?.data?.message || 'Error al registrarse'); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__backdrop"></div>
            <div className="auth-page__card animate-slideUp">
                <div className="auth-page__header">
                    <h1 className="auth-page__logo">🎬 CineTrack</h1>
                    <p className="auth-page__subtitle">Crea tu cuenta</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-page__form">
                    {error && <div className="auth-page__error">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="reg-nombre">Nombre de usuario *</label>
                        <input id="reg-nombre" className="input-field" type="text" placeholder="Elige un nombre" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="reg-email">Email (opcional)</label>
                        <input id="reg-email" className="input-field" type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="reg-password">Contraseña *</label>
                        <input id="reg-password" className="input-field" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="reg-confirm">Confirmar contraseña *</label>
                        <input id="reg-confirm" className="input-field" type="password" placeholder="Repite tu contraseña" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</button>
                </form>
                <p className="auth-page__footer-text">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
            </div>
        </div>
    );
};
export default RegisterPage;
