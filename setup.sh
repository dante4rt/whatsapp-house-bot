#!/bin/bash

# ==============================================
# WhatsApp House Hunting Bot - Quick Setup Script
# ==============================================

set -e

echo "🏠 WhatsApp House Hunting Bot Setup"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./setup.sh)${NC}"
    exit 1
fi

# Get VPS IP
VPS_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}Detected VPS IP: $VPS_IP${NC}"

# Step 1: Update system
echo -e "\n${YELLOW}[1/6] Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git nano htop ufw

# Step 2: Install Docker
echo -e "\n${YELLOW}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "\n${YELLOW}[3/6] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Step 4: Create project directory
echo -e "\n${YELLOW}[4/6] Setting up project directory...${NC}"
mkdir -p /opt/whatsapp-bot
cd /opt/whatsapp-bot

# Step 5: Generate API Key
echo -e "\n${YELLOW}[5/6] Generating secure API key...${NC}"
EVOLUTION_API_KEY=$(openssl rand -hex 32)
echo -e "${GREEN}Generated Evolution API Key: $EVOLUTION_API_KEY${NC}"

# Step 6: Create .env file
echo -e "\n${YELLOW}[6/6] Creating environment file...${NC}"
cat > .env << EOF
# WhatsApp House Bot - Environment Variables
# Generated on $(date)

# Evolution API Key
EVOLUTION_API_KEY=$EVOLUTION_API_KEY

# Gemini API Key (get from: https://aistudio.google.com/apikey)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# VPS IP Address
VPS_IP=$VPS_IP
EOF

# Create docker-compose.yml with actual IP
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://${VPS_IP}:5678/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=HouseBot2024!
      - GENERIC_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - bot-network
    depends_on:
      - evolution

  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://${VPS_IP}:8080
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - QRCODE_LIMIT=10
      - WEBHOOK_GLOBAL_ENABLED=false
      - CONFIG_SESSION_PHONE_CLIENT=HouseBot
      - CONFIG_SESSION_PHONE_NAME=Chrome
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres@postgres:5432/evolution
      - DATABASE_CONNECTION_CLIENT_NAME=evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_LOCAL_ENABLED=false
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - postgres
      - redis
    networks:
      - bot-network

  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bot-network

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - bot-network

volumes:
  n8n_data:
  evolution_instances:
  postgres_data:
  redis_data:

networks:
  bot-network:
    driver: bridge
COMPOSE

# Replace VPS_IP in docker-compose
sed -i "s/\${VPS_IP}/$VPS_IP/g" docker-compose.yml

# Configure firewall
echo -e "\n${YELLOW}Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 5678/tcp
ufw allow 8080/tcp
ufw --force enable

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "📋 Important Information:"
echo "----------------------------------------"
echo -e "VPS IP:           ${GREEN}$VPS_IP${NC}"
echo -e "Evolution API Key: ${GREEN}$EVOLUTION_API_KEY${NC}"
echo ""
echo "🔗 Access URLs:"
echo "----------------------------------------"
echo -e "n8n:              ${GREEN}http://$VPS_IP:5678${NC}"
echo -e "                  User: admin"
echo -e "                  Pass: HouseBot2024!"
echo ""
echo -e "Evolution API:    ${GREEN}http://$VPS_IP:8080${NC}"
echo ""
echo "📝 Next Steps:"
echo "----------------------------------------"
echo "1. Edit .env file to add your Gemini API key:"
echo "   nano /opt/whatsapp-bot/.env"
echo ""
echo "2. Start all services:"
echo "   cd /opt/whatsapp-bot && docker-compose up -d"
echo ""
echo "3. Create WhatsApp instance:"
echo "   curl -X POST 'http://localhost:8080/instance/create' \\"
echo "   -H 'Content-Type: application/json' \\"
echo "   -H 'apikey: $EVOLUTION_API_KEY' \\"
echo "   -d '{\"instanceName\": \"house-bot\", \"qrcode\": true, \"integration\": \"WHATSAPP-BAILEYS\"}'"
echo ""
echo "4. Get QR Code to scan:"
echo "   Open in browser: http://$VPS_IP:8080/instance/connect/house-bot"
echo ""
echo "=============================================="
