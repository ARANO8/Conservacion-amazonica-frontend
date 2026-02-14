FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# ✨ EL FIX MÁGICO: Obligar a pnpm a usar estructura plana (sin symlinks)
RUN pnpm config set node-linker hoisted

# Instalar dependencias (usando frozen-lockfile por seguridad en CI/CD)
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Argumento para la URL de la API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Construir el proyecto
RUN pnpm build

# Exponer el puerto
EXPOSE 3001

# Iniciar la app
CMD ["pnpm", "start"]