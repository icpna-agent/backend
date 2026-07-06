# Etapa de producción
FROM node:25-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json ./

COPY src ./src

RUN npm run build

RUN ls -la dist/

# Etapa de producción
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar la aplicación construida desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Verificar archivos copiados
RUN ls -la dist/

# Exponer el puerto
EXPOSE 3200

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
