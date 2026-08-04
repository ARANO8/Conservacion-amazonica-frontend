# syntax=docker/dockerfile:1

# Imagen de produccion del frontend.
#
# NEXT_PUBLIC_API_URL se hornea en el bundle del navegador durante `next build`,
# no se lee en runtime. Por defecto vale `/api`: como el frontend comparte
# dominio con la API detras de Nginx, una ruta relativa hace que la misma imagen
# sirva en cualquier entorno sin reconstruirla.

##############################################################################
# Etapa 1 — dependencias
##############################################################################
FROM node:20-bookworm-slim AS deps

# El script `prepare` invoca husky, que falla sin .git (esta en .dockerignore).
ENV HUSKY=0

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

##############################################################################
# Etapa 2 — compilacion
##############################################################################
FROM node:20-bookworm-slim AS builder

ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

##############################################################################
# Etapa 3 — ejecucion
##############################################################################
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# El output standalone ya incluye las dependencias de runtime que necesita.
# public/ y .next/static quedan fuera de ese paquete y hay que copiarlos aparte.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
