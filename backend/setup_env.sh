#!/bin/bash
# Quick setup script for .env file

cat > backend/.env << 'EOF'
# Database Configuration
MONGO_DETAILS=mongodb://localhost:27017
DB_NAME=riskly

# Authentication
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration (OPTIONAL - add your OpenAI API key here)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Security Settings
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
EOF

echo "✅ .env file created in backend/ directory"
echo "⚠️  IMPORTANT: Update SECRET_KEY and MONGO_DETAILS if needed!"

