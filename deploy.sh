#!/bin/bash
set -e

echo "🚀 Starting CV Resume Generator deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Zebratic/cv-resume-generator.git"
APP_DIR="/opt/cv-resume-generator"
APP_USER="cv-generator"
PORT=3000

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt-get install -y -qq curl git build-essential

# Install Node.js 20.x (LTS)
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt "20" ]; then
    echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

# Verify Node.js installation
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} installed${NC}"
echo -e "${GREEN}✓ npm ${NPM_VERSION} installed${NC}"

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
fi
echo -e "${GREEN}✓ PM2 installed${NC}"

# Create application user if it doesn't exist
if ! id "$APP_USER" &>/dev/null; then
    echo -e "${YELLOW}👤 Creating application user...${NC}"
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER" || true
fi

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating repository...${NC}"
    cd "$APP_DIR"
    sudo -u "$APP_USER" git fetch origin
    sudo -u "$APP_USER" git reset --hard origin/main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --production=false

# Build Next.js application
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
sudo -u "$APP_USER" npm run build

# Stop existing PM2 process if running
if pm2 list | grep -q "cv-resume-generator"; then
    echo -e "${YELLOW}🛑 Stopping existing application...${NC}"
    pm2 stop cv-resume-generator || true
    pm2 delete cv-resume-generator || true
fi

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    ufw allow $PORT/tcp comment "CV Resume Generator" || true
fi

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}Application Information:${NC}"
echo -e "  📍 Local:    http://localhost:$PORT"
echo -e "  🌐 Network:  http://$IP_ADDRESS:$PORT"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo -e "  View logs:     pm2 logs cv-resume-generator"
echo -e "  Restart:       pm2 restart cv-resume-generator"
echo -e "  Stop:          pm2 stop cv-resume-generator"
echo -e "  Status:        pm2 status"
echo ""
