# WhatsApp House Bot

A WhatsApp bot that automatically extracts property information from group messages and saves them to Google Sheets using AI.

## Features

- 🤖 Automated property extraction from WhatsApp messages
- 📊 Store structured data in Google Sheets
- 🧠 AI-powered information extraction with Gemini
- 📈 Daily property recap messages
- 🔧 Easy deployment with Docker

## Quick Start

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your values
3. Run the setup script: `./setup.sh`
4. Start services: `docker-compose up -d`
5. Connect WhatsApp and import the workflow

## Architecture

```text
WhatsApp Group → Evolution API → n8n → Gemini AI → Google Sheets
                                      ↑
                                      └── Daily Recap ←────────┘
```

## Documentation

- [User Guide](docs/users/README.md) - Setup and usage instructions
- [Developer Guide](docs/developers/README.md) - Technical documentation

## Project Structure

```text
├── docs/                 # Documentation
│   ├── developers/       # Technical docs
│   └── users/           # User guides
├── scripts/             # Extracted JavaScript code
├── docker-compose.yml   # Docker configuration
├── n8n-workflow.json   # n8n workflow definition
└── .env.example        # Environment variables template
```

## License

MIT
