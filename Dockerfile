# Use a lightweight Node.js base image
FROM node:20-alpine

# Required for Hugging Face Spaces: create a non-root user
RUN adduser -D -u 1000 appuser

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY --chown=appuser package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY --chown=appuser . .

# Build the TypeScript code into the dist directory
RUN npm run build

# Switch to non-root user
USER appuser

# Hugging Face Spaces REQUIRES port 7860
EXPOSE 7860

# Default command to start the server
CMD ["npm", "start"]
