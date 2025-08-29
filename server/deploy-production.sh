#!/bin/bash

# Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the server directory."
    exit 1
fi

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
    print_warning "NODE_ENV not set, defaulting to production"
fi

# Step 1: Build the application
print_status "Step 1: Building application..."
./build-production.sh

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

# Step 2: Fix database schema issues
print_status "Step 2: Fixing database schema issues..."
if command -v psql &> /dev/null; then
    psql $DATABASE_URL -f fix-production-db.sql
    print_status "Database schema fixes applied"
else
    print_warning "psql not found, skipping database fixes. Please run manually:"
    print_warning "npm run db:fix-production"
fi

# Step 3: Stop existing PM2 process if running
print_status "Step 3: Stopping existing PM2 process..."
if pm2 list | grep -q "leadflow-server"; then
    pm2 stop leadflow-server
    pm2 delete leadflow-server
    print_status "Existing PM2 process stopped"
else
    print_status "No existing PM2 process found"
fi

# Step 4: Start new PM2 process
print_status "Step 4: Starting new PM2 process..."
pm2 start dist/index.js --name "leadflow-server" --env production

if [ $? -ne 0 ]; then
    print_error "Failed to start PM2 process"
    exit 1
fi

# Step 5: Save PM2 configuration
print_status "Step 5: Saving PM2 configuration..."
pm2 save

# Step 6: Wait a moment for the server to start
print_status "Step 6: Waiting for server to start..."
sleep 5

# Step 7: Check server health
print_status "Step 7: Checking server health..."
if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health || echo "FAILED")
    if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
        print_status "✅ Server is healthy!"
        echo "Health check response: $HEALTH_RESPONSE"
    else
        print_warning "⚠️  Health check failed or server not responding"
        print_warning "Check PM2 logs: pm2 logs leadflow-server"
    fi
else
    print_warning "curl not found, skipping health check"
fi

# Step 8: Show deployment summary
print_status "Step 8: Deployment summary..."
echo ""
echo "🎉 Production deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Application built successfully"
echo "   • Database schema fixes applied"
echo "   • PM2 process started"
echo "   • Configuration saved"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: pm2 logs leadflow-server"
echo "   • Check status: pm2 status"
echo "   • Restart: pm2 restart leadflow-server"
echo "   • Health check: curl http://localhost:3000/health"
echo ""
echo "🌐 Server should be accessible at:"
echo "   • Local: http://localhost:3000"
echo "   • Health: http://localhost:3000/health"
echo "" 