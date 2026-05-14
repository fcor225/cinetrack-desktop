import React, { useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard';

export default function Coleccion() {
  const [coleccion, setColeccion] = useState([]);

  const cargarDatos = async () => {
    const peliculasGuardadas = await window.api.obtenerColeccion();
    setColeccion(peliculasGuardadas);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eliminar = async (pelicula) => {
    if(window.confirm(`¿Seguro que quieres borrar ${pelicula.titulo}?`)) {
      await window.api.eliminarPelicula(pelicula.id_local);
      cargarDatos(); 
    }
  };

  // Ahora funciona como un interruptor (Toggle)
  const cambiarEstado = async (pelicula) => {
    // Si está vista, la pasamos a pendiente. Si está pendiente, la pasamos a vista.
    const nuevoEstado = pelicula.estado === 'VISTA' ? 'PENDIENTE' : 'VISTA';
    await window.api.actualizarEstado(pelicula.id_local, nuevoEstado);
    cargarDatos(); 
  };

  return (
    <div>
      <h2 style={{borderBottom: '1px solid #2c3440', paddingBottom: '10px', color: 'white'}}>Tu Diario</h2>
      {coleccion.length === 0 ? <p style={{color: '#899aa9'}}>No has registrado ninguna película aún.</p> : null}
      
      <div className="movies-grid">
        {coleccion.map((p) => (
          <MovieCard 
            key={p.id_local} 
            pelicula={p} 
            estado={p.estado}
            
            // EL BOTÓN AHORA ALTERNA EL TEXTO SEGÚN EL ESTADO
            textoPrincipal={p.estado === 'VISTA' ? "🕒 Marcar Pendiente" : "✔ Marcar Vista"}
            accionPrincipal={() => cambiarEstado(p)}
            
            textoSecundaria="🗑 Borrar"
            accionSecundaria={() => eliminar(p)}
          />
        ))}
      </div>
    </div>
  );
}