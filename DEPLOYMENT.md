# 2bReady — Production Deployment Guide

Step-by-step guide to deploy 2bReady on a fresh Ubuntu server.

---

## 1. Server Requirements

| Resource | Minimum |
|---|---|
| OS | Ubuntu 22.04 LTS or 24.04 LTS |
| CPU | 2 vCPUs |
| RAM | 4 GB (8 GB recommended) |
| Storage | 40 GB SSD |
| Network | Public IP with ports 80/443 open |

---

## 2. Initial Server Setup

SSH into your server as root:

```bash
ssh root@YOUR_SERVER_IP
```

### 2.1 Update system

```bash
apt update && apt upgrade -y
```

### 2.2 Create a deploy user

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to deploy user
su - deploy
```

### 2.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group (already done above, but verify)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
ssh deploy@YOUR_SERVER_IP

# Verify Docker works
docker --version
docker compose version
```

### 2.4 Install Make

```bash
sudo apt install -y make
```

---

## 3. Clone the Repository

```bash
cd /home/deploy
git clone https://github.com/thyvon/2bready.git
cd 2bready
```

---

## 4. Configure Environment

### 4.1 Create the production env file

```bash
cp .env.production.example .env.production
```

### 4.2 Generate secrets

```bash
# APP_KEY
docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));"

# DB_PASSWORD
openssl rand -base64 32

# REDIS_PASSWORD
openssl rand -base64 32
```

### 4.3 Edit the env file

```bash
nano .env.production
```

Fill in all required values:

```bash
# Paste the generated APP_KEY
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Domain (update if different)
APP_URL=https://2bready.systemsolution.online
SANCTUM_STATEFUL_DOMAINS=2bready.systemsolution.online
FRONTEND_URL=https://2bready.systemsolution.online/portal
ADMIN_FRONTEND_URL=https://2bready.systemsolution.online/admin
NEXT_PUBLIC_API_URL=https://2bready.systemsolution.online

# Database (use the generated password)
DB_DATABASE=2bready
DB_USERNAME=2bready
DB_PASSWORD=your_generated_password_here

# Redis (use the generated password)
REDIS_PASSWORD=your_generated_password_here

# Cloudflare Tunnel (see Step 5)
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token_here
```

Save and exit: `Ctrl+X`, `Y`, `Enter`.

---

## 5. Cloudflare Tunnel Setup

### 5.1 Create the tunnel

1. Go to [Cloudflare Dashboard](https://one.dash.cloudflare.com)
2. Navigate to **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Select **Cloudflared** connector type
5. Name your tunnel: `2bready-prod`
6. Click **Create tunnel**

### 5.2 Get the tunnel token

On the tunnel's **Overview** page, you'll see installation instructions. Copy the token from this command:

```bash
cloudflared service install eyJhIjoixxxxxxxxxxxxxxxxxxxxxxxx...
```

The token is everything after `eyJhIjoix...` (the long string).

### 5.3 Configure the token

Paste the token into your `.env.production`:

```bash
nano .env.production
```

```
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoixxxxxxxxxxxxxxxxxxxxxxxx...
```

### 5.4 Set up DNS routing

In the tunnel's **Public Hostnames** tab:

1. Click **Add a public hostname**
2. Set **Subdomain**: `2bready` (or leave empty for root domain)
3. Set **Domain**: `systemsolution.online`
4. Set **Service Type**: `HTTP`
5. Set **URL**: `nginx:80`
6. Click **Save hostname**

This routes `https://2bready.systemsolution.online` → `nginx:80` inside your Docker network.

---

## 6. Build and Deploy

### 6.1 First-time build

```bash
cd /home/deploy/2bready
make prod
```

This will:
1. Pull Docker base images
2. Build the API container (PHP-FPM + Nginx + Supervisor)
3. Build all 4 Next.js apps (admin, client, tp, marketing)
4. Start all 9 containers
5. Run database migrations
6. Seed the database

**First build takes 5-10 minutes.** Grab a coffee.

### 6.2 Verify deployment

```bash
# Check all containers are running
make status

# Check health endpoint
curl -s https://2bready.systemsolution.online/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 6.3 Create the first admin user

```bash
make shell-api
php artisan tinker
```

```php
// Inside Tinker
$user = \App\Models\User::factory()->create([
    'name' => 'Admin',
    'email' => 'admin@yourdomain.com',
    'password' => bcrypt('YourSecurePassword123!'),
    'email_verified_at' => now(),
]);
$user->assignRole('admin');
exit
```

```bash
exit
```

Now log in at `https://2bready.systemsolution.online/admin`.

---

## 7. Post-Deploy Checklist

| Task | Command |
|---|---|
| Verify containers | `make status` |
| Check API health | `curl https://2bready.systemsolution.online/health` |
| Check logs | `make logs` |
| Check Horizon (queue worker) | `make shell-api && php artisan horizon:status` |
| Test admin login | Open `/admin` in browser |
| Test client portal | Open `/portal` in browser |
| Test marketing site | Open `/` in browser |

---

## 8. SSL/TLS

TLS is handled by Cloudflare. No server-side certificates needed.

If you need to use **Let's Encrypt** instead (without Cloudflare):

1. Install certbot on the host:
   ```bash
   sudo apt install -y certbot
   ```

2. Uncomment the port mapping in `docker-compose.prod.yml`:
   ```yaml
   nginx:
     ports:
       - '80:80'
       - '443:443'
   ```

3. Add SSL volumes to nginx service:
   ```yaml
   volumes:
     - ./devops/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
     - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

4. Update `devops/nginx/nginx.conf` to listen on 443 with SSL.

5. Run certbot:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

---

## 9. Backups

### 9.1 Database backup

```bash
# Manual backup
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres pg_dump -U 2bready 2bready > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U 2bready 2bready
```

### 9.2 Automated daily backup (cron)

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /home/deploy/2bready && docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres pg_dump -U 2bready 2bready | gzip > /home/deploy/backups/2bready_$(date +\%Y\%m\%d).sql.gz

# Create the backups directory
mkdir -p /home/deploy/backups
```

### 9.3 Backup retention (keep 30 days)

```bash
# Add to crontab (runs at 3 AM daily)
0 3 * * * find /home/deploy/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 10. Monitoring

### 10.1 Check container health

```bash
# All containers
make status

# Specific service logs
make logs-api
make logs-web

# Real-time logs
make logs
```

### 10.2 Check Horizon (queue worker)

```bash
make shell-api
php artisan horizon:status
php artisan horizon:workers
```

### 10.3 Check Redis

```bash
make shell-api
php artisan tinker
```

```php
Redis::ping();  // Should return "+PONG"
```

### 10.4 System resources

```bash
# Disk usage
df -h

# Docker disk usage
docker system df

# Container resource usage
docker stats
```

---

## 11. Updating

### 11.1 Code updates

```bash
cd /home/deploy/2bready
git pull origin main
make prod
```

### 11.2 With database migrations

```bash
git pull origin main
make migrate
make seed   # if new seeders included
```

### 11.3 Full rebuild (dependencies changed)

```bash
make prod-build
make prod
```

---

## 12. Troubleshooting

### Containers won't start

```bash
# Check status
make status

# Check specific container logs
docker compose -f docker-compose.prod.yml --env-file .env.production logs nginx
docker compose -f docker-compose.prod.yml --env-file .env.production logs api
```

### Port 80/443 already in use

If aaPanel or another web server is running:

```bash
# Find what's using port 80
sudo lsof -i :80

# Stop the conflicting service
sudo systemctl stop nginx   # or apache2, etc.

# Or use a different port (update .env.production)
NGINX_PORT=8082
```

### Database connection refused

```bash
# Check PostgreSQL
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres pg_isready

# Restart PostgreSQL
docker compose -f docker-compose.prod.yml --env-file .env.production restart postgres
```

### Redis connection refused

```bash
# Check Redis
docker compose -f docker-compose.prod.yml --env-file .env.production exec redis redis-cli -a YOUR_PASSWORD ping

# Restart Redis
docker compose -f docker-compose.prod.yml --env-file .env.production restart redis
```

### Horizon not processing jobs

```bash
# Check Horizon status
make shell-api
php artisan horizon:status

# Restart Horizon
php artisan horizon:terminate
# Supervisor will auto-restart it
```

### Next.js apps show 404

```bash
# Check nginx config
docker compose -f docker-compose.prod.yml --env-file .env.production exec nginx nginx -t

# Restart nginx
docker compose -f docker-compose.prod.yml --env-file .env.production restart nginx
```

### Out of disk space

```bash
# Check usage
docker system df

# Clean up
docker system prune -a --volumes
```

### Cloudflare Tunnel not connecting

```bash
# Check cloudflared logs
docker compose -f docker-compose.prod.yml --env-file .env.production logs cloudflared

# Verify token is correct in .env.production
grep CLOUDFLARE_TUNNEL_TOKEN .env.production
```

---

## 13. Security Hardening

### 13.1 Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS (if not using Cloudflare Tunnel)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 13.2 Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 13.3 Automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 14. Server Layout

```
/home/deploy/
├── 2bready/                  # Application code
│   ├── docker-compose.prod.yml
│   ├── .env.production       # Secrets (not in git)
│   ├── Makefile
│   ├── devops/               # Nginx, PHP, Supervisor configs
│   ├── 2bready-api/          # Laravel API
│   └── 2bready-web/          # Next.js apps
└── backups/                  # Database backups (auto-created)
```

---

## 15. Quick Reference

| Task | Command |
|---|---|
| Deploy | `make prod` |
| Stop | `make stop` |
| Restart | `make prod` (after `make stop`) |
| View logs | `make logs` |
| Run migrations | `make migrate` |
| Shell into API | `make shell-api` |
| Check status | `make status` |
| Full rebuild | `make prod-build && make prod` |

---

## 16. Support

- **GitHub Issues:** https://github.com/thyvon/2bready/issues
- **Architecture:** `Project Documents/2bReady_MVP_Proposal_v3.md`
- **API Rules:** `2bready-api/CLAUDE.md`
- **Frontend Rules:** `AGENTS.md`
