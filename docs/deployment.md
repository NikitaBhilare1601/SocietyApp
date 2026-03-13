# SocietyApp Deployment Guide

This guide provides instructions for deploying SocietyApp on a Linux server using Bun.

## Prerequisites

- **Bun**: Install Bun on your server.
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **SQLite3**: Ensure SQLite is installed.
- **Environment Variables**: Create a `.env` file based on `.env.example`.

## Steps

1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url>
   cd society-app
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production credentials
   nano .env
   ```

4. **Build the Project**:
   ```bash
   bun run build
   ```

5. **Start the Server**:
   ```bash
   bun run start
   ```

## Nginx Reverse Proxy (Recommended)

Configure Nginx to proxy requests to `http://localhost:3000`.

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
