# Imagen base ligera
FROM node:18-alpine AS builder

# Instalar dependencias nativas para sqlite3 (compilación)
RUN apk add --no-cache python3 make g++

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos primero para cache
COPY package*.json ./

# Instalar dependencias (incluyendo compilación nativa de sqlite3)
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# ═══════════════════════════════════════════════
# Stage 2: Runner — Imagen mínima de producción
# ═══════════════════════════════════════════════
FROM node:18-alpine AS runner

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cinetrack -u 1001

# Copiar solo lo necesario del builder
COPY --from=builder --chown=cinetrack:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cinetrack:nodejs /app .

# Crear directorio para la base de datos
RUN mkdir -p /data && chown cinetrack:nodejs /data

# Usar usuario no-root
USER cinetrack

# Exponer puerto del API
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Iniciar servidor
CMD ["node", "index.js"]
