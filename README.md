# WhatsApp House Bot

WhatsApp bot that extracts property info from group chats and saves to Google Sheets using AI.

## Setup

```bash
# 1. Configure
cp .env.example .env
# Edit .env: set EVOLUTION_API_KEY (openssl rand -hex 32) and GEMINI_API_KEY

# 2. Deploy (choose one)
./deploy.sh              # Automated (recommended)

# OR manually:
docker compose down -v
docker compose up -d postgres redis && sleep 30
docker compose up -d evolution && sleep 45
docker compose up -d n8n

# 3. Connect WhatsApp
source .env
curl -s http://localhost:8080/instance/connect/house-bot -H "apikey: $EVOLUTION_API_KEY"
# Scan QR code with WhatsApp

# 4. Import workflow at http://YOUR_IP:5678
```

## Commands

```bash
# Status
docker compose ps
curl -s http://localhost:8080/instance/connectionState/house-bot -H "apikey: $EVOLUTION_API_KEY"

# Logs
docker logs evolution-api -f

# Reset
docker compose down -v && ./deploy.sh
```
