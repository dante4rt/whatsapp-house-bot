# WhatsApp House Bot

Monitor WhatsApp groups for property listings → forward to webhook → AI extracts to Google Sheets.

## Quick Start

```bash
cp .env.example .env    # Configure GROUP_NAME, WEBHOOK_URL
docker compose up -d --build
docker logs whatsapp-bot -f   # Scan QR code
```

## Config (.env)

| Variable | Default | Description |
| ---------- | --------- | ------------- |
| `GROUP_NAME` | House Hunting | Group to monitor (partial match) |
| `WEBHOOK_URL` | - | Webhook endpoint |
| `QUEUE_INTERVAL` | 30000 | Batch interval (ms) |

## Commands

```bash
docker logs -f whatsapp-bot              # View logs
docker compose restart                   # Restart
docker compose down -v && docker compose up -d --build  # Reset auth
```

## What Gets Forwarded

- Text & captions
- Images (base64)
- Video links (TikTok/Instagram/YouTube)
- Sender, timestamp, group metadata

## n8n Workflow Setup

1. Import `n8n-workflow.json` into n8n
2. Configure credentials:
   - **Google Gemini API** - for AI extraction
   - **Google Sheets OAuth** - for data storage
3. Set your Google Sheet document ID in the "Google Sheets" node
4. Activate workflow → copy webhook URL → paste in `.env` as `WEBHOOK_URL`

**Flow:** Webhook → Parse → Image? → Gemini AI → Parse JSON → Google Sheets

**Extracted fields:** type, rooms, bathrooms, land_size, building_size, price, location, features
