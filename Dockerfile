FROM node:20-slim

# Install build tools for any remaining native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./

# Force install of ALL dependencies (including dev) so 'vite' and 'esbuild' are available for the build step
RUN npm install --include=dev

COPY . .

# Run the build
RUN npm run build

# NOW set to production for the runtime (optional, but good practice)
ENV NODE_ENV=production
ENV PORT=5004
EXPOSE 5004

CMD ["npm", "start"]
