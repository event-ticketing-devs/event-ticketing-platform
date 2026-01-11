# Backend Dockerfile - Development with hot-reloading
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (bcrypt, etc.)
RUN apk update && apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for nodemon)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]
