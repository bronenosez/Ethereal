# Ethereal Admin Backend (FastAPI + PostgreSQL)

Small API that powers the Ethereal admin panel:

- **Authentication** — JWT login for the admin account. The storefront's `Admin`
  button and the `/admin` page are only reachable once you log in.
- **AliExpress parsing** — wraps the scraper (moved here from the project-root
  `main.py`) behind a protected `POST /parse` endpoint. The admin panel calls it
  and imports the results as product cards.

## Requirements

- Python 3.10+
- A running PostgreSQL instance
- Playwright's Chromium (installed once, see below)

## Setup

```bash
cd backend
py -m venv .venv                 # Windows: use the `py` launcher
.venv\Scripts\activate           # PowerShell / cmd
# source .venv/bin/activate      # macOS / Linux

pip install -r requirements.txt
playwright install chromium      # one-time browser download for the parser

copy .env.example .env           # then edit .env (DB url, SECRET_KEY, admin pw)
```

### Create the database

With `psql` (adjust user/password to match `DATABASE_URL` in `.env`):

```sql
CREATE USER ethereal WITH PASSWORD 'ethereal';
CREATE DATABASE ethereal OWNER ethereal;
```

Tables and the bootstrap admin user are created automatically on first startup
(from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`).

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

## Endpoints

| Method | Path                  | Auth   | Purpose                                        |
|--------|-----------------------|--------|------------------------------------------------|
| POST   | `/auth/login`         | —      | `{username, password}` → `{access_token}`      |
| GET    | `/auth/me`            | Bearer | Verify the token, return the current admin     |
| POST   | `/parse`              | Bearer | `{url, pages}` → scraped AliExpress products   |
| GET    | `/products`           | —      | List all storefront products                   |
| POST   | `/products`           | Bearer | Create one product                             |
| POST   | `/products/bulk`      | Bearer | Create many products (`{products: [...]}`)     |
| POST   | `/products/bulk-delete` | Bearer | Delete many: `{ids: [...]}` or `{all: true}` |
| PUT    | `/products/{id}`      | Bearer | Update a product (partial fields allowed)      |
| DELETE | `/products/{id}`      | Bearer | Delete a product                               |
| GET    | `/health`             | —      | Liveness probe                                 |

Storefront products are stored in the `products` table. On first startup (empty
table) the demo catalogue from `app/seed_data.py` is inserted so the store isn't
blank. Reads are public; every create/update/delete requires the admin token.

`POST /parse` expects an AliExpress `/wholesale` search URL, e.g.
`https://aliexpress.ru/wholesale?SearchText=serum`, and walks `pages` pages
(1–20) starting from the first.

## Security notes

- Change `SECRET_KEY` and `ADMIN_PASSWORD` before deploying anywhere real.
- The parser drives a headless browser; keep `PARSER_HEADLESS=true` on servers.
- Passwords are stored bcrypt-hashed; the plaintext admin password only lives in
  `.env` and is used once to seed the account.
