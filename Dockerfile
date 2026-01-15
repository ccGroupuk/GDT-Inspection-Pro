FROM node:20-slim
# Install build tools for any remaining native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
# Omit lockfile copy to force fresh install
RUN npm install
COPY . .
RUN npm run build
ENV PORT=5004
EXPOSE 5004
CMD ["npm", "start"]
