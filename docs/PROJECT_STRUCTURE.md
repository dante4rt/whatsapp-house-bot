# Project Structure Overview

```text
whatsapp-house-bot/
├── docs/                           # Documentation
│   ├── developers/                  # Technical documentation
│   │   └── README.md              # Developer guide
│   ├── users/                      # User documentation
│   │   ├── README.md              # User guide
│   │   └── quick-start.md         # Quick start guide
│   └── PROJECT_STRUCTURE.md        # This file
├── scripts/                        # Extracted JavaScript code
│   ├── extract-message-data.js      # Process WhatsApp messages
│   ├── parse-gemini-response.js     # Parse AI responses
│   └── create-recap-message.js     # Generate daily summaries
├── docker-compose.yml              # Docker service configuration
├── n8n-workflow.json              # n8n workflow (references external JS files)
├── setup.sh                       # Automated setup script
├── git_setup.sh                   # Git initialization script
├── .env.example                   # Environment variables template
└── README.md                      # Main project README
```

## Key Changes Made

### 1. Documentation Organization

- **Main README.md**: Clean, concise project overview
- **docs/users/**: User-friendly guides and tutorials
- **docs/developers/**: Technical documentation and architecture

### 2. Code Extraction

- JavaScript code extracted from `n8n-workflow.json` to separate `.js` files
- Code is now maintainable, testable, and versionable
- Main `n8n-workflow.json` now references external JavaScript files

### 3. Improved Structure

- Clear separation of concerns
- Logical grouping of related files
- Better navigation and understanding

## Benefits

1. **Maintainability**: JavaScript code is now in separate, versionable files
2. **Readability**: Cleaner project structure with clear documentation
3. **Collaboration**: Easier for multiple developers to work on different components
4. **Testing**: Individual JavaScript modules can be tested independently
5. **Documentation**: Comprehensive docs for both users and developers

## Migration Notes

- Original `n8n-workflow.json` is preserved for backward compatibility
- New `n8n-workflow-refactored.json` uses external JavaScript files
- Scripts are located in `/scripts/` directory relative to the project root
- When using the refactored workflow, ensure the scripts directory is accessible to n8n container
