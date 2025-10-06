#!/bin/bash
# Quick script to run import after updating API token

echo "🔍 Checking if Strapi is running..."
if ! docker ps | grep -q "perfume-backend"; then
  echo "❌ Backend container is not running"
  echo "Run: docker-compose up -d"
  exit 1
fi

echo "📦 Running import script..."
docker-compose exec backend npm run import

echo ""
echo "If you see 401 errors:"
echo "1. Go to http://kioskapi.gandom-perfume.ir:1337/admin"
echo "2. Settings → API Tokens → Create new token (Full access)"
echo "3. Copy token to .env file: API_TOKEN=your-token-here"
echo "4. Run: docker-compose restart"
echo "5. Run this script again"
