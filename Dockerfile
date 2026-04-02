FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy rest of the app
COPY . .

# Expose port (Koyeb uses PORT env var, default 3000)
EXPOSE 3000

# Health check — Koyeb will ping this
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
