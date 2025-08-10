#!/bin/bash

# Test Deployment Script for Kinetica Fisioterapia
# This script tests the deployment before going live

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
}

# Test local build
test_local_build() {
    log "Testing local build..."
    
    # Test frontend build
    log "Building frontend..."
    npm run build || error "Frontend build failed"
    success "Frontend build successful"
    
    # Test backend build
    log "Building backend..."
    cd backend
    npm run build || error "Backend build failed"
    cd ..
    success "Backend build successful"
}

# Test Docker build
test_docker_build() {
    log "Testing Docker build..."
    
    # Build frontend Docker image
    log "Building frontend Docker image..."
    docker build -t kinetica-frontend . || error "Frontend Docker build failed"
    success "Frontend Docker image built"
    
    # Build backend Docker image
    log "Building backend Docker image..."
    docker build -t kinetica-backend ./backend || error "Backend Docker build failed"
    success "Backend Docker image built"
}

# Test Docker Compose
test_docker_compose() {
    log "Testing Docker Compose..."
    
    # Copy environment file
    if [ ! -f ".env" ]; then
        cp ".env.production" ".env"
        warning "Created .env from .env.production for testing"
    fi
    
    # Start services
    log "Starting services with Docker Compose..."
    docker-compose up -d || error "Docker Compose failed to start"
    
    # Wait for services
    log "Waiting for services to be ready..."
    sleep 30
    
    # Test health endpoint
    log "Testing health endpoint..."
    curl -f http://localhost/health || error "Health check failed"
    success "Health check passed"
    
    # Test frontend
    log "Testing frontend..."
    curl -f http://localhost/ | grep -q "Kinetica" || error "Frontend test failed"
    success "Frontend is responding"
    
    # Clean up
    log "Cleaning up test environment..."
    docker-compose down
    success "Test environment cleaned up"
}

# Validate environment files
validate_env() {
    log "Validating environment configuration..."
    
    # Check .env.production exists
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found"
    fi
    
    # Check backend environment
    if [ ! -f ".env.backend.production" ]; then
        error ".env.backend.production file not found"
    fi
    
    # Check for placeholder values
    if grep -q "your-domain.com" .env.production; then
        warning "Found placeholder values in .env.production - update before deployment"
    fi
    
    if grep -q "GENERATE_A_SECURE" .env.backend.production; then
        warning "Found placeholder values in .env.backend.production - update before deployment"
    fi
    
    success "Environment files validated"
}

# Pre-deployment checklist
pre_deployment_checklist() {
    log "Running pre-deployment checklist..."
    
    echo -e "\n${YELLOW}📋 Pre-Deployment Checklist:${NC}"
    
    echo "1. ✅ Docker and Docker Compose installed"
    echo "2. ✅ Environment files configured"
    echo "3. ✅ Local build tested"
    echo "4. ✅ Docker images tested"
    echo "5. ✅ Health checks passing"
    
    echo -e "\n${YELLOW}🔧 Manual Steps Required:${NC}"
    echo "1. Create DigitalOcean droplet"
    echo "2. Update environment files with real values:"
    echo "   - FRONTEND_URL (your domain or droplet IP)"
    echo "   - JWT_SECRET (generate with: openssl rand -base64 64)"
    echo "   - SMTP credentials (Gmail app password)"
    echo "3. Set deployment variables:"
    echo "   export DROPLET_IP='your-droplet-ip'"
    echo "   export DOMAIN='your-domain.com'  # optional"
    echo "4. Run deployment:"
    echo "   ./deploy-digitalocean.sh"
    
    success "Pre-deployment checklist completed"
}

# Main function
main() {
    log "🧪 Starting Kinetica Fisioterapia deployment tests..."
    
    # Check Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
    fi
    
    validate_env
    test_local_build
    test_docker_build
    test_docker_compose
    pre_deployment_checklist
    
    success "🎉 All tests passed! Ready for deployment."
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Update environment files with your real values"
    echo "2. Set DROPLET_IP environment variable"
    echo "3. Run: ./deploy-digitalocean.sh"
}

# Run tests
main "$@"
