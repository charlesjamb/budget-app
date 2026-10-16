# Deploying the Budget App on your VPS

## Prerequisites

- A VPS with Docker and Docker Compose installed
- SSL certificates (Let's Encrypt) for your domain
- SSH access to the VPS
- Nothing else: Node 26 and pnpm run inside the Docker image, so the VPS does not need Node or pnpm installed

## Step 1 — SSH into your VPS

```bash
ssh ubuntu@YOUR_VPS_IP -p YOUR_SSH_PORT
```

## Step 2 — Stop the old app

```bash
cd ~/budget-app
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
rsync -avz -e "ssh -p YOUR_SSH_PORT" --exclude node_modules --exclude .git \
  ~/workspace/budget-app/ \
  ubuntu@YOUR_VPS_IP:~/budget-app/
```

Then on the VPS:

```bash
cd ~/budget-app
```

## Step 4 — Check SSL certificates

Verify your Let's Encrypt certs are still in place:

```bash
ls /etc/letsencrypt/live/mathildeetcharles.online/
```

You should see `fullchain.pem` and `privkey.pem`.

**Important:** `nginx.conf` carries the real domain (`mathildeetcharles.online`). The certificate
paths must match your Let's Encrypt layout — the live directory is named after the cert's primary
domain. If nginx fails with `cannot load certificate ... fullchain.pem (No such file or directory)`,
check the actual directory name and align `nginx.conf` with it:

```bash
ls /etc/letsencrypt/live/
```

If the cert path is different, update `docker-compose.yml` accordingly:

```bash
find /etc -name "fullchain.pem" 2>/dev/null
```

## Step 5 — Build and start

```bash
cd ~/budget-app
docker compose up -d --build
```

First build takes a few minutes (downloading images, installing deps). The native modules
(bcrypt, better-sqlite3) ship prebuilt for Node-API, so nothing compiles on the VPS.

## Step 6 — Create user accounts

```bash
export CHARLES_EMAIL='charles@example.com'
export CHARLES_PASSWORD='yourpassword'
export MATHILDE_EMAIL='mathilde@example.com'
export MATHILDE_PASSWORD='yourpassword'
docker compose exec -e CHARLES_EMAIL -e CHARLES_PASSWORD \
  -e MATHILDE_EMAIL -e MATHILDE_PASSWORD \
  -e DB_PATH=/app/data/budget.db \
  app node packages/backend/dist/scripts/seed.js
```

Replace the email and password values with your real ones. Use single quotes around values to avoid bash interpreting special characters (`!`, `@`, etc.). This only needs to be run once.

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

Open **https://mathildeetcharles.online** in your browser.

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
