#!/bin/bash

# Deployment script for SocietyApp

echo "🚀 Starting deployment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
bun install

# 2. Build the frontend
echo "🏗️  Building frontend..."
bun run build

# 3. Restart the service (example using pm2 or similar)
# pm2 restart society-app || pm2 start backend/src/index.ts --name society-app

echo "✅ Deployment complete!"
