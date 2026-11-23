# Backend image: Node.js 20 (LTS)
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better Docker caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the source code
COPY . .

EXPOSE 5001
CMD ["node", "index.js"]
