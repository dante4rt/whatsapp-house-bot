# WhatsApp House Bot

WhatsApp bot that listens to group chats for house hunting info and forwards messages to a webhook.

## Setup

```bash
# 1. Configure
cp .env.example .env
# Edit .env with your settings

# 2. Deploy
docker compose up -d --build

# 3. Scan QR code
docker logs whatsapp-bot -f
# Scan the QR code with WhatsApp
```

## Commands

```bash
# View bot logs (and QR code)
docker logs whatsapp-bot -f

# Restart
docker compose restart whatsapp

# Full reset (will need to scan QR again)
docker compose down -v && docker compose up -d --build
```

## Environment Variables

- `GROUP_NAME`: Group name to listen for (partial match, default: "House Hunting")
- `WEBHOOK_URL`: URL to send messages to (optional)
- `QUEUE_INTERVAL`: Message queue processing interval in milliseconds (default: 30000)
