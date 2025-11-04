# Stage 1 — build: install deps (runs postinstall to copy twemoji)
FROM node:20-alpine AS builder
WORKDIR /app

# copy package files first for fast npm install
COPY package*.json ./
# copy any scripts referenced by postinstall
COPY copy-twemoji.js ./

# install deps (postinstall will run copy-twemoji.js)
RUN npm ci --no-audit --no-fund

# copy the rest of the project
COPY . .

# ensure twemoji assets are present (postinstall already runs, but run script again to be safe)
RUN if [ -f ./copy-twemoji.js ]; then node copy-twemoji.js || true; fi

# Stage 2 — runtime: serve static files with nginx
FROM nginx:stable-alpine AS runtime
# remove default html files
RUN rm -rf /usr/share/nginx/html/*

# copy site files from builder
COPY --chown=nginx:nginx --from=builder /app /usr/share/nginx/html

# Expose HTTP
EXPOSE 80

# start nginx
CMD ["nginx", "-g", "daemon off;"]