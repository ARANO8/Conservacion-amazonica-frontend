# syntax=docker/dockerfile:1

# Imagen de los manuales: dos sitios Docusaurus estáticos servidos por nginx.
#
# El manual técnico se compila aparte para que el proxy `edge` pueda exigir
# sesión a todo lo que cuelga de /amzdesk/manual/tecnico/ (páginas, JS e índice
# de búsqueda). Aquí dentro no hay control de acceso: lo hace `edge`.

##############################################################################
# Etapa 1 — compilación de los dos sitios
##############################################################################
FROM node:20-bookworm-slim AS builder

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

##############################################################################
# Etapa 2 — nginx estático
##############################################################################
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mismas rutas que en el dominio: el técnico vive dentro del de usuario
COPY --from=builder /app/build/usuario /usr/share/nginx/html/amzdesk/manual
COPY --from=builder /app/build/tecnico /usr/share/nginx/html/amzdesk/manual/tecnico

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/amzdesk/manual/ || exit 1
