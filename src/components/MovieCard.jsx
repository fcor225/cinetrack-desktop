import React from 'react';

export default function MovieCard({ 
  pelicula, 
  estado, 
  textoPrincipal, 
  accionPrincipal, 
  textoSecundaria, 
  accionSecundaria,
  accionTexto, 
  onAccion 
}) {
  const posterUrl = pelicula.poster_path 
    ? `https://image.tmdb.org/t/p/w500${pelicula.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=Sin+Poster';

  const titulo = pelicula.title || pelicula.titulo;
  const txtPrincipal = textoPrincipal || accionTexto;
  const actPrincipal = accionPrincipal || onAccion;

  return (
    <div className="movie-card">
      <img src={posterUrl} alt={titulo} className="movie-poster" />
      
      {estado && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: estado === 'VISTA' ? '#00e054' : '#40bcf4', color: '#14181c', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', zIndex: 2 }}>
          {estado === 'VISTA' ? '👀 VISTA' : '🕒 PEND.'}
        </div>
      )}

      <div className="movie-overlay">
        <div className="overlay-title" style={{ fontSize: '13px', marginBottom: '15px' }}>{titulo}</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '90%' }}>
          {txtPrincipal && (
            <button className="btn-action" onClick={(e) => { e.stopPropagation(); actPrincipal(pelicula); }}>
              {txtPrincipal}
            </button>
          )}

          {/* AQUÍ ESTÁ EL BOTÓN QUE TE FALTABA */}
          {textoSecundaria && (
            <button className="btn-action" style={{ backgroundColor: '#d9534f', color: 'white' }} onClick={(e) => { e.stopPropagation(); accionSecundaria(pelicula); }}>
              {textoSecundaria}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}