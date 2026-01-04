# WhatsApp House Bot - User Guide

## Overview

The WhatsApp House Bot automatically monitors your WhatsApp group for property listings and extracts key information into a structured Google Sheets database.

## Prerequisites

- VPS with 2GB RAM, 2 CPU cores
- Ubuntu 20.04/22.04 or Debian 11/12
- Domain (optional, for HTTPS)
- Google Account (for Sheets & Gemini API)
- WhatsApp number for the bot

## Installation

### 1. Quick Setup (15 minutes)

1. Upload files to VPS:

   ```bash
   scp -r /path/to/whatsapp-house-bot root@YOUR_VPS_IP:/opt/
   ```

2. SSH into VPS and run setup:

   ```bash
   ssh root@YOUR_VPS_IP
   cd /opt/whatsapp-house-bot
   chmod +x setup.sh
   ./setup.sh
   ```

3. Add your Gemini API key:
   - Get key from: <https://aistudio.google.com/apikey>
   - Edit `.env` file: `nano .env`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your key

4. Start services:

   ```bash
   docker-compose up -d
   ```

### 2. Connect WhatsApp

1. Create WhatsApp instance:

   ```bash
   curl -X POST 'http://localhost:8080/instance/create' \
   -H 'Content-Type: application/json' \
   -H 'apikey: YOUR_EVOLUTION_API_KEY' \
   -d '{"instanceName": "house-bot", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
   ```

2. Scan QR code:
   - Open in browser: `http://YOUR_VPS_IP:8080/instance/connect/house-bot`
   - Scan with WhatsApp (Settings > Linked Devices > Link a Device)

3. Setup webhook:

   ```bash
   curl -X POST 'http://localhost:8080/webhook/set/house-bot' \
   -H 'Content-Type: application/json' \
   -H 'apikey: YOUR_EVOLUTION_API_KEY' \
   -d '{
     "webhook": {
       "enabled": true,
       "url": "http://n8n:5678/webhook/whatsapp-incoming",
       "webhookByEvents": true,
       "events": ["MESSAGES_UPSERT"]
     }
   }'
   ```

### 3. Configure Google Sheets

1. Create new Google Sheet: <https://sheets.google.com>
2. Rename Sheet1 to "Properties"
3. Add headers in Row 1:

   ```text
   Timestamp | Date | Sender | Property Name | Developer | LB (m2) | LT (m2) | Bedrooms | Bathrooms | Price | DP | Monthly | Video URL | Location | Notes
   ```

4. Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

### 4. Setup n8n Workflow

1. Open n8n: `http://YOUR_VPS_IP:5678`
2. Login: admin / HouseBot2024!
3. Import workflow: Add Workflow → Import from File → upload `n8n-workflow.json`
4. Configure workflow:
   - Update Google Sheet ID in both Google Sheets nodes
   - Add Google Sheets credential (Service Account)
   - Update Group JID in "Send Recap" node

5. Get Group JID:

   ```bash
   curl -X GET 'http://localhost:8080/group/fetchAllGroups/house-bot?getParticipants=false' \
   -H 'apikey: YOUR_EVOLUTION_API_KEY'
   ```

6. Activate workflow (toggle in top right)

## Usage

### Testing

Send a test message to your WhatsApp group:

```text
Simulasi Type 6
LB : 39
LT : 72 (6x12)
2 Kamar Tidur
1 Kamar Mandi
Harga Jual: 1.001.000.000
DP: FREE
```

Check Google Sheets - a new row should appear!

### Daily Recap

The bot automatically sends a daily recap at 8 PM with all properties added that day.

## Troubleshooting

### WhatsApp Disconnected?

```bash
curl -X GET 'http://localhost:8080/instance/connect/house-bot' \
-H 'apikey: YOUR_EVOLUTION_API_KEY'
```

Rescan QR code.

### Check Logs

```bash
docker-compose logs -f n8n
docker-compose logs -f evolution
```

### Restart Services

```bash
cd /opt/whatsapp-house-bot
docker-compose restart
```

## Access URLs

- n8n Dashboard: `http://YOUR_VPS_IP:5678`
- Evolution API: `http://YOUR_VPS_IP:8080`
