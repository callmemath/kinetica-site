#!/bin/bash

# reset-production-db.sh - Script per reimpostare il database di produzione

set -e

echo "🔄 Resetting production database..."

# Connessione al server
DROPLET_IP=${DROPLET_IP:-"138.68.99.102"}

if [ -z "$DROPLET_IP" ]; then
    echo "❌ Error: DROPLET_IP environment variable not set"
    echo "Usage: export DROPLET_IP='your-server-ip' && ./reset-production-db.sh"
    exit 1
fi

echo "📡 Connecting to server: $DROPLET_IP"

# Reset del database di produzione
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
    cd /opt/kinetica
    
    echo "🛑 Stopping containers..."
    docker-compose down
    
    echo "🗑️ Removing existing database volume..."
    docker volume rm vetrinaxristoranti_backend-data || true
    
    echo "🔧 Recreating database volume..."
    docker volume create vetrinaxristoranti_backend-data
    
    echo "🚀 Starting backend container..."
    docker-compose up -d backend
    
    echo "⏳ Waiting for backend to be ready..."
    sleep 10
    
    echo "📊 Initializing database with Prisma..."
    docker-compose exec -T backend npx prisma db push --force-reset
    
    echo "🌱 Running database seed..."
    docker-compose exec -T backend npm run seed || echo "⚠️ Seed script not available or failed"
    
    echo "🔄 Restarting all services..."
    docker-compose down
    docker-compose up -d
    
    echo "✅ Database reset completed!"
EOF

echo "🎉 Production database has been reset successfully!"
echo "🌐 Your application should be available at: http://$DROPLET_IP"

# Health check
echo "🔍 Performing health check..."
sleep 15

if curl -f "http://$DROPLET_IP/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed - application may still be starting"
    echo "📋 Check logs with: ssh root@$DROPLET_IP 'cd /opt/kinetica && docker-compose logs'"
fi
