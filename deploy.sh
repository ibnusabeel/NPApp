#!/bin/bash
set -e

# ============================================
#  NPApp Deploy Script
#  /www/wwwroot/npapp
# ============================================

APP_DIR="/www/wwwroot/npapp"
PM2_USER="www"
BRANCH="${1:-main}"

echo "🚀 Deploying NPApp..."
echo "   branch : $BRANCH"
echo "   dir    : $APP_DIR"
echo ""

cd "$APP_DIR"

# 1. Pull latest code
echo "📦 git pull origin $BRANCH..."
sudo -u "$PM2_USER" git fetch origin
sudo -u "$PM2_USER" git reset --hard "origin/$BRANCH"
echo ""

# 2. Install dependencies
echo "📦 npm install..."
sudo -u "$PM2_USER" npm install --production=false
echo ""

# 3. Build
echo "🏗️  npm run build..."
sudo -u "$PM2_USER" npm run build
echo ""

# 4. Reload env & restart PM2
echo "🔄 Restarting PM2..."
sudo -u "$PM2_USER" pm2 restart npapp --update-env
echo ""

# 5. Save PM2 list
sudo -u "$PM2_USER" pm2 save

# 6. Health check
sleep 5
echo ""
echo "🔍 Health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 2>/dev/null || echo "000")
SLIP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/slipcheck 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ /            → $HTTP_CODE"
else
    echo "   ❌ /            → $HTTP_CODE"
fi

if [ "$SLIP_CODE" = "200" ]; then
    echo "   ✅ /slipcheck   → $SLIP_CODE"
else
    echo "   ❌ /slipcheck   → $SLIP_CODE"
fi

echo ""
echo "✅ Deploy complete!"
