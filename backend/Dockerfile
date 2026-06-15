# # Use an official Node.js LTS image
# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Copy package files first (better caching)
# COPY package*.json ./

# # Install dependencies
# RUN npm install --production

# # Copy source code
# COPY . .

# # Expose app port (adjust if your app uses another)
# EXPOSE 5000

# # Run app
# CMD ["npm", "start"]



# Use an official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install ALL dependencies (not --production, because nodemon is in deps)
RUN npm install

# Copy source code
COPY . .

# Expose app port
EXPOSE 5000

# Run app
CMD ["node", "index.js"]