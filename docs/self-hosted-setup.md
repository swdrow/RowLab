# RowLab Self-Hosted Setup Guide

This guide covers deploying RowLab on your own infrastructure using Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/rowlab.git
cd rowlab
```

### 2. Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Application
NODE_ENV=production
PORT=3002
APP_URL=https://your-domain.com

# Database
POSTGRES_DB=rowlab
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Redis
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your_very_long_random_secret_at_least_32_chars
JWT_REFRESH_SECRET=another_very_long_random_secret_here

# Stripe (optional - for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose --profile migrate run migrate
```

### 4. Access RowLab

Open your browser to `http://localhost:3002` (or your configured domain).

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` for deployments |
| `PORT` | No | Server port (default: 3002) |
| `APP_URL` | Yes | Public URL of your RowLab instance |
| `DATABASE_URL` | Auto | Set by docker-compose |
| `REDIS_URL` | Auto | Set by docker-compose |
| `JWT_SECRET` | Yes | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (min 32 chars) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signature secret |

### Generating Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32
```

### Database Configuration

PostgreSQL 15 is included in docker-compose. Data is persisted in a Docker volume.

To use an external database:

1. Remove the `db` service from `docker-compose.yml`
2. Set `DATABASE_URL` directly:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

### Reverse Proxy (Nginx)

For production, place RowLab behind a reverse proxy:

```nginx
server {
    listen 80;
    server_name rowlab.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rowlab.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

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
}
```

## Stripe Setup (Optional)

To enable subscription billing:

### 1. Create Stripe Account

Sign up at [stripe.com](https://stripe.com) and get your API keys.

### 2. Create Products and Prices

In Stripe Dashboard:

1. Go to Products → Add Product
2. Create three products: Starter, Pro, Enterprise
3. Add monthly recurring prices for each
4. Copy the price IDs (e.g., `price_1ABC...`)

### 3. Configure Webhooks

1. Go to Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/v1/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret

### 4. Update Environment

```env
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_STARTER=price_starter_id
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_id
```

### 5. Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3002/api/v1/subscriptions/webhook
```

## Maintenance

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Backups

```bash
# Backup database
docker-compose exec db pg_dump -U postgres rowlab > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres rowlab < backup.sql
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run new migrations
docker-compose --profile migrate run migrate
```

### Health Checks

```bash
# Check application health
curl http://localhost:3002/health

# Check readiness (includes database)
curl http://localhost:3002/health/ready
```

## Scaling

### Horizontal Scaling

To run multiple app instances:

```yaml
# docker-compose.override.yml
services:
  app:
    deploy:
      replicas: 3
```

Use a load balancer (nginx, HAProxy, Traefik) in front.

### Resource Limits

```yaml
# docker-compose.override.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Troubleshooting

### Database Connection Failed

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify connection string
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### Migrations Failed

```bash
# Run migrations manually
docker-compose exec app npx prisma migrate deploy

# Reset database (WARNING: destroys data)
docker-compose exec app npx prisma migrate reset
```

### Container Won't Start

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs app --tail 100

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Security Recommendations

1. **Use HTTPS** - Always run behind a reverse proxy with TLS
2. **Strong Secrets** - Use randomly generated 32+ character secrets
3. **Firewall** - Only expose ports 80/443 publicly
4. **Updates** - Keep Docker and RowLab updated
5. **Backups** - Automated daily database backups
6. **Monitoring** - Set up health check monitoring

## Support

- GitHub Issues: [github.com/your-org/rowlab/issues](https://github.com/your-org/rowlab/issues)
- Documentation: [docs.rowlab.app](https://docs.rowlab.app)
