FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml .npmrc* ./

# Instalar dependencias
RUN pnpm install

# Copiar el código fuente
COPY . .

# Argumento para la URL de la API (se pasa al construir)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Construir el proyecto
RUN pnpm build

# Exponer el puerto 3001 (que usas en tus scripts)
EXPOSE 3001

# Iniciar la app
CMD ["pnpm", "start"]