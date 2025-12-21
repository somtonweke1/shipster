#!/bin/bash

echo "🚀 Shipster Deployment Helper"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Deployment Options:"
echo ""
echo "1. Deploy Frontend Only (Recommended for MVP)"
echo "   - Frontend on Vercel"
echo "   - Backend needs separate deployment (Railway/Render)"
echo ""
echo "2. Deploy Everything (Requires Vercel Postgres)"
echo "   - Frontend + Backend on Vercel"
echo "   - Needs Vercel Postgres setup"
echo ""
echo "3. Just build and test"
echo ""

read -p "Choose option (1/2/3): " choice

case $choice in
  1)
    echo ""
    echo "🎯 Deploying Frontend to Vercel..."
    echo ""
    echo "⚠️  Important: After deployment, you need to:"
    echo "   1. Deploy backend separately to Railway/Render"
    echo "   2. Update VITE_API_BASE in Vercel to your backend URL"
    echo ""
    read -p "Continue? (y/n): " confirm
    if [ "$confirm" == "y" ]; then
      cd frontend
      npm run build
      vercel --prod
      cd ..
    fi
    ;;
  2)
    echo ""
    echo "⚠️  Full deployment requires:"
    echo "   1. Vercel Postgres database setup"
    echo "   2. Backend migration from SQLite to Postgres"
    echo ""
    echo "This is not configured yet. Please:"
    echo "   1. Create Vercel Postgres in your dashboard"
    echo "   2. Update backend/src/db/schema.ts to use Postgres"
    echo "   3. Run this script again"
    ;;
  3)
    echo ""
    echo "🔨 Building frontend..."
    cd frontend && npm run build && cd ..
    echo "✅ Build complete! Check frontend/dist/"
    echo ""
    echo "🔨 Building backend..."
    cd backend && npm run build && cd ..
    echo "✅ Build complete! Check backend/dist/"
    ;;
  *)
    echo "Invalid option"
    ;;
esac

echo ""
echo "📖 For detailed deployment instructions, see DEPLOYMENT.md"
