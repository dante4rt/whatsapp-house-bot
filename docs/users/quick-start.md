# Quick Start Guide - 15 Minute Setup

## Step 1: Upload Files to VPS (2 minutes)

```bash
# On your local computer
scp -r /Users/dantezy/whatsapp-house-bot root@YOUR_VPS_IP:/opt/
```

Or manually copy paste:

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Create folder
mkdir -p /opt/whatsapp-bot
cd /opt/whatsapp-bot

# Copy paste the contents of setup.sh, docker-compose.yml, etc.
```

---

## Step 2: Run Setup Script (5 minutes)

```bash
cd /opt/whatsapp-bot
chmod +x setup.sh
./setup.sh
```

The script will automatically:

- Install Docker & Docker Compose
- Generate API key
- Setup firewall
- Display all required info

---

## Step 3: Add Gemini API Key (2 minutes)

1. Open <https://aistudio.google.com/apikey>
2. Click "Create API Key"
3. Copy API key

```bash
# Edit .env file
nano /opt/whatsapp-bot/.env

# Replace YOUR_GEMINI_API_KEY_HERE with your API key
```

---

## Step 4: Start Services (1 minute)

```bash
cd /opt/whatsapp-bot
docker-compose up -d

# Wait 30 seconds, check status
docker-compose ps
```

---

## Step 5: Connect WhatsApp (3 minutes)

```bash
# Create WhatsApp instance
curl -X POST 'http://localhost:8080/instance/create' \
-H 'Content-Type: application/json' \
-H 'apikey: YOUR_EVOLUTION_API_KEY' \
-d '{"instanceName": "house-bot", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
```

Open browser:

```text
http://YOUR_VPS_IP:8080/instance/connect/house-bot
```

Scan QR code with your WhatsApp.

---

## Step 6: Setup Webhook (1 minute)

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

---

## Step 7: Setup Google Sheets (3 minutes)

1. Create new Google Sheet: <https://sheets.google.com>
2. Rename Sheet1 to "Properties"
3. Add headers in Row 1:

```text
Timestamp | Date | Sender | Property Name | Developer | LB (m2) | LT (m2) | Bedrooms | Bathrooms | Price | DP | Monthly | Video URL | Location | Notes
```

1. Copy Sheet ID from URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

---

## Step 8: Import Workflow to n8n (2 minutes)

1. Open n8n: `http://YOUR_VPS_IP:5678`
2. Login: admin / HouseBot2024!
3. Click "Add Workflow" → Menu (⋮) → "Import from File"
4. Upload `n8n-workflow.json`

---

## Step 9: Configure Workflow

### Setup Google Sheets Credential

1. In n8n, click Settings (⚙️) → Credentials
2. Add Credential → Google Sheets API
3. Select "Service Account"
4. Paste JSON from Google Cloud Console
5. Save

### Update Workflow Values

1. Open workflow "WhatsApp House Bot"
2. Click node "Save to Google Sheets"
   - Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID
   - Select Google Sheets credential

3. Click node "Read All Properties"
   - Replace with the same Sheet ID
   - Select credential

4. Click node "Send Recap to WhatsApp"
   - Replace `YOUR_GROUP_JID_HERE` with your Group JID

### Get Group JID

```bash
curl -X GET 'http://localhost:8080/group/fetchAllGroups/house-bot?getParticipants=false' \
-H 'apikey: YOUR_EVOLUTION_API_KEY'
```

Find group "Bandung kuy", copy the `id` value (example: `120363123456789@g.us`)

---

## Step 10: Activate Workflow

1. In n8n, open workflow
2. Click "Active" toggle in top right
3. Done!

---

## Test

Send this message to the WhatsApp group:

```text
Simulasi Type 6
LB : 39
LT : 72 (6x12)
2 Kamar Tidur
1 Kamar Mandi
Harga Jual: 1.001.000.000
DP: FREE
```

Check Google Sheets - there should be a new row!

---

## Summary - What Needs to be Replaced

| Placeholder | Example |
| ------------- | -------- |
| YOUR_VPS_IP | 103.123.456.789 |
| YOUR_EVOLUTION_API_KEY | abc123def456... |
| YOUR_GEMINI_API_KEY | AIzaSy... |
| YOUR_GOOGLE_SHEET_ID_HERE | 1BxiMVs0XRA5nFMdKvBd... |
| YOUR_GROUP_JID_HERE | <120363123456789@g.us> |

---

## Troubleshooting

### WhatsApp Disconnect?

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
cd /opt/whatsapp-bot
docker-compose restart
```
