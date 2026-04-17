# Stage 1: Build app with Node
FROM node:18 AS build
WORKDIR /app

# Copy deps first for better caching + avoid host node_modules issues
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
