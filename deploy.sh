#!/bin/bash
set -e

echo "🏠 Deploying WhatsApp House Bot..."

docker compose down -v 2>/dev/null || true
docker compose build whatsapp
docker compose up -d

echo ""
echo "✅ Started! View QR code with:"
echo "docker logs whatsapp-bot -f"
echo ""
echo "n8n: http://YOUR_IP:5678"
