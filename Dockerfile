# Use a lightweight Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code into the dist directory
RUN npm run build

# Expose the port the server runs on (defaults to 5000)
# Update this if your Express app uses a different PORT
EXPOSE 8080

# Default command to start the server
CMD ["npm", "start"]
