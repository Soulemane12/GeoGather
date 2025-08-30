#!/bin/bash

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Reinstalling dependencies..."
npm install

echo "🚀 Starting development server..."
npm run dev
