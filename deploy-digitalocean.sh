#!/bin/bash

# Kinetica Fisioterapia - DigitalOcean Deployment Script
# This script deploys the application to a DigitalOcean droplet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="${DROPLET_IP:-}"
DROPLET_USER="${DROPLET_USER:-root}"
APP_DIR="/opt/kinetica"
DOMAIN="${DOMAIN:-}"

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    if [ -z "$DROPLET_IP" ]; then
        error "DROPLET_IP environment variable is required"
    fi
    
    if ! command -v ssh >/dev/null 2>&1; then
        error "SSH is required but not installed"
    fi
    
    if ! command -v rsync >/dev/null 2>&1; then
        error "rsync is required but not installed"
    fi
    
    if [ ! -f ".env.production" ]; then
        warning ".env.production not found, using .env"
        if [ ! -f ".env" ]; then
            error "No environment file found"
        fi
    fi
    
    success "Requirements check passed"
}

# Setup droplet with Docker and dependencies
setup_droplet() {
    log "Setting up DigitalOcean droplet..."
    
    ssh "$DROPLET_USER@$DROPLET_IP" << 'EOF'
        # Update system
        apt-get update && apt-get upgrade -y
        
        # Install Docker
        apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
        add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Install other utilities
        apt-get install -y git nginx-utils htop
        
        # Create app directory
        mkdir -p /opt/kinetica
        
        # Setup firewall
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        ufw --force enable
        
        # Start Docker
        systemctl enable docker
        systemctl start docker
EOF
    
    success "Droplet setup completed"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Copy files to droplet
    log "Copying files to droplet..."
    rsync -avz --exclude '.git' --exclude 'node_modules' --exclude 'dist' \
          ./ "$DROPLET_USER@$DROPLET_IP:$APP_DIR/"
    
    # Copy environment file
    if [ -f ".env.production" ]; then
        scp ".env.production" "$DROPLET_USER@$DROPLET_IP:$APP_DIR/.env"
    else
        scp ".env" "$DROPLET_USER@$DROPLET_IP:$APP_DIR/.env"
    fi
    
    # Deploy on droplet
    ssh "$DROPLET_USER@$DROPLET_IP" << EOF
        cd $APP_DIR
        
        # Stop existing containers
        docker-compose down || true
        
        # Build and start services
        docker-compose build --no-cache
        docker-compose up -d
        
        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 30
        
        # Run database migrations and setup
        docker-compose exec -T backend npm run db:migrate:production
        docker-compose exec -T backend npm run setup:production
        
        # Check service health
        docker-compose ps
        
        # Test health endpoint
        curl -f http://localhost/health || echo "Health check failed"
EOF
    
    success "Application deployed successfully"
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    if [ -n "$DOMAIN" ]; then
        log "Setting up SSL certificate for $DOMAIN..."
        
        ssh "$DROPLET_USER@$DROPLET_IP" << EOF
            # Install certbot
            apt-get install -y certbot python3-certbot-nginx
            
            # Stop nginx temporarily
            docker-compose stop frontend
            
            # Get certificate
            certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
            
            # Create SSL directory
            mkdir -p $APP_DIR/ssl
            cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/
            cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/
            
            # Update nginx config for SSL
            cat > $APP_DIR/nginx-ssl.conf << 'NGINXCONF'
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXCONF
            
            # Update docker-compose to use SSL config
            sed -i 's|nginx.conf|nginx-ssl.conf|g' $APP_DIR/docker-compose.yml
            
            # Restart services
            docker-compose up -d
            
            # Setup auto-renewal
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
EOF
        
        success "SSL certificate configured for $DOMAIN"
    fi
}

# Main deployment process
main() {
    log "🚀 Starting Kinetica Fisioterapia deployment to DigitalOcean..."
    
    check_requirements
    
    echo -e "\n${YELLOW}Deployment Configuration:${NC}"
    echo "Droplet IP: $DROPLET_IP"
    echo "User: $DROPLET_USER"
    echo "Domain: ${DOMAIN:-"Not configured"}"
    echo "App Directory: $APP_DIR"
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment cancelled"
    fi
    
    setup_droplet
    deploy_app
    setup_ssl
    
    success "🎉 Deployment completed successfully!"
    echo -e "\n${GREEN}Your application is now running at:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo "🌐 https://$DOMAIN"
    else
        echo "🌐 http://$DROPLET_IP"
    fi
    echo "🏥 Admin panel: /admin"
    echo "📊 Health check: /health"
    
    log "🔧 Useful commands:"
    echo "View logs: ssh $DROPLET_USER@$DROPLET_IP 'cd $APP_DIR && docker-compose logs -f'"
    echo "Restart services: ssh $DROPLET_USER@$DROPLET_IP 'cd $APP_DIR && docker-compose restart'"
    echo "Update app: ./deploy-digitalocean.sh"
}

# Run main function
main "$@"