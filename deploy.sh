#!/bin/bash
set -e

# ============================================
#  NPApp Deploy Script
#  /www/wwwroot/npapp
# ============================================
#
#  Usage:
#    ./deploy.sh           deploy (build + restart only)
#    ./deploy.sh --pull     git pull + build + restart
#    ./deploy.sh main       git pull main branch + build + restart
# ============================================

APP_DIR="/www/wwwroot/npapp"
PM2_USER="www"
DO_PULL=false

# Parse args
if [ "$1" = "--pull" ]; then
    DO_PULL=true
elif [ -n "$1" ]; then
    DO_PULL=true
    BRANCH="$1"
fi

echo "🚀 Deploying NPApp..."
echo "   dir    : $APP_DIR"
echo ""

cd "$APP_DIR"

# 1. Git pull (optional)
if [ "$DO_PULL" = true ]; then
    echo "📦 git pull origin ${BRANCH:-main}..."
    sudo -u "$PM2_USER" git fetch origin
    sudo -u "$PM2_USER" git reset --hard "origin/${BRANCH:-main}" || {
        echo "⚠️  Git pull failed — continuing with local code"
    }
    echo ""
fi

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
