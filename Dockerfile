# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies for the backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy the rest of the backend source code
COPY backend/. ./

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /usr/src/app

# We only need production dependencies.
# Re-installing them in a clean way is better and creates a smaller image.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Command to run the application
CMD [ "npm", "run", "start:prod" ]
