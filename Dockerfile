FROM node:22.17-alpine
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts && \
npm cache clean --force

# Copy application files
COPY Images ./Images
COPY Public ./Public
COPY lib ./lib
COPY index.js server.js newrelic.js ./

ENV NODE_ENV=production

ENTRYPOINT ["npm", "start"]
