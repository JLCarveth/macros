# Deployment

Production deployment files for Nutrition Llama.

## Prerequisites

- Deno installed at `/usr/local/bin/deno`
- PostgreSQL running
- nginx installed
- Service user and group created

### Create service user

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin macros
```

## Installation

### 1. Deploy application

```bash
# Create application directory
sudo mkdir -p /opt/macros
sudo cp -r . /opt/macros/
sudo chown -R macros:macros /opt/macros

# Create Deno cache directory
sudo mkdir -p /opt/macros/.deno
sudo chown macros:macros /opt/macros/.deno
```

### 2. Configure environment

```bash
sudo cp .env.example /opt/macros/.env
sudo chown macros:macros /opt/macros/.env
sudo chmod 600 /opt/macros/.env
sudo nano /opt/macros/.env
```

Required variables:
```bash
# Database
PGHOST=localhost
PGPORT=5432
PGUSER=nutrition_llama
PGPASSWORD=your_secure_password
PGDATABASE=nutrition_llama

# Auth
ACCESS_TOKEN_SECRET=<32-byte-secret>
REFRESH_TOKEN_SECRET=<32-byte-secret>

# API (for web frontend)
NUTRITION_API_URL=http://localhost:3000

# LLM (for API service)
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=your-api-key
LLM_MODEL=gpt-4o-mini
```

### 3. Install systemd services

```bash
# Copy service files
sudo cp deploy/nutrition-llama-api.service /etc/systemd/system/
sudo cp deploy/nutrition-llama-web.service /etc/systemd/system/

# Reload and enable
sudo systemctl daemon-reload
sudo systemctl enable nutrition-llama-api nutrition-llama-web
sudo systemctl start nutrition-llama-api nutrition-llama-web
```

### 4. Configure nginx

```bash
# Copy nginx config
sudo cp deploy/nginx-macros.jlcarveth.dev.conf /etc/nginx/sites-available/macros.jlcarveth.dev
sudo ln -s /etc/nginx/sites-available/macros.jlcarveth.dev /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot certonly --nginx -d macros.jlcarveth.dev

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Management

```bash
# Status
sudo systemctl status nutrition-llama-api
sudo systemctl status nutrition-llama-web

# Logs
sudo journalctl -u nutrition-llama-api -f
sudo journalctl -u nutrition-llama-web -f

# Restart after updates
sudo systemctl restart nutrition-llama-api nutrition-llama-web
```

## Updating

```bash
# Pull latest code
cd /opt/macros
sudo -u macros git pull

# Restart services
sudo systemctl restart nutrition-llama-api nutrition-llama-web
```
