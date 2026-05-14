import React, { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
let addToastFn = null;

const triggerNativeNotification = (title, message) => {
    if (window.api && window.api.mostrarNotificacion) {
        window.api.mostrarNotificacion(title, message);
    }
};

export const toast = {
    success: (msg) => {
        addToastFn?.({ id: ++toastId, type: 'success', message: msg });
        triggerNativeNotification('CineTrack - Éxito', msg);
    },
    error: (msg) => {
        addToastFn?.({ id: ++toastId, type: 'error', message: msg });
        triggerNativeNotification('CineTrack - Error', msg);
    },
    info: (msg) => {
        addToastFn?.({ id: ++toastId, type: 'info', message: msg });
        triggerNativeNotification('CineTrack - Info', msg);
    },
};

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        addToastFn = (t) => {
            setToasts(prev => [...prev, t]);
            setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
        };
        return () => { addToastFn = null; };
    }, []);

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast__icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
                    <span className="toast__message">{t.message}</span>
                    <button className="toast__close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>✕</button>
                </div>
            ))}
        </div>
    );
};
export default ToastContainer;
