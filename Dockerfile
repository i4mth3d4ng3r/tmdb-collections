# 1. Use an official lightweight Node.js runtime
FROM node:18-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy project files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 4. Copy remaining source files
COPY . .

# 5. Build step—if needed—or just prepare for runtime
# (Uncomment if there's a build script)
# RUN npm run build

# 6. Final image
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy node modules and app files from builder stage
COPY --from=builder /app /app

# Expose default Stremio addon port (adjust if different)
EXPOSE 7000

# Define environment variable for Fanart key (to be set externally)
# ENV FANART_API_KEY=your_key_here

# Start the app
CMD ["npm", "start"]
