# Use a lightweight Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
# node:20-alpine already has a built-in 'node' user (UID 1000)
COPY --chown=node package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY --chown=node . .

# Build the TypeScript code into the dist directory
RUN npm run build

# Switch to non-root user (built-in 'node' user)
USER node

# Hugging Face Spaces REQUIRES port 7860
EXPOSE 7860

# Default command to start the server
CMD ["npm", "start"]
