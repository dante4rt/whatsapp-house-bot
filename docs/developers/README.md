# WhatsApp House Bot - Developer Guide

## Architecture Overview

The system consists of several components working together:

```text
WhatsApp Group → Evolution API → n8n → Gemini AI → Google Sheets
                                      ↑
                                      └── Daily Recap ←────────┘
```

### Components

1. **Evolution API**: WhatsApp gateway that receives messages and sends webhooks
2. **n8n**: Workflow automation platform that processes messages
3. **Gemini AI**: Google's AI model for extracting structured data from messages
4. **Google Sheets**: Database for storing property information
5. **PostgreSQL**: Database for Evolution API
6. **Redis**: Cache for Evolution API

## Project Structure

```text
├── docs/                 # Documentation
│   ├── developers/       # Technical docs
│   └── users/           # User guides
├── scripts/             # Extracted JavaScript code
│   ├── extract-message-data.js
│   ├── parse-gemini-response.js
│   └── create-recap-message.js
├── docker-compose.yml   # Docker configuration
├── n8n-workflow.json   # n8n workflow definition
├── setup.sh            # Automated setup script
└── .env.example        # Environment variables template
```

## Code Organization

### JavaScript Modules

The JavaScript code has been extracted from the n8n workflow JSON into separate modules:

1. **extract-message-data.js**: Processes incoming WhatsApp messages
2. **parse-gemini-response.js**: Parses AI responses and structures data
3. **create-recap-message.js**: Generates daily summary messages

### Environment Variables

Key environment variables in `.env`:

- `EVOLUTION_API_KEY`: Authentication for Evolution API
- `GEMINI_API_KEY`: Google Gemini AI API key
- `VPS_IP`: Server IP address
- `N8N_PASSWORD`: Admin password for n8n

## API Endpoints

### Evolution API

- Create instance: `POST /instance/create`
- Connect WhatsApp: `GET /instance/connect/{instanceName}`
- Set webhook: `POST /webhook/set/{instanceName}`
- Send message: `POST /message/sendText/{instanceName}`
- Get groups: `GET /group/fetchAllGroups/{instanceName}`

### n8n Webhooks

- Incoming WhatsApp: `POST /webhook/whatsapp-incoming`

## Database Schema

### Google Sheets Structure

| Column        | Description                    |
| ------------- | ------------------------------ |
| Timestamp     | ISO timestamp of message       |
| Date          | Local date (ID format)         |
| Sender        | WhatsApp sender name           |
| Property Name | Property/cluster name          |
| Developer     | Developer name                 |
| LB (m2)       | Building area in square meters |
| LT (m2)       | Land area in square meters     |
| Bedrooms      | Number of bedrooms             |
| Bathrooms     | Number of bathrooms            |
| Price         | Property price                 |
| DP            | Down payment amount            |
| Monthly       | Monthly installment            |
| Video URL     | Link to property video         |
| Location      | Property location              |
| Notes         | Additional information         |

## Deployment

### Docker Services

The `docker-compose.yml` defines four main services:

1. **n8n**: Workflow automation (port 5678)
2. **evolution**: WhatsApp API gateway (port 8080)
3. **postgres**: PostgreSQL database
4. **redis**: Redis cache

### Setup Process

1. System updates and Docker installation
2. Generate secure API keys
3. Configure firewall rules
4. Start all services
5. Connect WhatsApp instance
6. Configure n8n workflow

## Development Workflow

### Modifying JavaScript Code

1. Edit files in `scripts/` directory
2. Update n8n workflow to reference external files
3. Test workflow in n8n interface
4. Deploy changes

### Adding New Features

1. Create new JavaScript module in `scripts/`
2. Add corresponding nodes to n8n workflow
3. Update documentation
4. Test thoroughly

## Monitoring

### Checking Service Status

```bash
docker-compose ps
docker-compose logs -f [service-name]
```

### Health Checks

Both PostgreSQL and Redis include health checks in the Docker configuration.

## Security Considerations

1. Change default passwords
2. Use HTTPS in production
3. Restrict API access with firewall
4. Regularly update containers
5. Monitor logs for suspicious activity

## Troubleshooting

### Common Issues

1. **WhatsApp Disconnection**: Check Evolution API logs and reconnect
2. **Webhook Failures**: Verify n8n is accessible from Evolution API
3. **Gemini API Errors**: Check API key and quota limits
4. **Google Sheets Access**: Verify service account permissions

### Debug Commands

```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f n8n
docker-compose logs -f evolution

# Restart specific service
docker-compose restart n8n

# Access container shell
docker exec -it n8n sh
```

## Performance Optimization

1. Enable Redis caching for Evolution API
2. Use PostgreSQL connection pooling
3. Monitor resource usage
4. Scale horizontally if needed

## Backup Strategy

```bash
# Backup n8n data
docker cp n8n:/home/node/.n8n ./backup/n8n-backup

# Backup database
docker exec postgres pg_dump -U postgres evolution > ./backup/evolution-backup.sql
