import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ToastContainer from './components/common/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DetallePelicula from './pages/DetallePelicula/DetallePelicula';
import CollectionPage from './pages/CollectionPage';
import ListsPage from './pages/ListsPage';
import ListDetailPage from './pages/ListDetailPage';
import ProfilePage from './pages/ProfilePage';
import ReviewsPage from './pages/ReviewsPage';
import AchievementsPage from './pages/AchievementsPage';
import CineSwipePage from './pages/CineSwipePage';
import CineReelsPage from './pages/CineReelsPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * @module App
 * @description Router principal de CineTrack.
 * - Rutas públicas: /login, /register
 * - Rutas protegidas: /, /buscar, /pelicula/:tmdbId, /coleccion, /listas, /perfil, /resenas
 */
function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastContainer />
                <Routes>
                    {/* Rutas públicas (sin navbar/footer) */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Rutas públicas con layout principal (Escaparate) */}
                    <Route element={<MainLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="/pelicula/:tmdbId" element={<DetallePelicula />} />
                        <Route path="/buscar" element={<SearchPage />} />
                    </Route>

                    {/* Rutas protegidas (con layout principal) */}
                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route path="/coleccion" element={<CollectionPage />} />
                        <Route path="/listas" element={<ListsPage />} />
                        <Route path="/listas/:id" element={<ListDetailPage />} />
                        <Route path="/perfil" element={<ProfilePage />} />
                        <Route path="/resenas" element={<ReviewsPage />} />
                        <Route path="/logros" element={<AchievementsPage />} />
                        <Route path="/cineswipe" element={<CineSwipePage />} />
                        <Route path="/cinereels" element={<CineReelsPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
