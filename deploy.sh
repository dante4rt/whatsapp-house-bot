#!/bin/bash
set -e

[ ! -f .env ] && echo "Error: .env file not found" && exit 1
source .env
[ -z "$EVOLUTION_API_KEY" ] && echo "Error: EVOLUTION_API_KEY not set" && exit 1

echo "Deploying WhatsApp House Bot..."

docker compose down -v
docker compose pull

docker compose up -d postgres redis
sleep 30
docker exec postgres pg_isready -U postgres || exit 1
docker exec redis redis-cli ping || exit 1

docker compose up -d evolution
sleep 45
curl -sf http://localhost:8080/ > /dev/null || (echo "Evolution API failed to start" && exit 1)

docker compose up -d n8n
sleep 20

echo "Creating WhatsApp instance..."
curl -sX POST http://localhost:8080/instance/create \
  -H 'Content-Type: application/json' \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"instanceName":"house-bot","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'

echo -e "\n\nGet QR code:"
echo "curl -s http://localhost:8080/instance/connect/house-bot -H 'apikey: $EVOLUTION_API_KEY'"
echo -e "\nn8n: http://localhost:5678 (admin/check docker-compose.yml for password)"
