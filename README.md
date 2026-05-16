# CineTrack Desktop 🎬

CineTrack Desktop es una plataforma cinematográfica de vanguardia diseñada para gestionar tu diario personal de películas con una arquitectura Híbrida y Offline-First. Inspirada en la estética de Letterboxd, combina la potencia de las APIs globales con la privacidad y velocidad de una base de datos local.

# 🚀 Características Principales

Modelo "Escaparate" (Showcase): Navegación pública fluida. Explora tendencias, estrenos y fichas técnicas sin necesidad de login. Las acciones interactivas (guardar, puntuar, reseñar) están protegidas y guían al usuario al registro.
Hero Dashboard Dinámico: Portada visual impactante que muestra las tendencias globales del día mediante un sistema de rotación aleatoria.
Comunidad Trakt.tv Integrada: Reseñas globales directamente desde la comunidad de Trakt, con un sistema inteligente de gestión de spoilers (ocultos tras interacción).
Ficha Técnica Híbrida:
Datos Globales: Tráilers, reparto, recomendaciones similares y plataformas de streaming (Watch Providers) vía TMDB.
Datos Locales: Gestión de estados (Pendiente, Vista, Favorita) y reseñas privadas guardadas en tu propio equipo.
Resiliencia Offline: La aplicación detecta tu estado de conexión. Si no hay internet, CineTrack entra automáticamente en Modo Offline, permitiéndote gestionar y visualizar toda tu colección local almacenada en SQLite sin interrupciones.

# 🛠️ Tecnologías Utilizadas

Frontend: React 19 (Interfaz reactiva y modular).
APIs Externas:
The Movie Database (TMDB): Metadatos, imágenes y multimedia.
Trakt.tv API: Comentarios y reseñas de la comunidad global.
Backend: Node.js + Express (Capa de servicios REST y WebSockets).
Base de Datos: SQLite para persistencia local 100% privada.
Estilos: CSS3 moderno con variables personalizadas, animaciones fluidas y estética premium dark mode.

# 📦 Instalación y Ejecución

Clonar el repositorio:

bash
git clone https://github.com/martincordero06052002-ux/cinetrack-desktop.git
Instalar dependencias:

bash
# En las carpetas de servicios
cd main/frontend && npm install
cd ../backend && npm install
Configurar Variables de Entorno:

Crea un archivo .env en main/backend/ con tu TMDB_ACCESS_TOKEN y secretos JWT.
Crea un archivo .env en main/frontend/ con tus REACT_APP_TRAKT_CLIENT_ID y Secret.

Ejecutar usando Docker (Recomendado):

bash
cd main
docker-compose up --build

Ejecutar manualmente (Sin Docker):

bash
# Terminal 1: Backend
cd main/backend
npm run dev

# Terminal 2: Frontend
cd main/frontend
npm start

# 📂 Estructura del Proyecto Profesional

main/frontend/: Aplicación React con capa de servicios modularizada.
main/backend/: Servidor Express con proxy para APIs externas y controladores de base de datos.
database/: Ubicación de la base de datos persistente cinetrack.db.
