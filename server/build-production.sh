#!/bin/bash

# Production Build Script
# This script ensures all files are properly compiled and copied for production

echo "🚀 Starting production build..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# TypeScript compilation
echo "🔨 Compiling TypeScript..."
npm run check

# Build the application
echo "🏗️ Building application..."
npm run build

# Verify build output
echo "✅ Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed: dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/shared" ]; then
    echo "❌ Build failed: dist/shared directory not found"
    exit 1
fi

if [ ! -d "dist/migrations" ]; then
    echo "❌ Build failed: dist/migrations directory not found"
    exit 1
fi

if [ ! -f "dist/drizzle.config.ts" ]; then
    echo "❌ Build failed: dist/drizzle.config.ts not found"
    exit 1
fi

# List build output
echo "📋 Build output:"
ls -la dist/

echo "✅ Production build completed successfully!"
echo "🎯 Ready for deployment with: pm2 start dist/index.js --name 'leadflow-server'" 