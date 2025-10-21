#!/bin/bash

# Deploy script for Civiwork Management System
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please update .env file with your database URL and other configurations.${NC}"
    else
        echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/civiwork" > .env
        echo -e "${YELLOW}📝 Please update .env file with your database URL.${NC}"
    fi
fi

# Build and start containers
echo -e "${GREEN}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${GREEN}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running successfully!${NC}"
    echo -e "${GREEN}🌐 Application is available at: http://localhost${NC}"
    echo -e "${GREEN}📊 Health check: http://localhost/health${NC}"
else
    echo -e "${RED}❌ Some services failed to start. Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}   1. Update nginx.conf with your domain name${NC}"
echo -e "${YELLOW}   2. Add SSL certificates to ./ssl/ directory${NC}"
echo -e "${YELLOW}   3. Configure your domain DNS to point to this server${NC}"
echo -e "${YELLOW}   4. Run 'docker-compose logs -f' to view logs${NC}"
