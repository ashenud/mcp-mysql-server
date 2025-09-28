#!/bin/bash

# Publish script for MySQL MCP Server

echo "🚀 Publishing MySQL MCP Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed. Please fix the errors and try again."
    exit 1
fi

# Run tests (if any)
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Error: Tests failed. Please fix the errors and try again."
    exit 1
fi

# Check if version needs to be updated
echo "📋 Current version: $(npm pkg get version | tr -d '\"')"
read -p "Do you want to update the version? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter new version (patch/minor/major or specific version): " version
    npm version $version
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo "✅ Successfully published MySQL MCP Server!"
    echo "📦 Package: @ashenud/mcp-mysql-server"
    echo "🌐 Install with: npm install -g @ashenud/mcp-mysql-server"
else
    echo "❌ Error: Failed to publish. Please check the errors above."
    exit 1
fi
