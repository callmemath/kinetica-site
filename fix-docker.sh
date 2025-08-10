#!/bin/bash

# 🔧 Fix Docker Installation Script
# Questo script risolve i problemi di installazione Docker su Ubuntu

set -e

echo "🔧 Fixing Docker installation on server..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Controlla se siamo connessi al server
if [ -z "$DROPLET_IP" ]; then
    echo -e "${RED}❌ DROPLET_IP non impostato!${NC}"
    echo "Esegui: export DROPLET_IP=\"YOUR_DROPLET_IP\""
    exit 1
fi

echo -e "${YELLOW}📋 Fixing Docker on server: $DROPLET_IP${NC}"

# Funzione per eseguire comandi sul server
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "$1"
}

echo -e "${YELLOW}🗑️  Removing broken Docker installation...${NC}"
run_remote "
    # Stop e rimuovi Docker se esistente
    systemctl stop docker 2>/dev/null || true
    systemctl disable docker 2>/dev/null || true
    
    # Rimuovi pacchetti Docker esistenti
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io 2>/dev/null || true
    
    # Pulisci repository
    rm -f /etc/apt/sources.list.d/docker.list
    
    echo '✅ Removed old Docker installation'
"

echo -e "${YELLOW}📦 Installing Docker correctly...${NC}"
run_remote "
    # Aggiorna sistema
    apt-get update
    
    # Installa prerequisiti
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Aggiungi chiave GPG Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Aggiungi repository Docker
    echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" > /etc/apt/sources.list.d/docker.list
    
    # Aggiorna lista pacchetti
    apt-get update
    
    # Installa Docker
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    echo '✅ Docker installed successfully'
"

echo -e "${YELLOW}🔧 Configuring Docker...${NC}"
run_remote "
    # Abilita e avvia Docker
    systemctl enable docker
    systemctl start docker
    
    # Verifica installazione
    docker --version
    docker-compose --version || echo 'Docker Compose not found, will install'
    
    echo '✅ Docker configured and running'
"

echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
run_remote "
    # Installa Docker Compose se non presente
    if ! command -v docker-compose &> /dev/null; then
        # Scarica Docker Compose
        curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
        
        # Rendi eseguibile
        chmod +x /usr/local/bin/docker-compose
        
        # Crea link simbolico
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    # Verifica versione
    docker-compose --version
    
    echo '✅ Docker Compose installed'
"

echo -e "${YELLOW}🧪 Testing Docker installation...${NC}"
run_remote "
    # Test Docker
    docker run --rm hello-world
    
    echo '✅ Docker test passed'
"

echo -e "${GREEN}🎉 Docker installation fixed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Run the deploy script again:"
echo "   ./deploy-digitalocean.sh"
echo ""
echo "2. Or continue from where it stopped:"
echo "   ssh root@\$DROPLET_IP"
echo "   cd /opt/kinetica"
echo "   docker-compose up -d"
