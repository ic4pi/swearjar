#!/bin/bash

echo "🚀 Deploying Zachariah Tippett Website..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Preparing for deployment...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed. dist directory not created.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully!${NC}"

# Backend setup
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

# Install backend dependencies
npm install

echo -e "${GREEN}✅ Backend dependencies installed!${NC}"

# Create production environment file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file for backend...${NC}"
    cat > .env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
EOF
    echo -e "${GREEN}✅ .env file created with random JWT secret${NC}"
fi

cd ..

echo -e "${YELLOW}Step 2: Deployment Instructions${NC}"
echo ""
echo -e "${GREEN}Backend Deployment (Render):${NC}"
echo "1. Go to https://render.com"
echo "2. Connect your GitHub repository"
echo "3. Create new Web Service"
echo "4. Use backend/ as root directory"
echo "5. Set environment variables from backend/.env"
echo "6. Deploy and copy the URL"
echo ""
echo -e "${GREEN}Frontend Deployment (Vercel):${NC}"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repository"
echo "3. Set environment variable: VITE_API_URL=https://your-backend-url.onrender.com/api"
echo "4. Deploy"
echo ""
echo -e "${YELLOW}Step 3: Update API Configuration${NC}"
echo "After deploying backend, update src/lib/api-config.ts with your Render URL"
echo ""
echo -e "${GREEN}🎉 Ready for deployment!${NC}"
