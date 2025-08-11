#!/bin/bash

# deploy-env.sh - Deploy environment variables to production

set -e

DROPLET_IP=${DROPLET_IP:-"138.68.99.102"}

if [ -z "$DROPLET_IP" ]; then
    echo "❌ Error: DROPLET_IP environment variable not set"
    echo "Usage: export DROPLET_IP='your-server-ip' && ./deploy-env.sh"
    exit 1
fi

echo "🔧 Deploying environment variables to $DROPLET_IP..."

# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Create .env file content
ENV_CONTENT="# Production Environment Variables for Kinetica Backend
# Generated on $(date)

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Database Configuration  
DATABASE_URL=file:/app/data/production.db

# Frontend URL
FRONTEND_URL=http://$DROPLET_IP

# Email Configuration (SendGrid)
SENDGRID_API_KEY=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
FROM_EMAIL=no-reply@kineticafisio.site

# Legacy SMTP Configuration (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=matteo.bevilacqua60@gmail.com
SMTP_PASS=tpnbxmommvjlwjd

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_TIMEOUT_MINUTES=30

# Logging
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false

# Node Environment
NODE_ENV=production
PORT=3001

# Backup Schedule (cron format)
BACKUP_SCHEDULE=0 2 * * *"

# Deploy to server
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << EOF
    cd /opt/kinetica
    
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
$ENV_CONTENT
ENVEOF
    
    echo "🔐 Setting secure permissions on .env file..."
    chmod 600 .env
    
    echo "✅ Environment variables deployed!"
    
    echo "🔄 Restarting services to apply new configuration..."
    docker-compose down
    docker-compose up -d
    
    echo "⏳ Waiting for services to stabilize..."
    sleep 15
EOF

echo "🎉 Environment variables deployed successfully!"
echo "🌐 Application should be available at: http://$DROPLET_IP"

# Health check
echo "🔍 Performing health check..."
sleep 5

if curl -f "http://$DROPLET_IP/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed. Checking application status..."
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
        cd /opt/kinetica
        echo "🐳 Container status:"
        docker-compose ps
        echo "📋 Backend logs (last 20 lines):"
        docker-compose logs --tail=20 backend
EOF
fi
