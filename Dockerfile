FROM node:20-slim

# Install system dependencies required for native modules (bufferutil, utf-8-validate)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (generating a fresh package-lock.json for Linux)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port
ENV PORT=5004
EXPOSE 5004

# Start the application
CMD ["npm", "start"]
