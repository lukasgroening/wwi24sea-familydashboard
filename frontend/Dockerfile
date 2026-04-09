# Stage 1: Build - Install dependencies and build the app
FROM node:20-alpine AS build
WORKDIR /app

# Add build-time environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code and config files
COPY . .

# Run linting
RUN npm run lint

# Run tests
RUN npm run test

# Build the application
RUN npm run build

# Stage 2: Final - Serve the built app using Nginx
FROM nginx:stable-alpine AS final
# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (standard Nginx port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
