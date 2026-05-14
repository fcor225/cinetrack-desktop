// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Buscador from './pages/Buscador';
import Coleccion from './pages/Coleccion';
import './index.css';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="content-wrapper">
          <Routes>
            <Route path="/" element={<Buscador />} />
            <Route path="/coleccion" element={<Coleccion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}