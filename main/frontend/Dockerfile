# ═══════════════════════════════════════════════
# Stage 1: Builder — Compilar React para producción
# ═══════════════════════════════════════════════
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar manifiestos primero para cache de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir bundle de producción
RUN npm run build

# ═══════════════════════════════════════════════
# Stage 2: Runner — Servir con Nginx
# ═══════════════════════════════════════════════
FROM nginx:1.25-alpine AS runner

# Copiar configuración personalizada de Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración para SPA (React Router)
RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Compresión gzip \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml; \
    \
    # Cache de assets estáticos \
    location /static/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # SPA fallback: redirigir todas las rutas a index.html \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
