# RowLab Deployment Guide

This guide covers deploying RowLab to production.

## Quick Deployment

### 1. Install as systemd Service

```bash
cd /home/swd/RowLab
./scripts/install-service.sh
```

### 2. Deploy

```bash
./deploy.sh
```

This will:
- Install dependencies
- Build production bundle
- Start/restart the service
- Enable on boot

### 3. Verify

```bash
# Check service status
sudo systemctl status rowlab

# View logs
sudo journalctl -u rowlab -f

# Test endpoint
curl http://localhost:3002/api/health
```

---

## Manual Deployment Steps

### Step 1: Build Application

```bash
cd /home/swd/RowLab
npm install
npm run build
```

### Step 2: Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit as needed:
```env
PORT=3002
NODE_ENV=production
```

### Step 3: Install systemd Service

```bash
sudo cp config/rowlab.service /etc/systemd/system/rowlab.service
sudo systemctl daemon-reload
sudo systemctl enable rowlab
sudo systemctl start rowlab
```

### Step 4: Configure nginx

**Option A: Subdomain (Recommended)**

Create `/etc/nginx/sites-available/rowlab`:

```nginx
server {
    listen 443 ssl http2;
    server_name rowlab.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        proxy_pass http://localhost:3002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/rowlab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Option B: Subpath**

Add to existing server block in `/etc/nginx/sites-available/your-domain`:

```nginx
location /rowlab {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Step 5: Set Up SSL (if not already configured)

```bash
sudo certbot --nginx -d rowlab.yourdomain.com
```

---

## Service Management

### Common Commands

```bash
# Start service
sudo systemctl start rowlab

# Stop service
sudo systemctl stop rowlab

# Restart service
sudo systemctl restart rowlab

# Check status
sudo systemctl status rowlab

# View logs
sudo journalctl -u rowlab -f

# View recent errors
sudo journalctl -u rowlab -n 50 --no-pager
```

### Updating Application

After making code changes:

```bash
cd /home/swd/RowLab
git pull  # If using git
npm install  # If dependencies changed
npm run build
sudo systemctl restart rowlab
```

Or use the deploy script:
```bash
./deploy.sh
```

---

## Development vs Production

### Development

**Option 1: Single command (recommended)**
```bash
npm run dev:full
```

**Option 2: tmux session (persistent)**
```bash
npm run dev:tmux
```

**Option 3: Separate terminals**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run server
```

**Stop all development servers:**
```bash
npm stop
```

Access at `http://localhost:3001` (Vite dev server with HMR)

### Production

```bash
npm run build
npm start
```

Access at `http://localhost:3002` (Express serves built files)

---

## Monitoring

### Log Files

Systemd journal:
```bash
# Real-time logs
sudo journalctl -u rowlab -f

# Last 100 lines
sudo journalctl -u rowlab -n 100

# Today's logs
sudo journalctl -u rowlab --since today

# Logs with errors
sudo journalctl -u rowlab -p err
```

### Health Check

```bash
# Server health
curl http://localhost:3002/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-19T...","environment":"production"}
```

### Performance Monitoring

Monitor resource usage:
```bash
# Memory usage
ps aux | grep node

# Service statistics
systemctl status rowlab
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status rowlab

# Check logs for errors
sudo journalctl -u rowlab -n 50

# Common issues:
# 1. Port 3002 already in use
sudo lsof -i :3002
# Kill process if needed
sudo kill -9 <PID>

# 2. Permission issues
sudo chown -R swd:swd /home/swd/RowLab

# 3. Node.js not found
which node
# Update ExecStart path in rowlab.service if needed
```

### nginx Errors

```bash
# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Headshots Not Loading

```bash
# Verify directory exists
ls -lah /home/swd/Rowing/Roster_Headshots_cropped/

# Check permissions
sudo chmod -R 755 /home/swd/Rowing/Roster_Headshots_cropped/

# Test endpoint
curl -I http://localhost:3002/api/headshots/Smith
```

### Build Failures

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force

# Try build again
npm run build
```

---

## Backup Strategy

### What to Backup

1. **Source Code**: Already in `/home/swd/RowLab/` (consider git repository)
2. **Data Files**:
   - `/home/swd/Rowing/LN_Country.csv`
   - `/home/swd/Rowing/Roster_Headshots_cropped/`
3. **Configuration**:
   - `.env` file
   - nginx configuration
   - systemd service file

### Backup Commands

```bash
# Backup data
tar -czf rowlab-data-backup-$(date +%Y%m%d).tar.gz \
  /home/swd/Rowing/LN_Country.csv \
  /home/swd/Rowing/Roster_Headshots_cropped/

# Backup configuration
tar -czf rowlab-config-backup-$(date +%Y%m%d).tar.gz \
  /home/swd/RowLab/.env \
  /etc/nginx/sites-available/rowlab \
  /etc/systemd/system/rowlab.service
```

---

## Security Considerations

### 1. Add nginx Authentication (Optional)

```bash
# Install htpasswd utility
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd coach

# Add to nginx location block:
auth_basic "RowLab Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

### 2. Firewall Configuration

```bash
# Allow nginx (if not already)
sudo ufw allow 'Nginx Full'

# Block direct access to port 3002 from outside
sudo ufw deny 3002/tcp
```

### 3. Update Dependencies Regularly

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild and redeploy
npm run build
sudo systemctl restart rowlab
```

---

## Performance Optimization

### 1. Enable Compression in nginx

```nginx
# Add to server block
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. Cache Static Assets

Already configured in example nginx config. Verify:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Monitor Memory Usage

```bash
# Check Node.js memory
ps aux | grep node

# If using too much memory, restart service
sudo systemctl restart rowlab
```

---

## Scaling Considerations

### Current Setup
- Single Node.js process
- Suitable for 1-10 concurrent users
- ~50-100MB memory usage

### If More Performance Needed

#### Option 1: PM2 Process Manager
```bash
npm install -g pm2
pm2 start server/index.js --name rowlab -i max
pm2 startup
pm2 save
```

#### Option 2: Reverse Proxy Load Balancing
Run multiple instances on different ports, balance with nginx.

#### Option 3: Database Backend
Replace localStorage with PostgreSQL for shared state.

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop service
sudo systemctl stop rowlab

# 2. Restore previous build (if backed up)
cd /home/swd/RowLab
rm -rf dist/
tar -xzf dist-backup-YYYYMMDD.tar.gz

# 3. Restart service
sudo systemctl start rowlab

# 4. Check status
sudo systemctl status rowlab
```

---

## Support

For issues or questions:
1. Check [PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)
2. Review logs: `sudo journalctl -u rowlab -f`
3. Contact project maintainer

---

**Last Updated:** 2025-10-19
