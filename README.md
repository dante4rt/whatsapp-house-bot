# WhatsApp House Hunting Bot - Complete Setup Guide

Bot untuk merekap informasi properti/rumah dari grup WhatsApp ke Google Sheets menggunakan n8n + Evolution API + Gemini AI.

## Architecture Overview

```text
WhatsApp Group ──► Evolution API ──► n8n ──► Gemini AI ──► Google Sheets
      ▲                                          │
      └──────────── Daily Recap ◄────────────────┘
```

## Prerequisites

- VPS dengan minimal 2GB RAM, 2 CPU cores
- Ubuntu 20.04/22.04 atau Debian 11/12
- Domain (opsional, untuk HTTPS)
- Akun Google (untuk Sheets & Gemini API)
- Nomor WhatsApp yang akan dijadikan bot

---

## PHASE 1: VPS SETUP

### Step 1.1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 1.2: Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano htop
```

### Step 1.3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Start Docker service
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
```

### Step 1.4: Install Docker Compose

```bash
# Download Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### Step 1.5: Create Project Directory

```bash
mkdir -p /opt/whatsapp-bot
cd /opt/whatsapp-bot
```

### Step 1.6: Create Docker Compose File

```bash
nano docker-compose.yml
```

Paste this content:

```yaml
version: "3.8"

services:
  # ============================================
  # N8N - Workflow Automation
  # ============================================
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
      - WEBHOOK_URL=http://YOUR_VPS_IP:5678/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=YourSecurePassword123!
      - GENERIC_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - bot-network

  # ============================================
  # Evolution API - WhatsApp Gateway (FREE)
  # ============================================
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://YOUR_VPS_IP:8080
      - AUTHENTICATION_API_KEY=your-evolution-api-key-here
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - QRCODE_LIMIT=10
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_URL=
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
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
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - postgres
    networks:
      - bot-network

  # ============================================
  # PostgreSQL - Database for Evolution API
  # ============================================
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

  # ============================================
  # Redis - Cache (optional but recommended)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always
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
```

**IMPORTANT: Replace these values:**

- `YOUR_VPS_IP` → Your actual VPS IP address
- `YourSecurePassword123!` → Your secure password for n8n
- `your-evolution-api-key-here` → Generate a random API key (e.g., use `openssl rand -hex 32`)

### Step 1.7: Generate Secure API Key

```bash
# Generate random API key for Evolution
openssl rand -hex 32
```

Copy the output and replace `your-evolution-api-key-here` in docker-compose.yml

### Step 1.8: Start All Services

```bash
cd /opt/whatsapp-bot
docker-compose up -d
```

### Step 1.9: Verify Services Running

```bash
docker-compose ps
```

Expected output:

```text
NAME            STATUS
evolution-api   Up
n8n             Up
postgres        Up
redis           Up
```

### Step 1.10: Configure Firewall

```bash
# Allow required ports
ufw allow 22/tcp    # SSH
ufw allow 5678/tcp  # n8n
ufw allow 8080/tcp  # Evolution API
ufw enable
```

### Step 1.11: Access Web Interfaces

- **n8n**: http://YOUR_VPS_IP:5678

  - Login: admin / YourSecurePassword123!

- **Evolution API**: http://YOUR_VPS_IP:8080

---

## PHASE 2: CONNECT WHATSAPP

### Step 2.1: Create WhatsApp Instance

Using curl (run from VPS terminal):

```bash
curl -X POST 'http://localhost:8080/instance/create' \
-H 'Content-Type: application/json' \
-H 'apikey: your-evolution-api-key-here' \
-d '{
  "instanceName": "house-bot",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}'
```

### Step 2.2: Get QR Code

```bash
curl -X GET 'http://localhost:8080/instance/connect/house-bot' \
-H 'apikey: your-evolution-api-key-here'
```

Or open in browser:

```text
http://YOUR_VPS_IP:8080/instance/connect/house-bot?apikey=your-evolution-api-key-here
```

### Step 2.3: Scan QR Code

1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices > Link a Device
3. Scan the QR code displayed

### Step 2.4: Verify Connection

```bash
curl -X GET 'http://localhost:8080/instance/connectionState/house-bot' \
-H 'apikey: your-evolution-api-key-here'
```

Expected response:

```json
{
  "instance": "house-bot",
  "state": "open"
}
```

### Step 2.5: Set Webhook for n8n

```bash
curl -X POST 'http://localhost:8080/webhook/set/house-bot' \
-H 'Content-Type: application/json' \
-H 'apikey: your-evolution-api-key-here' \
-d '{
  "webhook": {
    "enabled": true,
    "url": "http://n8n:5678/webhook/whatsapp-incoming",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }
}'
```

---

## PHASE 3: SETUP GOOGLE SHEETS

### Step 3.1: Create Google Sheet

1. Go to <https://sheets.google.com>
2. Create new spreadsheet
3. Name it: "House Hunting Database"

### Step 3.2: Create Sheet Structure

**Sheet 1: "Properties"** (rename Sheet1)

Add these headers in Row 1:

| A         | B    | C      | D             | E         | F       | G       | H        | I         | J     | K   | L       | M         | N        | O     |
| --------- | ---- | ------ | ------------- | --------- | ------- | ------- | -------- | --------- | ----- | --- | ------- | --------- | -------- | ----- |
| Timestamp | Date | Sender | Property Name | Developer | LB (m2) | LT (m2) | Bedrooms | Bathrooms | Price | DP  | Monthly | Video URL | Location | Notes |

### Step 3.3: Create Google Cloud Project

1. Go to <https://console.cloud.google.com>
2. Create new project: "WhatsApp House Bot"
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

### Step 3.4: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: "n8n-sheets-access"
4. Click "Create and Continue"
5. Role: "Editor"
6. Click "Done"

### Step 3.5: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. "Add Key" > "Create new key"
4. Choose JSON
5. Download the file (save as `google-credentials.json`)

### Step 3.6: Share Sheet with Service Account

1. Open your Google Sheet
2. Click "Share"
3. Add the service account email (looks like: `n8n-sheets-access@your-project.iam.gserviceaccount.com`)
4. Give "Editor" permission
5. Click "Share"

---

## PHASE 4: SETUP GEMINI AI (FREE)

### Step 4.1: Get Gemini API Key

1. Go to <https://aistudio.google.com/apikey>
2. Click "Create API Key"
3. Select your project or create new
4. Copy the API key

### Step 4.2: Test Gemini API

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "contents": [{
    "parts":[{"text": "Hello, respond with OK if you receive this"}]
  }]
}'
```

---

## PHASE 5: CREATE N8N WORKFLOW

### Step 5.1: Open n8n

Go to: http://YOUR_VPS_IP:5678

Login with your credentials.

### Step 5.2: Create Credentials in n8n

### Google Sheets Credential

1. Go to Settings (gear icon) > Credentials
2. Click "Add Credential"
3. Search "Google Sheets"
4. Select "Service Account"
5. Paste the content of your `google-credentials.json`
6. Save as "Google Sheets - House Bot"

### HTTP Header Auth (for Gemini)

1. Add new credential
2. Search "Header Auth"
3. Name: "Gemini API"
4. Parameter name: `x-goog-api-key` (we'll use query param instead)
5. Save

### Step 5.3: Import Workflow

1. Click "Add Workflow"
2. Click menu (three dots) > "Import from File"
3. Import the `n8n-workflow.json` file (see below)

---

## PHASE 6: N8N WORKFLOW JSON

Save this as `n8n-workflow.json` and import to n8n:

````json
{
  "name": "WhatsApp House Bot",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-incoming",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "WhatsApp Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "whatsapp-incoming"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "condition-group-chat",
              "leftValue": "={{ $json.data.key.remoteJid }}",
              "rightValue": "@g.us",
              "operator": {
                "type": "string",
                "operation": "contains"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "filter-group",
      "name": "Filter Group Only",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": false,
            "leftValue": "",
            "typeValidation": "loose"
          },
          "conditions": [
            {
              "id": "has-message",
              "leftValue": "={{ $json.data.message }}",
              "rightValue": "",
              "operator": {
                "type": "object",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "filter-message",
      "name": "Has Message Content",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 240]
    },
    {
      "parameters": {
        "jsCode": "// Extract message data from Evolution API webhook\nconst input = $input.first().json;\n\nlet messageText = '';\nlet messageType = 'text';\nlet mediaUrl = '';\n\nconst data = input.data || input;\nconst message = data.message || {};\n\n// Extract text from different message types\nif (message.conversation) {\n  messageText = message.conversation;\n} else if (message.extendedTextMessage) {\n  messageText = message.extendedTextMessage.text || '';\n  // Check for URLs\n  if (message.extendedTextMessage.matchedText) {\n    mediaUrl = message.extendedTextMessage.matchedText;\n  }\n} else if (message.imageMessage) {\n  messageType = 'image';\n  messageText = message.imageMessage.caption || '[Image]';\n} else if (message.videoMessage) {\n  messageType = 'video';\n  messageText = message.videoMessage.caption || '[Video]';\n} else if (message.documentMessage) {\n  messageType = 'document';\n  messageText = message.documentMessage.fileName || '[Document]';\n}\n\n// Extract sender info\nconst remoteJid = data.key?.remoteJid || '';\nconst participant = data.key?.participant || data.key?.remoteJid || '';\nconst pushName = data.pushName || 'Unknown';\n\n// Extract URLs from message\nconst urlRegex = /(https?:\\/\\/[^\\s]+)/gi;\nconst urls = messageText.match(urlRegex) || [];\n\n// Check if message is property-related\nconst propertyKeywords = [\n  'rumah', 'house', 'properti', 'property',\n  'harga', 'price', 'jual', 'dp', 'cicilan',\n  'lb', 'lt', 'luas', 'kamar', 'km', 'kt',\n  'cluster', 'type', 'tipe', 'subsidi',\n  'kredit', 'kpr', 'booking'\n];\n\nconst isPropertyRelated = propertyKeywords.some(keyword => \n  messageText.toLowerCase().includes(keyword)\n) || urls.some(url => \n  url.includes('tiktok') || \n  url.includes('youtube') || \n  url.includes('instagram')\n);\n\nreturn {\n  timestamp: new Date().toISOString(),\n  date: new Date().toLocaleDateString('id-ID'),\n  sender: pushName,\n  senderJid: participant,\n  groupJid: remoteJid,\n  messageType: messageType,\n  messageText: messageText,\n  urls: urls,\n  hasUrl: urls.length > 0,\n  isPropertyRelated: isPropertyRelated,\n  rawMessage: message\n};"
      },
      "id": "extract-data",
      "name": "Extract Message Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 240]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "is-property",
              "leftValue": "={{ $json.isPropertyRelated }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "filter-property",
      "name": "Is Property Related?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1120, 240]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"contents\": [{\n    \"parts\": [{\n      \"text\": \"Kamu adalah asisten yang mengekstrak informasi properti dari pesan WhatsApp dalam bahasa Indonesia.\\n\\nAnalisis pesan berikut dan ekstrak informasi properti. Kembalikan HANYA dalam format JSON yang valid, tanpa markdown atau penjelasan lain.\\n\\nPesan:\\n{{ $json.messageText }}\\n\\n{{ $json.hasUrl ? 'URL ditemukan: ' + $json.urls.join(', ') : '' }}\\n\\nKembalikan JSON dengan struktur ini (isi dengan string kosong jika tidak ada info):\\n{\\n  \\\"property_name\\\": \\\"\\\",\\n  \\\"developer\\\": \\\"\\\",\\n  \\\"lb\\\": \\\"\\\",\\n  \\\"lt\\\": \\\"\\\",\\n  \\\"bedrooms\\\": \\\"\\\",\\n  \\\"bathrooms\\\": \\\"\\\",\\n  \\\"price\\\": \\\"\\\",\\n  \\\"dp\\\": \\\"\\\",\\n  \\\"monthly\\\": \\\"\\\",\\n  \\\"video_url\\\": \\\"\\\",\\n  \\\"location\\\": \\\"\\\",\\n  \\\"notes\\\": \\\"\\\"\\n}\\n\\nPetunjuk ekstraksi:\\n- LB = Luas Bangunan (dalam m2)\\n- LT = Luas Tanah (dalam m2)\\n- Kamar Tidur/KT = bedrooms\\n- Kamar Mandi/KM = bathrooms\\n- Harga/Price = price (dalam Rupiah)\\n- DP = Down Payment\\n- Cicilan = monthly\\n- Link TikTok/YouTube/Instagram = video_url\\n- Nama cluster/perumahan = property_name\\n- Nama developer = developer\"\n    }]\n  }],\n  \"generationConfig\": {\n    \"temperature\": 0.1,\n    \"maxOutputTokens\": 1024\n  }\n}"
      },
      "id": "gemini-extract",
      "name": "Gemini AI Extract",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 180]
    },
    {
      "parameters": {
        "jsCode": "// Parse Gemini response and combine with original data\nconst input = $input.first().json;\nconst originalData = $('Extract Message Data').first().json;\n\nlet extractedData = {\n  property_name: '',\n  developer: '',\n  lb: '',\n  lt: '',\n  bedrooms: '',\n  bathrooms: '',\n  price: '',\n  dp: '',\n  monthly: '',\n  video_url: '',\n  location: '',\n  notes: ''\n};\n\ntry {\n  // Get text from Gemini response\n  const responseText = input.candidates?.[0]?.content?.parts?.[0]?.text || '';\n  \n  // Extract JSON from response (handle markdown code blocks)\n  let jsonStr = responseText;\n  \n  // Remove markdown code blocks if present\n  const jsonMatch = responseText.match(/```(?:json)?\\s*([\\s\\S]*?)```/);\n  if (jsonMatch) {\n    jsonStr = jsonMatch[1].trim();\n  }\n  \n  // Parse JSON\n  extractedData = JSON.parse(jsonStr);\n} catch (error) {\n  extractedData.notes = 'Failed to parse: ' + originalData.messageText.substring(0, 100);\n}\n\n// If no video_url extracted but we have URLs, use the first one\nif (!extractedData.video_url && originalData.urls.length > 0) {\n  const videoUrl = originalData.urls.find(url => \n    url.includes('tiktok') || \n    url.includes('youtube') || \n    url.includes('youtu.be') ||\n    url.includes('instagram')\n  );\n  if (videoUrl) {\n    extractedData.video_url = videoUrl;\n  }\n}\n\nreturn {\n  timestamp: originalData.timestamp,\n  date: originalData.date,\n  sender: originalData.sender,\n  property_name: extractedData.property_name || '',\n  developer: extractedData.developer || '',\n  lb: extractedData.lb || '',\n  lt: extractedData.lt || '',\n  bedrooms: extractedData.bedrooms || '',\n  bathrooms: extractedData.bathrooms || '',\n  price: extractedData.price || '',\n  dp: extractedData.dp || '',\n  monthly: extractedData.monthly || '',\n  video_url: extractedData.video_url || '',\n  location: extractedData.location || '',\n  notes: extractedData.notes || '',\n  original_message: originalData.messageText\n};"
      },
      "id": "parse-gemini",
      "name": "Parse Gemini Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 180]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Properties",
          "mode": "list",
          "cachedResultName": "Properties"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Date": "={{ $json.date }}",
            "Sender": "={{ $json.sender }}",
            "Property Name": "={{ $json.property_name }}",
            "Developer": "={{ $json.developer }}",
            "LB (m2)": "={{ $json.lb }}",
            "LT (m2)": "={{ $json.lt }}",
            "Bedrooms": "={{ $json.bedrooms }}",
            "Bathrooms": "={{ $json.bathrooms }}",
            "Price": "={{ $json.price }}",
            "DP": "={{ $json.dp }}",
            "Monthly": "={{ $json.monthly }}",
            "Video URL": "={{ $json.video_url }}",
            "Location": "={{ $json.location }}",
            "Notes": "={{ $json.notes }}"
          }
        },
        "options": {}
      },
      "id": "google-sheets",
      "name": "Save to Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.4,
      "position": [1780, 180],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "YOUR_CREDENTIAL_ID",
          "name": "Google Sheets - House Bot"
        }
      }
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 24
            }
          ]
        }
      },
      "id": "daily-trigger",
      "name": "Daily Trigger (8 PM)",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 560]
    },
    {
      "parameters": {
        "operation": "read",
        "documentId": {
          "__rl": true,
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Properties",
          "mode": "list",
          "cachedResultName": "Properties"
        },
        "options": {
          "outputFormat": "json"
        }
      },
      "id": "read-sheets",
      "name": "Read Today Properties",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.4,
      "position": [460, 560],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "YOUR_CREDENTIAL_ID",
          "name": "Google Sheets - House Bot"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Filter today's properties and create recap message\nconst items = $input.all();\nconst today = new Date().toLocaleDateString('id-ID');\n\n// Filter today's entries\nconst todayProperties = items.filter(item => \n  item.json.Date === today\n);\n\nif (todayProperties.length === 0) {\n  return { hasData: false, message: '' };\n}\n\n// Build recap message\nlet message = `📊 *REKAP PROPERTI HARI INI*\\n`;\nmessage += `📅 ${today}\\n\\n`;\nmessage += `🏠 *${todayProperties.length} properti baru:*\\n\\n`;\n\ntodayProperties.forEach((prop, index) => {\n  const p = prop.json;\n  message += `━━━━━━━━━━━━━━━━\\n`;\n  message += `*${index + 1}. ${p['Property Name'] || 'Unnamed'}*\\n`;\n  if (p.Developer) message += `🏗️ Developer: ${p.Developer}\\n`;\n  if (p['LB (m2)'] || p['LT (m2)']) {\n    message += `📐 LB/LT: ${p['LB (m2)'] || '-'}/${p['LT (m2)'] || '-'} m²\\n`;\n  }\n  if (p.Bedrooms || p.Bathrooms) {\n    message += `🛏️ Kamar: ${p.Bedrooms || '-'} KT / ${p.Bathrooms || '-'} KM\\n`;\n  }\n  if (p.Price) message += `💰 Harga: ${p.Price}\\n`;\n  if (p.DP) message += `💵 DP: ${p.DP}\\n`;\n  if (p.Monthly) message += `📆 Cicilan: ${p.Monthly}\\n`;\n  if (p['Video URL']) message += `🎬 Video: ${p['Video URL']}\\n`;\n  if (p.Location) message += `📍 Lokasi: ${p.Location}\\n`;\n  message += `👤 Shared by: ${p.Sender}\\n`;\n});\n\nmessage += `\\n━━━━━━━━━━━━━━━━\\n`;\nmessage += `📋 Total tersimpan: ${items.length} properti`;\n\nreturn {\n  hasData: true,\n  message: message,\n  count: todayProperties.length\n};"
      },
      "id": "create-recap",
      "name": "Create Recap Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 560]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "has-data",
              "leftValue": "={{ $json.hasData }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check-recap",
      "name": "Has Data to Recap?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [900, 560]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=http://evolution:8080/message/sendText/house-bot",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"YOUR_GROUP_JID\",\n  \"text\": \"{{ $json.message }}\"\n}"
      },
      "id": "send-recap",
      "name": "Send Recap to WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 500]
    }
  ],
  "connections": {
    "WhatsApp Webhook": {
      "main": [
        [
          {
            "node": "Filter Group Only",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Group Only": {
      "main": [
        [
          {
            "node": "Has Message Content",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Message Content": {
      "main": [
        [
          {
            "node": "Extract Message Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Message Data": {
      "main": [
        [
          {
            "node": "Is Property Related?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Property Related?": {
      "main": [
        [
          {
            "node": "Gemini AI Extract",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gemini AI Extract": {
      "main": [
        [
          {
            "node": "Parse Gemini Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Gemini Response": {
      "main": [
        [
          {
            "node": "Save to Google Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Daily Trigger (8 PM)": {
      "main": [
        [
          {
            "node": "Read Today Properties",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Read Today Properties": {
      "main": [
        [
          {
            "node": "Create Recap Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Recap Message": {
      "main": [
        [
          {
            "node": "Has Data to Recap?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Data to Recap?": {
      "main": [
        [
          {
            "node": "Send Recap to WhatsApp",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
````

---

## PHASE 7: CONFIGURE WORKFLOW

### Step 7.1: Set Environment Variables in n8n

1. SSH to VPS
2. Edit docker-compose.yml:

```bash
nano /opt/whatsapp-bot/docker-compose.yml
```

Add these environment variables to n8n service:

```yaml
environment:
  # ... existing vars ...
  - GEMINI_API_KEY=your-gemini-api-key
  - EVOLUTION_API_KEY=your-evolution-api-key
```

Restart n8n:

```bash
cd /opt/whatsapp-bot
docker-compose up -d n8n
```

### Step 7.2: Update Workflow Values

After importing the workflow, update these values:

1. **Google Sheet ID**:

   - Open your Google Sheet
   - Copy ID from URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Replace `YOUR_GOOGLE_SHEET_ID` in nodes

2. **Group JID**:

   - Get your group JID (see below)
   - Replace `YOUR_GROUP_JID` in "Send Recap to WhatsApp" node

3. **Google Sheets Credential**:
   - Select your created credential in both Google Sheets nodes

### Step 7.3: Get Group JID

Run this curl to list your groups:

```bash
curl -X GET 'http://localhost:8080/group/fetchAllGroups/house-bot?getParticipants=false' \
-H 'apikey: your-evolution-api-key-here'
```

Find your "Bandung kuy" group and copy the `id` field (looks like: `120363xxx@g.us`)

---

## PHASE 8: TESTING

### Step 8.1: Activate Workflow

1. Open n8n (http://YOUR_VPS_IP:5678)
2. Open "WhatsApp House Bot" workflow
3. Click "Active" toggle (top right)

### Step 8.2: Test Message Processing

Send a test message to your WhatsApp group:

```text
Simulasi Type 6
LB : 39
LT : 72 (6x12)
2 Kamar Tidur
1 Kamar Mandi
Harga Jual Free PPN : 1.001.000.000
Subsidi DP : 90.100.000 (FREE)
```

Check:

1. n8n execution history (should show successful run)
2. Google Sheets (should have new row)

### Step 8.3: Test Recap

Manually trigger the recap:

1. Open the workflow
2. Click on "Daily Trigger" node
3. Click "Execute Node"

---

## PHASE 9: MONITORING & MAINTENANCE

### Check Service Status

```bash
cd /opt/whatsapp-bot
docker-compose ps
docker-compose logs -f n8n
docker-compose logs -f evolution
```

### Restart Services

```bash
docker-compose restart
```

### Update Services

```bash
docker-compose pull
docker-compose up -d
```

### Backup Data

```bash
# Backup n8n data
docker cp n8n:/home/node/.n8n ./backup/n8n-backup

# Backup database
docker exec postgres pg_dump -U postgres evolution > ./backup/evolution-backup.sql
```

---

## TROUBLESHOOTING

### WhatsApp Disconnected

```bash
# Check status
curl -X GET 'http://localhost:8080/instance/connectionState/house-bot' \
-H 'apikey: your-evolution-api-key-here'

# Reconnect (get new QR)
curl -X GET 'http://localhost:8080/instance/connect/house-bot' \
-H 'apikey: your-evolution-api-key-here'
```

### Webhook Not Receiving

```bash
# Check n8n webhook URL
curl -X POST 'http://localhost:5678/webhook/whatsapp-incoming' \
-H 'Content-Type: application/json' \
-d '{"test": true}'

# Re-set webhook
curl -X POST 'http://localhost:8080/webhook/set/house-bot' \
-H 'Content-Type: application/json' \
-H 'apikey: your-evolution-api-key-here' \
-d '{
  "webhook": {
    "enabled": true,
    "url": "http://n8n:5678/webhook/whatsapp-incoming",
    "webhookByEvents": true,
    "events": ["MESSAGES_UPSERT"]
  }
}'
```

### Gemini API Error

- Check API key is valid
- Check quota at <https://aistudio.google.com/apikey>
- Free tier: 15 requests/minute, 1500 requests/day

---

## COST SUMMARY

| Component     | Cost                    |
| ------------- | ----------------------- |
| VPS           | Your existing VPS       |
| n8n           | FREE (self-hosted)      |
| Evolution API | FREE (open source)      |
| PostgreSQL    | FREE (self-hosted)      |
| Google Sheets | FREE                    |
| Gemini AI     | FREE (15 req/min limit) |
| **Total**     | **FREE**                |

---

## NEXT STEPS (Optional Enhancements)

1. **Add Image OCR**: Process price table images using Google Vision API
2. **Add Duplicate Detection**: Check if property already exists before saving
3. **Add Search Command**: Reply "!search [keyword]" to search properties
4. **Add Web Dashboard**: Create simple web view of all properties
5. **Add Alerts**: Notify when property matches criteria (e.g., price < X)

---

Created for WhatsApp House Hunting Bot
Using: n8n + Evolution API + Gemini AI + Google Sheets
