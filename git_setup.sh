#!/bin/bash

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "Creating public repository using GitHub CLI..."
    # Create public repo and push
    gh repo create whatsapp-house-bot --public --source=. --remote=origin --push
else
    echo "GitHub CLI (gh) not found."
    echo "1. Create a repository named 'whatsapp-house-bot' on https://github.com/new"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/whatsapp-house-bot.git"
    echo "3. Run: git push -u origin main"
fi
