// src/pages/Buscador.jsx
import React, { useState } from 'react';
import MovieCard from '../components/MovieCard';

export default function Buscador() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);

  const buscar = async () => {
    if (!query) return;
    const peliculas = await window.api.buscarPeliculas(query);
    setResultados(peliculas);
  };

  const guardar = async (pelicula) => {
    const res = await window.api.guardarPelicula(pelicula);
    if(res.success) alert(`Guardada en colección!`);
  };

  return (
    <div>
      <h2 style={{textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px', color: '#899aa9'}}>Añadir a tu diario</h2>
      <div className="search-section">
        <input 
          type="text" className="search-input" value={query} 
          onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Nombre de la película..." 
        />
        <button className="btn-action" style={{backgroundColor: 'var(--accent-green)', color: '#14181c'}} onClick={buscar}>Buscar</button>
      </div>

      <div className="movies-grid">
        {resultados.map((p) => (
          <MovieCard 
            key={p.id} pelicula={p} 
            textoPrincipal="+ Guardar" accionPrincipal={guardar} 
          />
        ))}
      </div>
    </div>
  );
}