import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from './Spinner';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}><Spinner size="lg" text="Verificando sesión..." /></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};
export default ProtectedRoute;
