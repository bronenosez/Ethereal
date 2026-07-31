# Deploying Ethereal (VPS + Docker)

One `docker compose` stack: **PostgreSQL** + **FastAPI/Playwright backend** +
**Caddy** (serves the built SPA, proxies `/api`, and gets HTTPS automatically).

```
                    ┌──────────── Caddy (:80/:443, auto-HTTPS) ───────────┐
   browser ───────▶ │  /            → static SPA (dist)                    │
                    │  /api/*       → backend:8000 (prefix stripped)       │
                    └──────────────────────────┬──────────────────────────┘
                                               ▼
                                     FastAPI backend ──▶ PostgreSQL (db)
```

## Prerequisites

- A Linux VPS (Ubuntu 22.04+), **2 GB RAM or more** (Chromium is memory-hungry).
- A domain with an **A record pointing to the server IP**.
- Ports **80** and **443** open.
- Docker + Compose plugin installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

## Deploy

```bash
git clone https://github.com/bronenosez/Ethereal.git
cd Ethereal/deploy
cp .env.example .env
nano .env                       # set DOMAIN, ACME_EMAIL, passwords, SECRET_KEY
docker compose up -d --build
```

First build takes a few minutes (Playwright image + frontend build). Then:

- Site: `https://<DOMAIN>`
- Admin: `https://<DOMAIN>/login` → sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- API health: `https://<DOMAIN>/api/health`

The database and admin user are created automatically on first startup, and the
demo catalogue is seeded if the products table is empty.

## Updating after a push

```bash
cd Ethereal && git pull
cd deploy && docker compose up -d --build
```

## Operations

```bash
docker compose ps                 # status
docker compose logs -f backend    # backend logs (parser tracebacks, etc.)
docker compose logs -f web        # Caddy / TLS logs
docker compose down               # stop (keeps volumes/data)
```

Data lives in named volumes (`pgdata`, `caddy_data`); it survives restarts and
rebuilds. To back up the database:

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

## Notes / hardening

- **Generate a fresh `SECRET_KEY`** and strong passwords — do not reuse the
  example values (the repo's example key is public).
- The DB port is not published to the host; it's only reachable inside the
  Compose network.
- To change the domain later, edit `.env` and rebuild `web` (the API URL is
  baked into the frontend at build time).
- If a parse request is killed for memory on a 1 GB box, resize to 2 GB+ or add
  swap.
