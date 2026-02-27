# Deploying the Budget App on your VPS

## Prerequisites

- A VPS with Docker and Docker Compose installed
- SSL certificates (Let's Encrypt) for your domain
- SSH access to the VPS

## Step 1 — SSH into your VPS

```bash
ssh root@your-domain.example
```

## Step 2 — Stop the old app

```bash
cd /path/to/baby-vote
docker compose down
```

Verify nothing is running:

```bash
docker ps
```

## Step 3 — Get your code onto the VPS

**Option A — From GitHub:**

```bash
cd ~
git clone https://github.com/your-username/budget-app.git
cd budget-app
```

**Option B — From your local machine (run this locally, not on the VPS):**

```bash
rsync -avz --exclude node_modules --exclude .git \
  ~/workspace/budget-app/ \
  root@your-domain.example:~/budget-app/
```

Then on the VPS:

```bash
cd ~/budget-app
```

## Step 4 — Check SSL certificates

Verify your Let's Encrypt certs are still in place:

```bash
ls /etc/letsencrypt/live/your-domain.example/
```

You should see `fullchain.pem` and `privkey.pem`.

If the path is different, find them and update `docker-compose.yml` accordingly:

```bash
find /etc -name "fullchain.pem" 2>/dev/null
```

## Step 5 — Build and start

```bash
cd ~/budget-app
docker compose up -d --build
```

First build takes a few minutes (downloading images, installing deps, compiling).

## Step 6 — Create user accounts

```bash
CHARLES_EMAIL=charles@example.com CHARLES_PASSWORD=yourpassword \
MATHILDE_EMAIL=mathilde@example.com MATHILDE_PASSWORD=yourpassword \
docker compose exec -e CHARLES_EMAIL -e CHARLES_PASSWORD \
  -e MATHILDE_EMAIL -e MATHILDE_PASSWORD \
  -e DB_PATH=/app/data/budget.db \
  app node packages/backend/dist/scripts/seed.js
```

Replace the email and password values with your real ones. This only needs to be run once.

## Step 7 — Verify

Check containers are running:

```bash
docker compose ps
```

Check logs if something is wrong:

```bash
docker compose logs        # all logs
docker compose logs app    # app only
docker compose logs nginx  # nginx only
```

Open **https://your-domain.example** in your browser.

## Useful commands

```bash
# Watch logs in real time (Ctrl+C to stop)
docker compose logs -f

# Restart after a code update
git pull
docker compose up -d --build

# Stop the app
docker compose down

# Stop the app AND delete the database (careful!)
docker compose down -v
```
