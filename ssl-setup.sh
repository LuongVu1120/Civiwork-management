#!/bin/bash

# SSL Certificate Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 SSL Certificate Setup for Civiwork Management System${NC}"
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide your domain name${NC}"
    echo "Usage: ./ssl-setup.sh your-domain.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

echo -e "${GREEN}🌐 Setting up SSL for domain: ${DOMAIN}${NC}"
echo -e "${GREEN}📧 Email: ${EMAIL}${NC}"
echo ""

# Create ssl directory
mkdir -p ssl

# Method 1: Let's Encrypt with Certbot
echo -e "${YELLOW}📋 Choose SSL certificate method:${NC}"
echo "1) Let's Encrypt (Free, automatic renewal)"
echo "2) Self-signed certificate (Development only)"
echo "3) Upload your own certificates"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}🔐 Setting up Let's Encrypt certificate...${NC}"
        
        # Install certbot if not installed
        if ! command -v certbot &> /dev/null; then
            echo -e "${YELLOW}📦 Installing certbot...${NC}"
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot
            elif command -v yum &> /dev/null; then
                sudo yum install -y certbot
            else
                echo -e "${RED}❌ Please install certbot manually${NC}"
                exit 1
            fi
        fi
        
        # Stop nginx temporarily
        docker-compose stop nginx
        
        # Get certificate
        sudo certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive
        
        # Copy certificates
        sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ssl/cert.pem
        sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ssl/key.pem
        sudo chown $(whoami):$(whoami) ssl/cert.pem ssl/key.pem
        
        # Update nginx.conf with domain
        sed -i "s/your-domain.com/${DOMAIN}/g" nginx.conf
        
        echo -e "${GREEN}✅ Let's Encrypt certificate installed!${NC}"
        echo -e "${YELLOW}📝 Don't forget to set up automatic renewal:${NC}"
        echo "   sudo crontab -e"
        echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
        ;;
    2)
        echo -e "${YELLOW}🔐 Creating self-signed certificate...${NC}"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=Civiwork/OU=IT/CN=${DOMAIN}"
        
        # Update nginx.conf with domain
        sed -i "s/your-domain.com/${DOMAIN}/g" nginx.conf
        
        echo -e "${GREEN}✅ Self-signed certificate created!${NC}"
        echo -e "${YELLOW}⚠️  Note: Browsers will show security warning for self-signed certificates${NC}"
        ;;
    3)
        echo -e "${YELLOW}📁 Please place your certificates in the ssl/ directory:${NC}"
        echo "   - ssl/cert.pem (certificate file)"
        echo "   - ssl/key.pem (private key file)"
        echo ""
        echo -e "${YELLOW}After placing the files, run:${NC}"
        echo "   docker-compose restart nginx"
        
        # Update nginx.conf with domain
        sed -i "s/your-domain.com/${DOMAIN}/g" nginx.conf
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 SSL setup completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Update your domain DNS to point to this server's IP"
echo "   2. Run: docker-compose up -d"
echo "   3. Test your site: https://${DOMAIN}"
echo "   4. Check SSL status: https://www.ssllabs.com/ssltest/"
