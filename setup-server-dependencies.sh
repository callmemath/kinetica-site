#!/bin/bash

# 🔧 Setup Server Dependencies Script
# Installa Node.js, Docker e tutte le dipendenze necessarie

set -e

echo "🔧 Setting up server dependencies..."

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

echo -e "${YELLOW}📋 Setting up server: $DROPLET_IP${NC}"

# Funzione per eseguire comandi sul server
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "$1"
}

echo -e "${YELLOW}🔄 Updating system packages...${NC}"
run_remote "
    apt-get update
    apt-get upgrade -y
"

echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
run_remote "
    # Installa dipendenze base
    apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
    
    # Installa build tools
    apt-get install -y build-essential python3 python3-pip git
    
    echo '✅ System dependencies installed'
"

echo -e "${YELLOW}🟢 Installing Node.js...${NC}"
run_remote "
    # Rimuovi Node.js esistente se presente
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Installa NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    # Installa Node.js 18
    apt-get install -y nodejs
    
    # Verifica installazione
    node --version
    npm --version
    
    echo '✅ Node.js installed successfully'
"

echo -e "${YELLOW}🐳 Installing Docker...${NC}"
run_remote "
    # Rimuovi Docker esistente
    apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io 2>/dev/null || true
    
    # Aggiungi chiave GPG Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Aggiungi repository Docker
    echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" > /etc/apt/sources.list.d/docker.list
    
    # Aggiorna e installa Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Abilita e avvia Docker
    systemctl enable docker
    systemctl start docker
    
    # Verifica Docker
    docker --version
    
    echo '✅ Docker installed successfully'
"

echo -e "${YELLOW}🐙 Installing Docker Compose...${NC}"
run_remote "
    # Installa Docker Compose
    curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    
    # Rendi eseguibile
    chmod +x /usr/local/bin/docker-compose
    
    # Crea link simbolico
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Verifica versione
    docker-compose --version
    
    echo '✅ Docker Compose installed'
"

echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
run_remote "
    # Configura UFW
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3001/tcp
    
    echo '✅ Firewall configured'
"

echo -e "${YELLOW}🧪 Testing installations...${NC}"
run_remote "
    echo 'Testing Node.js:'
    node --version
    npm --version
    
    echo 'Testing Docker:'
    docker --version
    docker-compose --version
    
    echo 'Testing Docker service:'
    systemctl status docker --no-pager
    
    echo 'Testing Docker run:'
    docker run --rm hello-world
    
    echo '✅ All tests passed'
"

echo -e "${GREEN}🎉 Server setup completed successfully!${NC}"
echo -e "${YELLOW}📝 What was installed:${NC}"
echo "✅ Node.js 18.x"
echo "✅ npm (latest)"
echo "✅ Docker CE (latest)"
echo "✅ Docker Compose (latest)"
echo "✅ Build tools and dependencies"
echo "✅ Firewall configuration"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Run the deployment script:"
echo "   ./deploy-digitalocean.sh"
echo ""
echo "2. Or deploy manually:"
echo "   ssh root@\$DROPLET_IP"
echo "   cd /opt && git clone https://github.com/yourusername/kinetica.git"
echo "   cd kinetica && docker-compose up -d"
