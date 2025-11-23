# Development stage
FROM node:18-alpine AS development

# Instalar OpenSSL (Requerido por Prisma en Alpine)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Production build stage
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# --- ETAPA DE PRODUCCIÓN FINAL ---
FROM node:18-alpine AS production

# Instalar OpenSSL también en producción
RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copiar explícitamente todo lo necesario desde la etapa de build
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package.json .
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package-lock.json .
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/prisma ./prisma

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Iniciar la aplicación
CMD ["node", "dist/src/main"]
