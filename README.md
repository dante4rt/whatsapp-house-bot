# WhatsApp House Bot

WhatsApp bot that listens to group chats for house hunting info and saves to Google Sheets via n8n.

## Setup

```bash
# 1. Configure
cp .env.example .env
# Edit GROUP_NAME and GEMINI_API_KEY

# 2. Deploy
./deploy.sh

# 3. Scan QR code
docker logs whatsapp-bot -f
# Scan the QR code with WhatsApp

# 4. Access n8n
# http://YOUR_IP:5678
```

## Commands

```bash
# View bot logs (and QR code)
docker logs whatsapp-bot -f

# Restart
docker compose restart whatsapp

# Full reset (will need to scan QR again)
docker compose down -v && ./deploy.sh
```
