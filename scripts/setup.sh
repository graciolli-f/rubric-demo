#!/bin/bash

# Create directory structure
echo "Setting up Rubric demo project structure..."

# Create core directories
mkdir -p packages/validate/src/core
mkdir -p packages/validate/src/presets
mkdir -p packages/validate/dist
mkdir -p demo/src/app
mkdir -p demo/src/components/demo
mkdir -p demo/src/components/ui

# Move core files to correct location
echo "Organizing files..."

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.nyc_output

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Editor
.vscode
.idea
*.swp
*.swo

# Next.js
.next
out

# TypeScript
*.tsbuildinfo

# Cache
.eslintcache
.cache
EOF

echo "Installing dependencies..."
npm install

echo "Building validation package..."
cd packages/validate && npm install && npm run build && cd ../..

echo "Setup complete! Run 'npm run dev' to start the demo."