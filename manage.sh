#!/bin/bash

# Management script for Civiwork Management System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}Civiwork Management System - Docker Management${NC}"
    echo ""
    echo "Usage: ./manage.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  build     - Build Docker images"
    echo "  logs      - Show logs"
    echo "  status    - Show service status"
    echo "  shell     - Open shell in app container"
    echo "  db        - Run database commands"
    echo "  backup    - Backup database"
    echo "  restore   - Restore database"
    echo "  update    - Update and restart services"
    echo "  clean     - Clean up unused Docker resources"
    echo "  help      - Show this help message"
}

case "${1:-help}" in
    start)
        echo -e "${GREEN}🚀 Starting services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ Services started!${NC}"
        ;;
    stop)
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Services stopped!${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Services restarted!${NC}"
        ;;
    build)
        echo -e "${GREEN}🔨 Building images...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✅ Images built!${NC}"
        ;;
    logs)
        docker-compose logs -f
        ;;
    status)
        echo -e "${BLUE}📊 Service Status:${NC}"
        docker-compose ps
        ;;
    shell)
        echo -e "${GREEN}🐚 Opening shell in app container...${NC}"
        docker-compose exec app sh
        ;;
    db)
        case "${2:-help}" in
            migrate)
                echo -e "${GREEN}🗄️  Running migrations...${NC}"
                docker-compose exec app npx prisma migrate deploy
                ;;
            generate)
                echo -e "${GREEN}🔧 Generating Prisma client...${NC}"
                docker-compose exec app npx prisma generate
                ;;
            seed)
                echo -e "${GREEN}🌱 Seeding database...${NC}"
                docker-compose exec app npm run prisma:seed
                ;;
            reset)
                echo -e "${RED}⚠️  Resetting database...${NC}"
                docker-compose exec app npx prisma migrate reset --force
                ;;
            studio)
                echo -e "${GREEN}🎨 Opening Prisma Studio...${NC}"
                docker-compose exec app npx prisma studio
                ;;
            *)
                echo "Database commands: migrate, generate, seed, reset, studio"
                ;;
        esac
        ;;
    backup)
        echo -e "${GREEN}💾 Creating database backup...${NC}"
        timestamp=$(date +%Y%m%d_%H%M%S)
        docker-compose exec app npx prisma db pull --schema=./prisma/backup-schema.prisma
        echo -e "${GREEN}✅ Backup created: backup_${timestamp}.sql${NC}"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please provide backup file path${NC}"
            exit 1
        fi
        echo -e "${GREEN}📥 Restoring database from $2...${NC}"
        docker-compose exec -T app psql $DATABASE_URL < "$2"
        echo -e "${GREEN}✅ Database restored!${NC}"
        ;;
    update)
        echo -e "${GREEN}🔄 Updating services...${NC}"
        git pull
        docker-compose build --no-cache
        docker-compose up -d
        docker-compose exec app npx prisma migrate deploy
        echo -e "${GREEN}✅ Services updated!${NC}"
        ;;
    clean)
        echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
        docker system prune -f
        docker volume prune -f
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
        ;;
    help|*)
        show_help
        ;;
esac
