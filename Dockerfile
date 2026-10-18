# Inglou · imagem de produção (Node 22, sem build de front: arquivos estáticos servidos pelo próprio servidor)
FROM node:22.22-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/dados
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY server.js ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN mkdir -p /dados && chown -R node:node /dados
USER node
VOLUME ["/dados"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/saude || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
