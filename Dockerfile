# Use Node.js LTS as the base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files first to cache layers
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies (including workspace dependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend and compiled backend
RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets and dependencies from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/.env* ./

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Start RaastaSense using the production-compiled backend server
CMD ["npm", "start"]
